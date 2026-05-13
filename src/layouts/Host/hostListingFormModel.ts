import type {
    DealType,
    IListing,
    PricePeriod,
    PropertyType,
} from '@/shared/types/listing';
import type { IListingDraft } from '@/shared/lib/hostListingsRepo';
import type { ISelectOption } from '@/shared/ui/Select';

export const MAX_LISTING_PHOTOS = 10;

export type FormState = {
    title: string;
    dealType: DealType;
    propertyType: PropertyType;
    rooms: string;
    area: string;
    livingArea: string;
    kitchenArea: string;
    floor: string;
    totalFloors: string;
    price: string;
    pricePeriod: PricePeriod;
    deposit: string;
    city: string;
    district: string;
    metro: string;
    metroDistanceMin: string;
    latitude: string;
    longitude: string;
    address: string;
    description: string;
    amenities: string;
    images: string[];
    ownerName: string;
    ownerType: 'owner' | 'agency';
    ownerAvatar: string;
    ownerPhoneMasked: string;
};

export const DEAL_OPTIONS: Array<ISelectOption<DealType>> = [
    { value: 'rent_long', label: 'Аренда (длительная)' },
    { value: 'rent_short', label: 'Аренда (посуточно)' },
    { value: 'sale', label: 'Продажа' },
];

export const PROPERTY_OPTIONS: Array<ISelectOption<'flat' | 'room' | 'house'>> = [
    { value: 'flat', label: 'Квартира' },
    { value: 'room', label: 'Комната' },
    { value: 'house', label: 'Дом' },
];

export const ROOM_OPTIONS: Array<ISelectOption<string>> = [
    { value: '0', label: 'Студия' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '6', label: '5 и более' },
];

export const PRICE_PERIOD_OPTIONS: Array<ISelectOption<PricePeriod>> = [
    { value: 'month', label: 'в месяц' },
    { value: 'day', label: 'в сутки' },
];

export const OWNER_TYPE_OPTIONS: Array<ISelectOption<'owner' | 'agency'>> = [
    { value: 'owner', label: 'Собственник' },
    { value: 'agency', label: 'Агентство' },
];

export const EMPTY: FormState = {
    title: '',
    dealType: 'rent_long',
    propertyType: 'flat',
    rooms: '1',
    area: '',
    livingArea: '',
    kitchenArea: '',
    floor: '',
    totalFloors: '',
    price: '',
    pricePeriod: 'month',
    deposit: '',
    city: '',
    district: '',
    metro: '',
    metroDistanceMin: '',
    latitude: '',
    longitude: '',
    address: '',
    description: '',
    amenities: '',
    images: [],
    ownerName: '',
    ownerType: 'owner',
    ownerAvatar: '',
    ownerPhoneMasked: '',
};

/** Значение селекта «комнат»: 0 — студия, 1–4 — число, 6 — «5 и более» (в т.ч. было ровно 5). */
export const roomsToFormValue = (rooms: number): string => {
    if (rooms <= 0) return '0';
    if (rooms >= 5) return '6';
    return String(rooms);
};

export const fromListing = (l: IListing): FormState => ({
    title: l.title,
    dealType: l.dealType,
    propertyType: l.propertyType === 'studio' ? 'flat' : l.propertyType,
    rooms: roomsToFormValue(l.rooms),
    area: String(l.area),
    livingArea: l.livingArea != null ? String(l.livingArea) : '',
    kitchenArea: l.kitchenArea != null ? String(l.kitchenArea) : '',
    floor: String(l.floor),
    totalFloors: String(l.totalFloors),
    price: String(l.price),
    pricePeriod: l.pricePeriod ?? 'month',
    deposit: l.deposit != null ? String(l.deposit) : '',
    city: l.city,
    district: l.district ?? '',
    metro: l.metro ?? '',
    metroDistanceMin: l.metroDistanceMin != null ? String(l.metroDistanceMin) : '',
    latitude: l.latitude != null && Number.isFinite(l.latitude) ? String(l.latitude) : '',
    longitude: l.longitude != null && Number.isFinite(l.longitude) ? String(l.longitude) : '',
    address: l.address,
    description: l.description,
    amenities: (l.amenities ?? []).join(', '),
    images: (l.images ?? []).slice(0, MAX_LISTING_PHOTOS),
    ownerName: l.owner.name,
    ownerType: l.owner.type,
    ownerAvatar: l.owner.avatar ?? '',
    ownerPhoneMasked: l.owner.phoneMasked ?? '',
});

export const parseInt0 = (s: string): number => {
    const n = Number.parseInt(s, 10);
    return Number.isFinite(n) ? n : 0;
};

export const parseFloat0 = (s: string): number => {
    const n = Number.parseFloat(s.replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
};

export const toDraft = (f: FormState): IListingDraft => {
    const rooms = parseInt0(f.rooms);
    const propertyType = rooms === 0 ? 'studio' : f.propertyType;
    return {
        title: f.title.trim(),
        dealType: f.dealType,
        propertyType,
        rooms,
        area: parseFloat0(f.area),
        livingArea: f.livingArea.trim() ? parseFloat0(f.livingArea) : null,
        kitchenArea: f.kitchenArea.trim() ? parseFloat0(f.kitchenArea) : null,
        floor: parseInt0(f.floor),
        totalFloors: parseInt0(f.totalFloors),
        price: parseFloat0(f.price),
        pricePeriod: f.dealType === 'sale' ? null : f.pricePeriod,
        deposit: f.deposit.trim() ? parseFloat0(f.deposit) : null,
        city: f.city.trim(),
        district: f.district.trim() || null,
        metro: f.metro.trim() || null,
        metroDistanceMin: f.metroDistanceMin.trim() ? parseInt0(f.metroDistanceMin) : null,
        latitude: (() => {
            const a = f.latitude.trim();
            const b = f.longitude.trim();
            if (!a && !b) return null;
            return parseFloat0(a);
        })(),
        longitude: (() => {
            const a = f.latitude.trim();
            const b = f.longitude.trim();
            if (!a && !b) return null;
            return parseFloat0(b);
        })(),
        address: f.address.trim(),
        description: f.description.trim(),
        amenities: f.amenities.split(',').flatMap((s) => { const t = s.trim(); return t ? [t] : []; }),
        images: f.images.flatMap((s) => { const t = s.trim(); return t ? [t] : []; }).slice(0, MAX_LISTING_PHOTOS),
        ownerName: f.ownerName.trim(),
        ownerType: f.ownerType,
        ownerAvatar: f.ownerAvatar.trim() || null,
        ownerPhoneMasked: f.ownerPhoneMasked.trim() || null,
    };
};
