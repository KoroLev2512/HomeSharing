import { createId } from '@paralleldrive/cuid2';
import { getServiceClient } from '@/shared/utils/supabase/service';
import type {
    DealType,
    IListing,
    PricePeriod,
    PropertyType,
    RosreestrObjectData,
    RosreestrStatus,
} from '@/shared/types/listing';

const DEAL_TYPES: DealType[] = ['rent_long', 'rent_short', 'sale'];
const PROPERTY_TYPES: PropertyType[] = ['flat', 'room', 'house', 'studio'];
const PRICE_PERIODS: PricePeriod[] = ['month', 'day'];

export interface IListingDraft {
    title: string;
    dealType: DealType;
    propertyType: PropertyType;
    rooms: number;
    area: number;
    livingArea?: number | null;
    kitchenArea?: number | null;
    floor: number;
    totalFloors: number;
    price: number;
    pricePeriod?: PricePeriod | null;
    deposit?: number | null;
    city: string;
    district?: string | null;
    metro?: string | null;
    metroDistanceMin?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    address: string;
    description: string;
    amenities?: string[];
    images?: string[];
    ownerName: string;
    ownerType: 'owner' | 'agency';
    ownerAvatar?: string | null;
    ownerPhoneMasked?: string | null;
    cadastralNumber?: string | null;
}

export interface HostListingRow {
    id: string;
    user_id: string | null;
    title: string;
    deal_type: DealType;
    property_type: PropertyType;
    rooms: number;
    area: number;
    living_area: number | null;
    kitchen_area: number | null;
    floor: number;
    total_floors: number;
    price: number;
    price_period: PricePeriod | null;
    deposit: number | null;
    city: string;
    district: string | null;
    metro: string | null;
    metro_distance_min: number | null;
    latitude: number | null;
    longitude: number | null;
    address: string;
    description: string;
    amenities: string[] | null;
    images: string[] | null;
    rating: number | null;
    reviews_count: number | null;
    published_at: string;
    is_verified: boolean;
    owner_name: string;
    owner_avatar: string | null;
    owner_type: 'owner' | 'agency';
    owner_phone_masked: string | null;
    cadastral_number: string | null;
    rosreestr_status: RosreestrStatus | null;
    rosreestr_checked_at: string | null;
    rosreestr_data: RosreestrObjectData | null;
    created_at: string;
    updated_at: string;
}

export const rowToListing = (row: HostListingRow): IListing => ({
    id: row.id,
    title: row.title,
    dealType: row.deal_type,
    propertyType: row.property_type,
    rooms: Number(row.rooms),
    area: Number(row.area),
    livingArea: row.living_area != null ? Number(row.living_area) : undefined,
    kitchenArea: row.kitchen_area != null ? Number(row.kitchen_area) : undefined,
    floor: Number(row.floor),
    totalFloors: Number(row.total_floors),
    price: Number(row.price),
    pricePeriod: row.price_period,
    deposit: row.deposit != null ? Number(row.deposit) : undefined,
    city: row.city,
    district: row.district ?? undefined,
    metro: row.metro ?? undefined,
    metroDistanceMin: row.metro_distance_min ?? undefined,
    latitude: row.latitude != null && Number.isFinite(Number(row.latitude)) ? Number(row.latitude) : undefined,
    longitude: row.longitude != null && Number.isFinite(Number(row.longitude)) ? Number(row.longitude) : undefined,
    address: row.address,
    description: row.description,
    amenities: row.amenities ?? [],
    images: row.images ?? [],
    rating: row.rating != null ? Number(row.rating) : undefined,
    reviewsCount: row.reviews_count ?? undefined,
    publishedAt: row.published_at,
    isVerified: row.is_verified,
    cadastralNumber: row.cadastral_number ?? null,
    rosreestrStatus: row.rosreestr_status ?? 'pending',
    rosreestrCheckedAt: row.rosreestr_checked_at ?? null,
    rosreestrData: row.rosreestr_data ?? null,
    ownerUserId: row.user_id ?? null,
    owner: {
        name: row.owner_name,
        avatar: row.owner_avatar ?? undefined,
        type: row.owner_type,
        phoneMasked: row.owner_phone_masked ?? undefined,
    },
});

const isPositiveNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isPositiveInt = (v: unknown): v is number =>
    typeof v === 'number' && Number.isFinite(v) && Number.isInteger(v) && v >= 0;

export const validateDraft = (raw: Partial<IListingDraft> | undefined): { ok: true; draft: IListingDraft } | { ok: false; error: string } => {
    if (!raw || typeof raw !== 'object') return { ok: false, error: 'Body is required' };

    const required = (key: keyof IListingDraft) => typeof raw[key] === 'string' && (raw[key] as string).trim().length > 0;

    if (!required('title')) return { ok: false, error: 'title is required' };
    if (!required('city')) return { ok: false, error: 'city is required' };
    if (!required('address')) return { ok: false, error: 'address is required' };
    if (!required('description')) return { ok: false, error: 'description is required' };
    if (!required('ownerName')) return { ok: false, error: 'ownerName is required' };

    if (!DEAL_TYPES.includes(raw.dealType as DealType)) return { ok: false, error: 'Invalid dealType' };
    if (!PROPERTY_TYPES.includes(raw.propertyType as PropertyType)) return { ok: false, error: 'Invalid propertyType' };
    if (raw.ownerType !== 'owner' && raw.ownerType !== 'agency') return { ok: false, error: 'Invalid ownerType' };

    if (!isPositiveInt(raw.rooms)) return { ok: false, error: 'rooms must be a non-negative integer' };
    if (!isPositiveNumber(raw.area)) return { ok: false, error: 'area must be a positive number' };
    if (!isPositiveInt(raw.floor) || !isPositiveInt(raw.totalFloors)) return { ok: false, error: 'floor / totalFloors must be non-negative integers' };
    if ((raw.totalFloors as number) < (raw.floor as number)) return { ok: false, error: 'totalFloors must be >= floor' };
    if (!isPositiveNumber(raw.price)) return { ok: false, error: 'price must be a non-negative number' };

    if (raw.dealType !== 'sale') {
        if (!raw.pricePeriod || !PRICE_PERIODS.includes(raw.pricePeriod)) {
            return { ok: false, error: 'pricePeriod is required for rent listings' };
        }
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    const latRaw = raw.latitude;
    const lngRaw = raw.longitude;
    if (latRaw != null || lngRaw != null) {
        if (typeof latRaw !== 'number' || !Number.isFinite(latRaw)) {
            return { ok: false, error: 'latitude must be a finite number when provided' };
        }
        if (typeof lngRaw !== 'number' || !Number.isFinite(lngRaw)) {
            return { ok: false, error: 'longitude must be a finite number when provided' };
        }
        if (latRaw < -90 || latRaw > 90) return { ok: false, error: 'latitude must be between -90 and 90' };
        if (lngRaw < -180 || lngRaw > 180) return { ok: false, error: 'longitude must be between -180 and 180' };
        latitude = latRaw;
        longitude = lngRaw;
    }

    return {
        ok: true,
        draft: {
            title: (raw.title as string).trim(),
            dealType: raw.dealType as DealType,
            propertyType: raw.propertyType as PropertyType,
            rooms: raw.rooms as number,
            area: raw.area as number,
            livingArea: typeof raw.livingArea === 'number' ? raw.livingArea : null,
            kitchenArea: typeof raw.kitchenArea === 'number' ? raw.kitchenArea : null,
            floor: raw.floor as number,
            totalFloors: raw.totalFloors as number,
            price: raw.price as number,
            pricePeriod: raw.dealType === 'sale' ? null : (raw.pricePeriod as PricePeriod),
            deposit: typeof raw.deposit === 'number' ? raw.deposit : null,
            city: (raw.city as string).trim(),
            district: typeof raw.district === 'string' && raw.district.trim() ? raw.district.trim() : null,
            metro: typeof raw.metro === 'string' && raw.metro.trim() ? raw.metro.trim() : null,
            metroDistanceMin: typeof raw.metroDistanceMin === 'number' ? raw.metroDistanceMin : null,
            latitude,
            longitude,
            address: (raw.address as string).trim(),
            description: (raw.description as string).trim(),
            amenities: Array.isArray(raw.amenities) ? raw.amenities.filter((a): a is string => typeof a === 'string').slice(0, 30) : [],
            images: Array.isArray(raw.images) ? raw.images.filter((a): a is string => typeof a === 'string').slice(0, 10) : [],
            ownerName: (raw.ownerName as string).trim(),
            ownerType: raw.ownerType,
            ownerAvatar: typeof raw.ownerAvatar === 'string' && raw.ownerAvatar.trim() ? raw.ownerAvatar : null,
            ownerPhoneMasked:
                typeof raw.ownerPhoneMasked === 'string' && raw.ownerPhoneMasked.trim() ? raw.ownerPhoneMasked : null,
        },
    };
};

const draftToInsertRow = (draft: IListingDraft, userId: string, id?: string) => ({
    id: id ?? createId(),
    user_id: userId,
    title: draft.title,
    deal_type: draft.dealType,
    property_type: draft.propertyType,
    rooms: draft.rooms,
    area: draft.area,
    living_area: draft.livingArea ?? null,
    kitchen_area: draft.kitchenArea ?? null,
    floor: draft.floor,
    total_floors: draft.totalFloors,
    price: draft.price,
    price_period: draft.pricePeriod ?? null,
    deposit: draft.deposit ?? null,
    city: draft.city,
    district: draft.district ?? null,
    metro: draft.metro ?? null,
    metro_distance_min: draft.metroDistanceMin ?? null,
    latitude: draft.latitude ?? null,
    longitude: draft.longitude ?? null,
    address: draft.address,
    description: draft.description,
    amenities: draft.amenities ?? [],
    images: draft.images && draft.images.length > 0 ? draft.images : ['/rooms/room.png'],
    owner_name: draft.ownerName,
    owner_avatar: draft.ownerAvatar ?? null,
    owner_type: draft.ownerType,
    owner_phone_masked: draft.ownerPhoneMasked ?? null,
    cadastral_number: draft.cadastralNumber?.trim() || null,
});

export class HostListingsRepo {
    static async listOwnedBy(userId: string): Promise<IListing[]> {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('listings')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return (data ?? []).map((row) => rowToListing(row as HostListingRow));
    }

    static async getOwned(id: string, userId: string): Promise<IListing | null> {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('listings')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .maybeSingle();
        if (error) throw error;
        return data ? rowToListing(data as HostListingRow) : null;
    }

    static async create(draft: IListingDraft, userId: string): Promise<IListing> {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('listings')
            .insert(draftToInsertRow(draft, userId))
            .select('*')
            .single();
        if (error) throw error;
        return rowToListing(data as HostListingRow);
    }

    static async update(id: string, userId: string, draft: IListingDraft): Promise<IListing | null> {
        const supabase = getServiceClient();
        const row = draftToInsertRow(draft, userId, id);
        // Don't override id; keep created_at and published_at as-is.
        const { id: _id, ...patch } = row;
        const { data, error } = await supabase
            .from('listings')
            .update(patch)
            .eq('id', id)
            .eq('user_id', userId)
            .select('*')
            .maybeSingle();
        if (error) throw error;
        return data ? rowToListing(data as HostListingRow) : null;
    }

    static async delete(id: string, userId: string): Promise<boolean> {
        const supabase = getServiceClient();
        const { count, error } = await supabase
            .from('listings')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;
        return (count ?? 0) > 0;
    }
}
