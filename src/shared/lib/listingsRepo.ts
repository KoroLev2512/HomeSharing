import { getServiceClient } from '@/shared/utils/supabase/service';
import { cache, CachePrefix, TTL, hashQuery } from '@/shared/lib/cache/redisCache';
import type {
    DealType,
    IListing,
    IListingsQuery,
    IListingsResponse,
    ListingsSort,
    PricePeriod,
    PropertyType,
} from '@/shared/types/listing';

interface ListingRow {
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
}

const toListing = (row: ListingRow): IListing => ({
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
    ownerUserId: row.user_id ?? null,
    owner: {
        name: row.owner_name,
        avatar: row.owner_avatar ?? undefined,
        type: row.owner_type,
        phoneMasked: row.owner_phone_masked ?? undefined,
    },
});

type Orderable<T> = {
    order: (column: string, options?: { ascending?: boolean }) => T;
};

const applySort = <T extends Orderable<T>>(builder: T, sort: ListingsSort): T => {
    switch (sort) {
        case 'cheap':
            return builder.order('price', { ascending: true });
        case 'expensive':
            return builder.order('price', { ascending: false });
        case 'area_desc':
            return builder.order('area', { ascending: false });
        case 'new':
        default:
            return builder.order('published_at', { ascending: false });
    }
};

export class ListingsRepo {
    static async list(query: IListingsQuery = {}): Promise<IListingsResponse> {
        const cacheKey = CachePrefix.listings + hashQuery(query as Record<string, unknown>);

        const cached = await cache.get<IListingsResponse>(cacheKey);
        if (cached) return cached;

        const supabase = getServiceClient();
        const page = Math.max(1, query.page ?? 1);
        const perPage = Math.min(60, Math.max(6, query.perPage ?? 12));
        const sort: ListingsSort = query.sort ?? 'new';

        let q = supabase.from('listings').select('*', { count: 'exact' });

        if (query.ids && query.ids.length > 0) q = q.in('id', query.ids);
        if (query.excludeIds && query.excludeIds.length > 0) {
            q = q.not('id', 'in', `(${query.excludeIds.map((id) => `"${id.replace(/"/g, '\\"')}"`).join(',')})`);
        }
        if (query.dealType) q = q.eq('deal_type', query.dealType);
        if (query.propertyType) q = q.eq('property_type', query.propertyType);
        if (query.city) q = q.eq('city', query.city);

        if (query.rooms && query.rooms.length > 0) {
            const hasFour = query.rooms.includes(4);
            const exact = query.rooms.filter((r) => r !== 4);
            const conditions: string[] = exact.map((r) => `rooms.eq.${r}`);
            if (hasFour) conditions.push('rooms.gte.4');
            if (conditions.length > 0) q = q.or(conditions.join(','));
        }

        if (typeof query.priceMin === 'number') q = q.gte('price', query.priceMin);
        if (typeof query.priceMax === 'number') q = q.lte('price', query.priceMax);
        if (typeof query.areaMin === 'number') q = q.gte('area', query.areaMin);
        if (typeof query.areaMax === 'number') q = q.lte('area', query.areaMax);

        if (query.q && query.q.trim()) {
            const term = query.q.trim().replace(/[%,]/g, ' ');
            const pattern = `%${term}%`;
            q = q.or(
                [
                    `title.ilike.${pattern}`,
                    `address.ilike.${pattern}`,
                    `city.ilike.${pattern}`,
                    `district.ilike.${pattern}`,
                    `metro.ilike.${pattern}`,
                ].join(','),
            );
        }

        q = applySort(q, sort);

        const from = (page - 1) * perPage;
        const to = from + perPage - 1;
        q = q.range(from, to);

        const { data, error, count } = await q;
        if (error) throw error;

        const total = count ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / perPage));
        const safePage = Math.min(page, totalPages);

        const result: IListingsResponse = {
            items: (data ?? []).map((row) => toListing(row as ListingRow)),
            total,
            page: safePage,
            perPage,
            totalPages,
        };

        await cache.set(cacheKey, result, TTL.listings);
        return result;
    }

    static async getById(id: string): Promise<{ listing: IListing; similar: IListing[] } | null> {
        const cacheKey = CachePrefix.property + id;
        const cached = await cache.get<{ listing: IListing; similar: IListing[] }>(cacheKey);
        if (cached) return cached;

        const supabase = getServiceClient();

        const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!data) return null;

        const listing = toListing(data as ListingRow);

        const { data: similarRows, error: similarErr } = await supabase
            .from('listings')
            .select('*')
            .neq('id', listing.id)
            .eq('deal_type', listing.dealType)
            .eq('city', listing.city)
            .order('published_at', { ascending: false })
            .limit(6);
        if (similarErr) throw similarErr;

        const result = {
            listing,
            similar: (similarRows ?? []).map((row) => toListing(row as ListingRow)),
        };

        await cache.set(cacheKey, result, TTL.property);
        return result;
    }

    /** Invalidate cached pages for a city/dealType after a listing is created or updated */
    static async invalidateListCache(): Promise<void> {
        await cache.invalidatePattern(`${CachePrefix.listings}*`);
    }

    static async invalidateById(id: string): Promise<void> {
        await cache.del(`${CachePrefix.property}${id}`);
    }
}
