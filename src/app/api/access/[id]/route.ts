import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';
import { RentalEventLog } from '@/shared/lib/rentalEventLog';

/** PATCH /api/access/[id] — отозвать доступ */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { reason } = (await req.json()) as { reason?: string };

    const supabase = getServiceClient();

    const { data: policy } = await supabase
        .from('access_policy')
        .select('id, guest_user_id, granted_by, device_id')
        .eq('id', id)
        .maybeSingle();

    if (!policy) return NextResponse.json({ error: 'Политика доступа не найдена' }, { status: 404 });

    // Только хост-создатель или администратор могут отозвать
    if (!session.isAdmin && policy.granted_by !== session.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
        .from('access_policy')
        .update({ status: 'revoked', revoked_at: new Date().toISOString(), revoke_reason: reason ?? 'manual_revoke' })
        .eq('id', id);

    if (error) return NextResponse.json({ error: 'Не удалось отозвать доступ' }, { status: 500 });

    void RentalEventLog.write({
        eventType: 'access.revoked',
        aggregateType: 'access',
        aggregateId: id,
        actorUserId: session.userId,
        subjectUserId: policy.guest_user_id,
        deviceId: policy.device_id ?? undefined,
        accessScope: 'guest',
        payload: { reason: reason ?? 'manual_revoke', revokedBy: session.userId },
    });

    return NextResponse.json({ ok: true });
}
