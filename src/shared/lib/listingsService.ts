import type { IListing, IListingsQuery, IListingsResponse } from '@/shared/types/listing';

const buildQueryString = (query: IListingsQuery): string => {
    const params = new URLSearchParams();
    if (query.q) params.set('q', query.q);
    if (query.dealType) params.set('dealType', query.dealType);
    if (query.propertyType) params.set('propertyType', query.propertyType);
    if (query.rooms && query.rooms.length > 0) params.set('rooms', query.rooms.join(','));
    if (typeof query.priceMin === 'number') params.set('priceMin', String(query.priceMin));
    if (typeof query.priceMax === 'number') params.set('priceMax', String(query.priceMax));
    if (typeof query.areaMin === 'number') params.set('areaMin', String(query.areaMin));
    if (typeof query.areaMax === 'number') params.set('areaMax', String(query.areaMax));
    if (query.city) params.set('city', query.city);
    if (query.sort) params.set('sort', query.sort);
    if (query.page) params.set('page', String(query.page));
    if (query.perPage) params.set('perPage', String(query.perPage));
    if (query.ids && query.ids.length > 0) params.set('ids', query.ids.join(','));
    if (query.excludeIds && query.excludeIds.length > 0) params.set('excludeIds', query.excludeIds.join(','));
    const qs = params.toString();
    return qs ? `?${qs}` : '';
};

class ListingsService {
    static async list(query: IListingsQuery = {}): Promise<IListingsResponse> {
        const res = await fetch(`/api/listings${buildQueryString(query)}`, { method: 'GET' });
        if (!res.ok) throw new Error('Failed to fetch listings');
        return res.json();
    }

    static async getById(id: string): Promise<{ listing: IListing; similar: IListing[] } | null> {
        const res = await fetch(`/api/listings/${encodeURIComponent(id)}`, { method: 'GET' });
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch listing');
        return res.json();
    }
}

export default ListingsService;
