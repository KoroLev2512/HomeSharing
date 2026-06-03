export type DealType = 'rent_long' | 'rent_short' | 'sale';

/**
 * Расширенные статусы верификации через Росреестр (§4.2 диплома, Таблица 4).
 * - verified:               право подтверждено однозначно
 * - not_verified:           право не подтверждено (данные есть, вывод отрицательный)
 * - inconclusive:           данные получены, но неоднозначны (несовпадение площади > 10% и т.п.)
 * - technical_failure:      ошибка при обращении к внешнему контуру
 * - manual_review_required: требуется ручная проверка модератором
 * Старые: 'found' → 'verified', 'not_found' → 'not_verified', 'error' → 'technical_failure'
 */
export type RosreestrStatus =
    | 'pending'
    | 'verified'
    | 'not_verified'
    | 'inconclusive'
    | 'technical_failure'
    | 'manual_review_required'
    // Legacy — оставляем для обратной совместимости с данными в БД
    | 'found'
    | 'not_found'
    | 'error';

export interface RosreestrObjectData {
    cn: string;
    address?: string;
    areaValue?: string;
    name?: string;
    purposeName?: string;
    statecd?: string;
    statecdLabel?: string;
    floors?: string;
    yearBuilt?: string;
    cadCost?: string;
    layerType?: number;
}

export type PropertyType = 'flat' | 'room' | 'house' | 'studio';

export type PricePeriod = 'month' | 'day';

export interface IListingOwner {
    name: string;
    avatar?: string;
    type: 'owner' | 'agency';
    phoneMasked?: string;
}

export interface IListing {
    id: string;
    title: string;
    dealType: DealType;
    propertyType: PropertyType;
    rooms: number;
    area: number;
    livingArea?: number;
    kitchenArea?: number;
    floor: number;
    totalFloors: number;
    price: number;
    pricePeriod?: PricePeriod | null;
    deposit?: number;
    city: string;
    district?: string;
    metro?: string;
    metroDistanceMin?: number;
    /** WGS84, необязательно */
    latitude?: number;
    longitude?: number;
    address: string;
    description: string;
    amenities: string[];
    images: string[];
    rating?: number;
    reviewsCount?: number;
    publishedAt: string;
    owner: IListingOwner;
    ownerUserId?: string | null;
    isVerified?: boolean;
    cadastralNumber?: string | null;
    rosreestrStatus?: RosreestrStatus;
    rosreestrCheckedAt?: string | null;
    rosreestrData?: RosreestrObjectData | null;
}

export interface IListingsFilters {
    q?: string;
    dealType?: DealType;
    propertyType?: PropertyType;
    rooms?: number[];
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
    city?: string;
}

export type ListingsSort = 'new' | 'cheap' | 'expensive' | 'area_desc';

export interface IListingsQuery extends IListingsFilters {
    sort?: ListingsSort;
    page?: number;
    perPage?: number;
    ids?: string[];
    excludeIds?: string[];
}

export interface IListingsResponse {
    items: IListing[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}
