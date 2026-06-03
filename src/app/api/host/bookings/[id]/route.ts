import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { BookingsRepo } from '@/shared/lib/bookingsRepo';
import { RentalEventLog } from '@/shared/lib/rentalEventLog';
import type { BookingStatus } from '@/shared/types/booking';

const STATUS_TO_EVENT: Partial<Record<BookingStatus, 'booking.confirmed' | 'booking.cancelled' | 'booking.completed' | 'booking.rejected'>> = {
    confirmed: 'booking.confirmed',
    cancelled: 'booking.cancelled',
    completed: 'booking.completed',
    rejected:  'booking.rejected',
};

const HOST_ALLOWED_STATUSES: BookingStatus[] = ['confirmed', 'rejected', 'completed', 'cancelled'];

const HOST_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    pending: ['confirmed', 'rejected', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    cancelled: [],
    rejected: [],
    completed: [],
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isHost) return NextResponse.json({ error: 'Host access required' }, { status: 403 });

    const { id } = await params;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const status = (body as { status?: unknown }).status;
    if (typeof status !== 'string' || !HOST_ALLOWED_STATUSES.includes(status as BookingStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await BookingsRepo.getById(id);
    if (!existing) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (existing.hostId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowed = HOST_TRANSITIONS[existing.status];
    if (!allowed.includes(status as BookingStatus)) {
        return NextResponse.json(
            { error: `Cannot transition booking from ${existing.status} to ${status}` },
            { status: 400 },
        );
    }

    const updated = await BookingsRepo.setStatus(id, status as BookingStatus);
    const eventType = STATUS_TO_EVENT[status as BookingStatus];
    if (eventType) {
        void RentalEventLog.write({
            eventType,
            aggregateType: 'booking',
            aggregateId: id,
            actorUserId: session.userId,
            subjectUserId: existing.guestId,
            payload: { fromStatus: existing.status, toStatus: status, changedBy: 'host' },
        });
    }
    return NextResponse.json({ booking: updated }, { status: 200 });
}
