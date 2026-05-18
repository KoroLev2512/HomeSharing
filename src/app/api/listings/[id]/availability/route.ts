import { NextResponse } from 'next/server';
import { BookingsRepo } from '@/shared/lib/bookingsRepo';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    try {
        const ranges = await BookingsRepo.getBookedRanges(id);
        return NextResponse.json({ ranges }, {
            status: 200,
            headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=30' },
        });
    } catch {
        return NextResponse.json({ error: 'Failed to load availability' }, { status: 500 });
    }
}
