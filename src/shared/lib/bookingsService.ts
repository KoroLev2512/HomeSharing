import type { IBooking, IBookingWithListing, ICreateBookingInput } from '@/shared/types/booking';
import type { IListing } from '@/shared/types/listing';
import type { IListingDraft } from '@/shared/lib/hostListingsRepo';

const handle = async (res: Response): Promise<unknown> => {
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = (data as { error?: string }).error ?? `Request failed (${res.status})`;
        throw new Error(error);
    }
    return data;
};

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

export class HostListingsService {
    static async list(): Promise<IListing[]> {
        const data = (await handle(await fetch('/api/host/listings'))) as { listings: IListing[] };
        return data.listings;
    }

    static async getById(id: string): Promise<IListing> {
        const data = (await handle(await fetch(`/api/host/listings/${encodeURIComponent(id)}`))) as {
            listing: IListing;
        };
        return data.listing;
    }

    static async create(draft: IListingDraft): Promise<IListing> {
        const res = await fetch('/api/host/listings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draft),
        });
        const data = (await handle(res)) as { listing: IListing };
        return data.listing;
    }

    static async update(id: string, draft: IListingDraft): Promise<IListing> {
        const res = await fetch(`/api/host/listings/${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(draft),
        });
        const data = (await handle(res)) as { listing: IListing };
        return data.listing;
    }

    static async remove(id: string): Promise<void> {
        await handle(
            await fetch(`/api/host/listings/${encodeURIComponent(id)}`, {
                method: 'DELETE',
            }),
        );
    }
}

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

export class MeService {
    static async setHost(isHost: boolean): Promise<void> {
        await handle(
            await fetch('/api/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isHost }),
            }),
        );
    }

    static async uploadAvatar(file: File): Promise<string> {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch('/api/me/avatar', {
            method: 'POST',
            body: form,
        });
        const data = (await handle(res)) as { image: string };
        return data.image;
    }

    static async resetAvatar(): Promise<void> {
        await handle(
            await fetch('/api/me/avatar', {
                method: 'DELETE',
            }),
        );
    }
}

export default BookingsService;
