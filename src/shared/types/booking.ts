import type { IListing } from '@/shared/types/listing';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'completed';

/**
 * Расширенные состояния жизненного цикла аренды (§3.1 диплома).
 * State machine: initiated → ownership_pending → ownership_verified →
 *   contract_ready → payment_pending → access_granted → active → completed
 */
export type RentalProcessStatus =
    | 'initiated'
    | 'ownership_pending'
    | 'ownership_verified'
    | 'contract_ready'
    | 'payment_pending'
    | 'access_granted'
    | 'active'
    | 'completed'
    | 'access_revoked'
    | 'cancelled'
    | 'rejected'
    | 'failed';

export const PROCESS_STATUS_LABEL: Record<RentalProcessStatus, string> = {
    initiated:           'Инициировано',
    ownership_pending:   'Верификация права',
    ownership_verified:  'Право подтверждено',
    contract_ready:      'Договор готов',
    payment_pending:     'Ожидает оплаты',
    access_granted:      'Доступ выдан',
    active:              'Активная аренда',
    completed:           'Завершено',
    access_revoked:      'Доступ отозван',
    cancelled:           'Отменено',
    rejected:            'Отклонено',
    failed:              'Ошибка процесса',
};

export const PROCESS_STATUS_TONE: Record<RentalProcessStatus, 'info' | 'success' | 'danger' | 'muted'> = {
    initiated:           'info',
    ownership_pending:   'info',
    ownership_verified:  'info',
    contract_ready:      'info',
    payment_pending:     'info',
    access_granted:      'success',
    active:              'success',
    completed:           'muted',
    access_revoked:      'muted',
    cancelled:           'muted',
    rejected:            'danger',
    failed:              'danger',
};

/** Упорядоченные этапы для timeline-компонента */
export const PROCESS_TIMELINE: RentalProcessStatus[] = [
    'initiated',
    'ownership_pending',
    'ownership_verified',
    'contract_ready',
    'payment_pending',
    'access_granted',
    'active',
    'completed',
];

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
    // Поля расширенного процесса аренды (§3.1 диплома)
    processStatus?: RentalProcessStatus;
    ownershipVerifiedAt?: string | null;
    accessGrantedAt?: string | null;
    accessRevokedAt?: string | null;
}

/** Маппинг базового статуса бронирования в статус процесса аренды */
export function bookingStatusToProcess(status: BookingStatus): RentalProcessStatus {
    switch (status) {
        case 'pending':   return 'initiated';
        case 'confirmed': return 'active';
        case 'completed': return 'completed';
        case 'cancelled': return 'cancelled';
        case 'rejected':  return 'rejected';
        default:          return 'initiated';
    }
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
