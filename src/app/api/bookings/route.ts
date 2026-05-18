import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { BookingsRepo } from '@/shared/lib/bookingsRepo';
import { getServiceClient } from '@/shared/utils/supabase/service';
import { computeBookingTotal, isValidDateString } from '@/shared/lib/bookingPricing';
import { EventPublisher } from '@/shared/lib/events/publisher';
import { Events } from '@/shared/lib/events/types';
import { logger } from '@/shared/lib/logger/logger';
import { metrics } from '@/shared/lib/metrics/prometheus';
import type { DealType } from '@/shared/types/listing';

export const runtime = 'nodejs';

export async function GET() {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const bookings = await BookingsRepo.listForGuest(session.userId);
        return NextResponse.json({ bookings }, { status: 200 });
    } catch (e) {
        logger.error('[GET /api/bookings] failed', e as Error);
        return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const listingId   = typeof b.listingId === 'string' ? b.listingId : '';
    const startDate   = b.startDate;
    const endDate     = b.endDate;
    const guestsCount = Number.isFinite(b.guestsCount as number) ? Math.max(1, Math.floor(b.guestsCount as number)) : 1;
    const notes       = typeof b.notes === 'string' && b.notes.trim() ? b.notes.trim().slice(0, 500) : null;

    if (!listingId) return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
        return NextResponse.json({ error: 'startDate and endDate must be ISO dates (YYYY-MM-DD)' }, { status: 400 });
    }
    if (startDate >= endDate) {
        return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
    }

    const correlationId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const log = logger.child({ correlationId, listingId, userId: session.userId });

    const supabase = getServiceClient();

    // Load listing for validation
    const { data: listing, error: listingErr } = await supabase
        .from('listings')
        .select('id, deal_type, price, price_period, user_id')
        .eq('id', listingId)
        .maybeSingle();

    if (listingErr) {
        log.error('Listing lookup failed', listingErr);
        return NextResponse.json({ error: 'Failed to load listing' }, { status: 500 });
    }
    if (!listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const dealType = listing.deal_type as DealType;
    if (dealType === 'sale') {
        return NextResponse.json({ error: 'Sale listings cannot be booked' }, { status: 400 });
    }
    if (listing.user_id === session.userId) {
        return NextResponse.json({ error: 'You cannot book your own listing' }, { status: 400 });
    }

    const { total } = computeBookingTotal(dealType, Number(listing.price), startDate as string, endDate as string);

    // Try to create via DB function (uses advisory lock + EXCLUDE constraint)
    // Falls back to application-level overlap check if function not available.
    try {
        const { data: fnResult, error: fnErr } = await supabase.rpc('hs_create_booking', {
            p_property_id:  listingId,
            p_guest_id:     session.userId,
            p_host_id:      listing.user_id ?? null,
            p_date_from:    startDate,
            p_date_to:      endDate,
            p_guests_count:   guestsCount,
            p_total_price:    total,
            p_guest_message:  notes,
            p_correlation_id: correlationId,
        });

        if (fnErr) {
            // PG raise_exception codes we handle explicitly
            if (fnErr.code === 'P0001') {
                // hs_create_booking raises 'DATES_OVERLAP' for conflicts
                metrics.bookingConflict();
                log.warn('Booking conflict via DB function', { message: fnErr.message });
                return NextResponse.json(
                    { error: 'These dates are already booked' },
                    { status: 409 },
                );
            }
            throw fnErr;
        }

        // DB function returns the full hs_bookings row
        const bookingId = (fnResult as { id?: string } | null)?.id ?? String(fnResult);

        const resolvedId = typeof bookingId === 'string' ? bookingId : String(bookingId);
        try {
            await EventPublisher.publish(
                Events.bookingCreated(
                    {
                        bookingId:  resolvedId,
                        propertyId: listingId,
                        guestId:    session.userId,
                        hostId:     listing.user_id ?? '',
                        dateFrom:   startDate as string,
                        dateTo:     endDate as string,
                        totalPrice: total,
                        currency:   'RUB',
                    },
                    correlationId,
                ),
            );
        } catch (publishErr) {
            const e = publishErr as { message?: string };
            log.warn('Outbox publish failed (non-fatal)', { error: e?.message });
        }

        log.info('Booking created via DB function', { bookingId });
        return NextResponse.json({ booking: { id: bookingId } }, { status: 201 });

    } catch (fnCallErr) {
        // hs_create_booking function not yet deployed — fall back to application-level path
        const err = fnCallErr as { code?: string; message?: string; details?: string; hint?: string };
        const isMissingFn =
            err?.code === '42883' ||          // PostgreSQL: undefined_function
            err?.code === 'PGRST202' ||       // PostgREST: RPC not found
            err?.message?.includes('does not exist') ||
            err?.message?.includes('Could not find the function');

        if (!isMissingFn) {
            log.error('Unexpected error from hs_create_booking', undefined, {
                error: { code: err?.code, message: err?.message, details: err?.details, hint: err?.hint },
            });
            return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
        }

        log.warn('hs_create_booking not found — using application-level fallback');
    }

    // Application-level fallback (pre-migration path)
    const overlap = await BookingsRepo.hasOverlap(listingId, startDate as string, endDate as string);
    if (overlap) {
        metrics.bookingConflict();
        return NextResponse.json({ error: 'These dates are already booked' }, { status: 409 });
    }

    let booking: Awaited<ReturnType<typeof BookingsRepo.create>>;
    try {
        booking = await BookingsRepo.create({
            listingId,
            guestId:    session.userId,
            hostId:     (listing.user_id as string | null) ?? null,
            startDate:  startDate as string,
            endDate:    endDate as string,
            guestsCount,
            totalPrice: total,
            notes,
        });
    } catch (e) {
        log.error('Booking create failed', e as Error);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    try {
        await EventPublisher.publish(
            Events.bookingCreated(
                {
                    bookingId:  booking.id,
                    propertyId: listingId,
                    guestId:    session.userId,
                    hostId:     listing.user_id ?? '',
                    dateFrom:   startDate as string,
                    dateTo:     endDate as string,
                    totalPrice: total,
                    currency:   'RUB',
                },
                correlationId,
            ),
        );
    } catch (publishErr) {
        const e = publishErr as { message?: string };
        log.warn('Outbox publish failed (non-fatal)', { error: e?.message });
    }

    log.info('Booking created via fallback path', { bookingId: booking.id });
    return NextResponse.json({ booking }, { status: 201 });
}
