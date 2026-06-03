import { handle } from '@/shared/lib/bookingsService';
import type { IAdminUser } from '@/shared/types/admin';
import type { IListing, RosreestrObjectData, RosreestrStatus } from '@/shared/types/listing';
import type { IBooking, IBookingWithListing, BookingStatus } from '@/shared/types/booking';

export interface RosreestrCheckResult {
    found: boolean;
    cn: string;
    data?: RosreestrObjectData;
    layerName?: string;
    error?: string;
}

export type AdminUserPatch = Partial<{ isAdmin: boolean; isHost: boolean; isUser: boolean }>;

export class AdminService {
    static async listUsers(role?: string): Promise<IAdminUser[]> {
        const url = role ? `/api/admin/users?role=${encodeURIComponent(role)}` : '/api/admin/users';
        const data = (await handle(await fetch(url))) as { users: IAdminUser[] };
        return data.users;
    }

    static async updateUser(id: string, patch: AdminUserPatch): Promise<IAdminUser> {
        const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        const data = (await handle(res)) as { user: IAdminUser };
        return data.user;
    }

    static async listListings(params?: { page?: number; dealType?: string; city?: string }): Promise<{ items: IListing[]; total: number; totalPages: number; page: number }> {
        const q = new URLSearchParams();
        if (params?.page) q.set('page', String(params.page));
        if (params?.dealType) q.set('dealType', params.dealType);
        if (params?.city) q.set('city', params.city);
        const url = `/api/admin/listings${q.toString() ? '?' + q.toString() : ''}`;
        const data = (await handle(await fetch(url))) as { items: IListing[]; total: number; totalPages: number; page: number };
        return data;
    }

    static async deleteListing(id: string): Promise<void> {
        await handle(await fetch(`/api/admin/listings/${encodeURIComponent(id)}`, { method: 'DELETE' }));
    }

    static async listBookings(status?: string): Promise<IBookingWithListing[]> {
        const url = status ? `/api/admin/bookings?status=${encodeURIComponent(status)}` : '/api/admin/bookings';
        const data = (await handle(await fetch(url))) as { bookings: IBookingWithListing[] };
        return data.bookings;
    }

    static async setBookingStatus(id: string, status: BookingStatus): Promise<IBooking> {
        const res = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        const data = (await handle(res)) as { booking: IBooking };
        return data.booking;
    }

    static async checkRosreestr(cadastralNumber: string): Promise<RosreestrCheckResult> {
        const res = await fetch('/api/admin/rosreestr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cadastralNumber }),
        });
        const data = await res.json() as RosreestrCheckResult & { error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Ошибка запроса к Росреестру');
        return data;
    }

    static async verifyListing(
        id: string,
        patch: {
            isVerified?: boolean;
            cadastralNumber?: string | null;
            rosreestrStatus?: RosreestrStatus;
            rosreestrData?: RosreestrObjectData | null;
        },
    ): Promise<void> {
        const res = await fetch(`/api/admin/listings/${encodeURIComponent(id)}/verify`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        if (!res.ok) {
            const data = await res.json() as { error?: string };
            throw new Error(data.error ?? 'Не удалось обновить объявление');
        }
    }
}
