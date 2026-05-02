import type { IBooking, IBookingWithListing } from '@/shared/types/booking';
import { handle } from '@/shared/lib/bookingsService';

export class HostBookingsService {
    static async list(): Promise<IBookingWithListing[]> {
        const data = (await handle(await fetch('/api/host/bookings'))) as { bookings: IBookingWithListing[] };
        return data.bookings;
    }

    static async setStatus(id: string, status: 'confirmed' | 'rejected' | 'completed' | 'cancelled'): Promise<IBooking> {
        const res = await fetch(`/api/host/bookings/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        const data = (await handle(res)) as { booking: IBooking };
        return data.booking;
    }
}
