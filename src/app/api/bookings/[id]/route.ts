import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { BookingsRepo } from '@/shared/lib/bookingsRepo';

/**
 * Guest endpoint: cancel own booking. Only allowed while still pending/confirmed.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const status = (body as { status?: unknown }).status;
    if (status !== 'cancelled') {
        return NextResponse.json({ error: 'Only cancellation is allowed for guests' }, { status: 400 });
    }

    const existing = await BookingsRepo.getById(id);
    if (!existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (existing.guestId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (existing.status === 'cancelled' || existing.status === 'completed' || existing.status === 'rejected') {
        return NextResponse.json({ error: `Cannot cancel a ${existing.status} booking` }, { status: 400 });
    }

    const updated = await BookingsRepo.setStatus(id, 'cancelled');
    return NextResponse.json({ booking: updated }, { status: 200 });
}
