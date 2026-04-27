import type { IListing } from '@/shared/types/listing';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';

export interface IBooking {
    id: string;
    listingId: string;
    guestId: string;
    hostId: string | null;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    guestsCount: number;
    totalPrice: number;
    currency: string;
    status: BookingStatus;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface IBookingWithListing extends IBooking {
    listing: Pick<
        IListing,
        | 'id'
        | 'title'
        | 'images'
        | 'address'
        | 'city'
        | 'price'
        | 'pricePeriod'
        | 'dealType'
        | 'propertyType'
    >;
}

export interface ICreateBookingInput {
    listingId: string;
    startDate: string;
    endDate: string;
    guestsCount?: number;
    notes?: string;
}

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
    pending: 'Ожидает подтверждения',
    confirmed: 'Подтверждено',
    cancelled: 'Отменено',
    rejected: 'Отклонено',
    completed: 'Завершено',
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, 'info' | 'success' | 'danger' | 'muted'> = {
    pending: 'info',
    confirmed: 'success',
    cancelled: 'muted',
    rejected: 'danger',
    completed: 'muted',
};
