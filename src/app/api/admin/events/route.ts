import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { RentalEventLog } from '@/shared/lib/rentalEventLog';

export async function GET(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const eventType           = searchParams.get('eventType') ?? undefined;
    const aggregateType       = searchParams.get('aggregateType') ?? undefined;
    const actorUserId         = searchParams.get('actorUserId') ?? undefined;
    const interpretationStatus = searchParams.get('interpretationStatus') ?? undefined;
    const limit               = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '30')));
    const offset              = Math.max(0, Number(searchParams.get('offset') ?? '0'));

    const result = await RentalEventLog.list({
        eventType,
        aggregateType,
        actorUserId,
        interpretationStatus,
        limit,
        offset,
    });

    return NextResponse.json(result);
}
