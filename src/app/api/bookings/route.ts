import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { BookingsRepo } from '@/shared/lib/bookingsRepo';
import { getServiceClient } from '@/shared/utils/supabase/service';
import { computeBookingTotal, isValidDateString } from '@/shared/lib/bookingPricing';
import type { DealType, PricePeriod } from '@/shared/types/listing';

export async function GET() {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const bookings = await BookingsRepo.listForGuest(session.userId);
        return NextResponse.json({ bookings }, { status: 200 });
    } catch (e) {
        console.error('[GET /api/bookings]', e);
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
    const listingId = typeof b.listingId === 'string' ? b.listingId : '';
    const startDate = b.startDate;
    const endDate = b.endDate;
    const guestsCount = Number.isFinite(b.guestsCount as number) ? Math.max(1, Math.floor(b.guestsCount as number)) : 1;
    const notes = typeof b.notes === 'string' && b.notes.trim() ? b.notes.trim().slice(0, 500) : null;

    if (!listingId) return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
        return NextResponse.json({ error: 'startDate and endDate must be ISO dates (YYYY-MM-DD)' }, { status: 400 });
    }
    if (startDate >= endDate) {
        return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: listing, error: listingErr } = await supabase
        .from('listings')
        .select('id, deal_type, price, price_period, user_id')
        .eq('id', listingId)
        .maybeSingle();
    if (listingErr) {
        console.error('[POST /api/bookings] listing lookup', listingErr);
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

    const overlap = await BookingsRepo.hasOverlap(listingId, startDate, endDate);
    if (overlap) {
        return NextResponse.json({ error: 'These dates are already booked' }, { status: 409 });
    }

    const { total } = computeBookingTotal(dealType, Number(listing.price), startDate, endDate);

    try {
        const booking = await BookingsRepo.create({
            listingId,
            guestId: session.userId,
            hostId: (listing.user_id as string | null) ?? null,
            startDate,
            endDate,
            guestsCount,
            totalPrice: total,
            notes,
        });
        return NextResponse.json({ booking }, { status: 201 });
    } catch (e) {
        console.error('[POST /api/bookings]', e);
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }
}
