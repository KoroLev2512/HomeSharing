import { NextResponse } from 'next/server';
import { ListingsRepo } from '@/shared/lib/listingsRepo';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const result = await ListingsRepo.getById(id);
        if (!result) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }
        return NextResponse.json(result, { status: 200 });
    } catch (e) {
        console.error('[GET /api/listings/[id]]', e);
        return NextResponse.json({ error: 'Failed to load listing' }, { status: 500 });
    }
}
