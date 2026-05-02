import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { BookingsRepo } from '@/shared/lib/bookingsRepo';
import type { BookingStatus } from '@/shared/types/booking';

const VALID_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;

    let body: unknown;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const status = (body as { status?: unknown }).status;
    if (!VALID_STATUSES.includes(status as BookingStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    try {
        const booking = await BookingsRepo.setStatus(id, status as BookingStatus);
        if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        return NextResponse.json({ booking });
    } catch (e) {
        console.error('[PATCH /api/admin/bookings/[id]]', e);
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }
}
