import type { IBooking, IBookingWithListing, ICreateBookingInput } from '@/shared/types/booking';

const handle = async (res: Response): Promise<unknown> => {
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = (data as { error?: string }).error ?? `Request failed (${res.status})`;
        throw new Error(error);
    }
    return data;
};

export { handle };

class BookingsService {
    static async listMyBookings(): Promise<IBookingWithListing[]> {
        const data = (await handle(await fetch('/api/bookings'))) as { bookings: IBookingWithListing[] };
        return data.bookings;
    }

    static async create(input: ICreateBookingInput): Promise<IBooking> {
        const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        });
        const data = (await handle(res)) as { booking: IBooking };
        return data.booking;
    }

    static async cancel(id: string): Promise<IBooking> {
        const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
        });
        const data = (await handle(res)) as { booking: IBooking };
        return data.booking;
    }
}

export default BookingsService;
