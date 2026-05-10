export type DealType = 'rent_long' | 'rent_short' | 'sale';

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
