import { NextResponse } from 'next/server';
import { ListingsRepo } from '@/shared/lib/listingsRepo';
import type { DealType, ListingsSort, PropertyType } from '@/shared/types/listing';

const DEAL_TYPES: DealType[] = ['rent_long', 'rent_short', 'sale'];
const PROPERTY_TYPES: PropertyType[] = ['flat', 'room', 'house', 'studio'];
const SORTS: ListingsSort[] = ['new', 'cheap', 'expensive', 'area_desc'];

const parseInt10 = (v: string | null): number | undefined => {
    if (!v) return undefined;
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const dealTypeRaw = searchParams.get('dealType');
    const dealType = dealTypeRaw && DEAL_TYPES.includes(dealTypeRaw as DealType) ? (dealTypeRaw as DealType) : undefined;
    const propertyTypeRaw = searchParams.get('propertyType');
    const propertyType =
        propertyTypeRaw && PROPERTY_TYPES.includes(propertyTypeRaw as PropertyType)
            ? (propertyTypeRaw as PropertyType)
            : undefined;
    const sortRaw = searchParams.get('sort');
    const sort: ListingsSort = SORTS.includes(sortRaw as ListingsSort) ? (sortRaw as ListingsSort) : 'new';

    const roomsRaw = searchParams.get('rooms');
    const rooms = roomsRaw
        ? roomsRaw
              .split(',')
              .map((s) => parseInt(s, 10))
              .filter((n) => Number.isFinite(n))
        : undefined;

    const idsRaw = searchParams.get('ids');
    const ids = idsRaw ? idsRaw.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const excludeIdsRaw = searchParams.get('excludeIds');
    const excludeIds = excludeIdsRaw
        ? excludeIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined;

    if (ids && ids.length === 0) {
        return NextResponse.json(
            { items: [], total: 0, page: 1, perPage: 12, totalPages: 1 },
            { status: 200 },
        );
    }

    try {
        const response = await ListingsRepo.list({
            q: searchParams.get('q') ?? undefined,
            dealType,
            propertyType,
            rooms,
            priceMin: parseInt10(searchParams.get('priceMin')),
            priceMax: parseInt10(searchParams.get('priceMax')),
            areaMin: parseInt10(searchParams.get('areaMin')),
            areaMax: parseInt10(searchParams.get('areaMax')),
            city: searchParams.get('city') ?? undefined,
            sort,
            page: parseInt10(searchParams.get('page')) ?? 1,
            perPage: parseInt10(searchParams.get('perPage')) ?? 12,
            ids,
            excludeIds,
        });
        return NextResponse.json(response, { status: 200 });
    } catch (e) {
        console.error('[GET /api/listings]', e);
        return NextResponse.json({ error: 'Failed to load listings' }, { status: 500 });
    }
}
