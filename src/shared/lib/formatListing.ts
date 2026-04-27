import type { DealType, IListing, PricePeriod } from '@/shared/types/listing';

const numberFormatter = new Intl.NumberFormat('ru-RU');

export const formatPrice = (price: number, period?: PricePeriod | null): string => {
    const formatted = `${numberFormatter.format(price)} ₽`;
    if (!period) return formatted;
    if (period === 'day') return `${formatted} / сутки`;
    return `${formatted} / мес`;
};

export const dealLabel: Record<DealType, string> = {
    rent_long: 'Аренда',
    rent_short: 'Посуточно',
    sale: 'Продажа',
};

export const dealLabelShort: Record<DealType, string> = {
    rent_long: 'Снять',
    rent_short: 'Посуточно',
    sale: 'Купить',
};

export const formatRooms = (rooms: number): string => {
    if (rooms === 0) return 'Студия';
    return `${rooms}-комн.`;
};

export const formatFloor = (floor: number, total: number): string => `${floor}/${total} эт.`;

export const formatPublishedAt = (iso: string): string => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 60) return diffMin <= 1 ? 'только что' : `${diffMin} мин назад`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} ч назад`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} дн назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export const buildListingSubtitle = (listing: IListing): string => {
    const parts: string[] = [];
    parts.push(formatRooms(listing.rooms));
    parts.push(`${listing.area} м²`);
    parts.push(formatFloor(listing.floor, listing.totalFloors));
    return parts.join(' · ');
};

export const buildListingLocation = (listing: IListing): string => {
    const parts: string[] = [];
    if (listing.metro) {
        const dist = listing.metroDistanceMin ? ` · ${listing.metroDistanceMin} мин` : '';
        parts.push(`м. ${listing.metro}${dist}`);
    }
    if (listing.district) parts.push(listing.district);
    return parts.join(' · ');
};
