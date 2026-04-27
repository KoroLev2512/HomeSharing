import type { DealType } from '@/shared/types/listing';

const MS_PER_DAY = 86_400_000;

export const diffNights = (start: string, end: string): number => {
    const s = new Date(`${start}T00:00:00Z`).getTime();
    const e = new Date(`${end}T00:00:00Z`).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
    return Math.max(0, Math.round((e - s) / MS_PER_DAY));
};

/**
 * Computes the booking total based on the listing's deal type.
 * - rent_short: priced per night → price * nights (min 1)
 * - rent_long: priced per month → price * months (months = max 1, ceil(nights/30))
 * - sale: not bookable (returns 0)
 */
export const computeBookingTotal = (
    dealType: DealType,
    pricePerPeriod: number,
    startDate: string,
    endDate: string,
): { nights: number; periods: number; total: number; periodLabel: 'night' | 'month' | 'unit' } => {
    const nights = diffNights(startDate, endDate);
    if (dealType === 'sale') {
        return { nights, periods: 0, total: 0, periodLabel: 'unit' };
    }
    if (dealType === 'rent_short') {
        const periods = Math.max(1, nights);
        return { nights, periods, total: pricePerPeriod * periods, periodLabel: 'night' };
    }
    const periods = Math.max(1, Math.ceil(nights / 30));
    return { nights, periods, total: pricePerPeriod * periods, periodLabel: 'month' };
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const isValidDateString = (s: unknown): s is string => typeof s === 'string' && DATE_REGEX.test(s) && !Number.isNaN(Date.parse(s));
