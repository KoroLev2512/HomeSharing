import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';
import type { BookingStatus, IBookingWithListing } from '@/shared/types/booking';
import type { DealType, PricePeriod, PropertyType } from '@/shared/types/listing';

const SELECT_WITH_LISTING =
    '*, listing:listings(id, title, images, address, city, price, price_period, deal_type, property_type)';

export async function GET(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    try {
        const supabase = getServiceClient();
        let q = supabase.from('bookings').select(SELECT_WITH_LISTING).order('created_at', { ascending: false }).limit(200);
        if (status) q = q.eq('status', status);

        const { data, error } = await q;
        if (error) throw error;

        const bookings: IBookingWithListing[] = (data ?? []).map((row: any) => ({
            id: row.id,
            listingId: row.listing_id,
            guestId: row.guest_id,
            hostId: row.host_id,
            startDate: row.start_date,
            endDate: row.end_date,
            guestsCount: Number(row.guests_count),
            totalPrice: Number(row.total_price),
            currency: row.currency,
            status: row.status as BookingStatus,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            listing: {
                id: row.listing?.id ?? row.listing_id,
                title: row.listing?.title ?? '—',
                images: row.listing?.images ?? [],
                address: row.listing?.address ?? '',
                city: row.listing?.city ?? '',
                price: row.listing ? Number(row.listing.price) : 0,
                pricePeriod: (row.listing?.price_period as PricePeriod) ?? null,
                dealType: (row.listing?.deal_type as DealType) ?? 'rent_long',
                propertyType: (row.listing?.property_type as PropertyType) ?? 'flat',
            },
        }));

        return NextResponse.json({ bookings });
    } catch (e) {
        console.error('[GET /api/admin/bookings]', e);
        return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
    }
}
