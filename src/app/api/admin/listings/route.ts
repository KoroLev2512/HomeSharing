import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { ListingsRepo } from '@/shared/lib/listingsRepo';

export async function GET(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const dealType = searchParams.get('dealType') ?? undefined;
    const city = searchParams.get('city') ?? undefined;

    try {
        const result = await ListingsRepo.list({
            page,
            perPage: 20,
            dealType: dealType as any,
            city,
            sort: 'new',
        });
        return NextResponse.json(result);
    } catch (e) {
        console.error('[GET /api/admin/listings]', e);
        return NextResponse.json({ error: 'Failed to load listings' }, { status: 500 });
    }
}
