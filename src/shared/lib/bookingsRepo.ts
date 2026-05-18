import { getServiceClient } from '@/shared/utils/supabase/service';
import type { BookingStatus, IBooking, IBookingWithListing } from '@/shared/types/booking';
import type { DealType, PricePeriod, PropertyType } from '@/shared/types/listing';

interface BookingRow {
    id: string;
    listing_id: string;
    guest_id: string;
    host_id: string | null;
    start_date: string;
    end_date: string;
    guests_count: number;
    total_price: number;
    currency: string;
    status: BookingStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface ListingSummaryRow {
    id: string;
    title: string;
    images: string[] | null;
    address: string;
    city: string;
    price: number;
    price_period: PricePeriod | null;
    deal_type: DealType;
    property_type: PropertyType;
}

const toBooking = (row: BookingRow): IBooking => ({
    id: row.id,
    listingId: row.listing_id,
    guestId: row.guest_id,
    hostId: row.host_id,
    startDate: row.start_date,
    endDate: row.end_date,
    guestsCount: Number(row.guests_count),
    totalPrice: Number(row.total_price),
    currency: row.currency,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

const toBookingWithListing = (
    row: BookingRow & { listing: ListingSummaryRow | null },
): IBookingWithListing => {
    const base = toBooking(row);
    const l = row.listing;
    return {
        ...base,
        listing: {
            id: l?.id ?? row.listing_id,
            title: l?.title ?? '—',
            images: l?.images ?? [],
            address: l?.address ?? '',
            city: l?.city ?? '',
            price: l ? Number(l.price) : 0,
            pricePeriod: l?.price_period ?? null,
            dealType: l?.deal_type ?? 'rent_long',
            propertyType: l?.property_type ?? 'flat',
        },
    };
};

const SELECT_WITH_LISTING =
    '*, listing:listings(id, title, images, address, city, price, price_period, deal_type, property_type)';

export class BookingsRepo {
    static async listForGuest(guestId: string): Promise<IBookingWithListing[]> {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('bookings')
            .select(SELECT_WITH_LISTING)
            .eq('guest_id', guestId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map((row) => toBookingWithListing(row as BookingRow & { listing: ListingSummaryRow | null }));
    }

    static async listForHost(hostId: string): Promise<IBookingWithListing[]> {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('bookings')
            .select(SELECT_WITH_LISTING)
            .eq('host_id', hostId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map((row) => toBookingWithListing(row as BookingRow & { listing: ListingSummaryRow | null }));
    }

    static async getById(id: string): Promise<IBooking | null> {
        const supabase = getServiceClient();
        const { data, error } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        return data ? toBooking(data as BookingRow) : null;
    }

    static async create(input: {
        listingId: string;
        guestId: string;
        hostId: string | null;
        startDate: string;
        endDate: string;
        guestsCount: number;
        totalPrice: number;
        notes: string | null;
    }): Promise<IBooking> {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('bookings')
            .insert({
                listing_id: input.listingId,
                guest_id: input.guestId,
                host_id: input.hostId,
                start_date: input.startDate,
                end_date: input.endDate,
                guests_count: input.guestsCount,
                total_price: input.totalPrice,
                notes: input.notes,
            })
            .select('*')
            .single();
        if (error) throw error;
        return toBooking(data as BookingRow);
    }

    static async setStatus(id: string, status: BookingStatus): Promise<IBooking | null> {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id)
            .select('*')
            .maybeSingle();
        if (error) throw error;
        return data ? toBooking(data as BookingRow) : null;
    }

    static async getBookedRanges(listingId: string): Promise<Array<{ startDate: string; endDate: string }>> {
        const supabase = getServiceClient();
        const today = new Date().toISOString().slice(0, 10);
        const { data, error } = await supabase
            .from('bookings')
            .select('start_date, end_date')
            .eq('listing_id', listingId)
            .in('status', ['pending', 'confirmed'])
            .gt('end_date', today);
        if (error) throw error;
        return (data ?? []).map((r: { start_date: string; end_date: string }) => ({
            startDate: r.start_date,
            endDate:   r.end_date,
        }));
    }

    static async hasOverlap(
        listingId: string,
        startDate: string,
        endDate: string,
        excludeBookingId?: string,
    ): Promise<boolean> {
        const supabase = getServiceClient();
        let q = supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('listing_id', listingId)
            .in('status', ['pending', 'confirmed'])
            .lt('start_date', endDate)
            .gt('end_date', startDate);
        if (excludeBookingId) q = q.neq('id', excludeBookingId);
        const { count, error } = await q;
        if (error) throw error;
        return (count ?? 0) > 0;
    }
}
