import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { BookingsRepo } from '@/shared/lib/bookingsRepo';

export async function GET() {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isHost) return NextResponse.json({ error: 'Host access required' }, { status: 403 });

    try {
        const bookings = await BookingsRepo.listForHost(session.userId);
        return NextResponse.json({ bookings }, { status: 200 });
    } catch (e) {
        console.error('[GET /api/host/bookings]', e);
        return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
    }
}
