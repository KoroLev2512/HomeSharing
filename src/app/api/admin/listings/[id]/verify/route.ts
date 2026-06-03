import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';
import { RentalEventLog } from '@/shared/lib/rentalEventLog';
import type { RosreestrObjectData, RosreestrStatus } from '@/shared/types/listing';

interface VerifyBody {
    isVerified?: boolean;
    cadastralNumber?: string | null;
    rosreestrStatus?: RosreestrStatus;
    rosreestrData?: RosreestrObjectData | null;
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = (await req.json()) as VerifyBody;

    const patch: Record<string, unknown> = {};

    if (typeof body.isVerified === 'boolean') patch.is_verified = body.isVerified;
    if ('cadastralNumber' in body) patch.cadastral_number = body.cadastralNumber ?? null;
    if (body.rosreestrStatus) patch.rosreestr_status = body.rosreestrStatus;
    if ('rosreestrData' in body) {
        patch.rosreestr_data = body.rosreestrData ?? null;
        patch.rosreestr_checked_at = new Date().toISOString();
    }

    if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: 'Нет полей для обновления' }, { status: 400 });
    }

    try {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('listings')
            .update(patch)
            .eq('id', id)
            .select('id, is_verified, cadastral_number, rosreestr_status, rosreestr_checked_at')
            .single();

        if (error) throw error;

        // Записываем в аудит-журнал (§3.4)
        const rosreestrStatus = body.rosreestrStatus ?? null;
        if (rosreestrStatus) {
            const interpretationMap: Record<string, 'verified' | 'not_verified' | 'inconclusive' | 'technical_failure'> = {
                found: 'verified',
                not_found: 'not_verified',
                error: 'technical_failure',
            };
            void RentalEventLog.write({
                eventType: 'verification.completed',
                aggregateType: 'listing',
                aggregateId: id,
                actorUserId: session.userId,
                cadastralNumber: body.cadastralNumber ?? undefined,
                interpretationStatus: interpretationMap[rosreestrStatus] ?? 'inconclusive',
                interpretationReason: `Rosreestr check: ${rosreestrStatus}`,
                policyVersion: 'v1',
                payload: {
                    isVerified: body.isVerified,
                    rosreestrStatus,
                    rosreestrData: body.rosreestrData,
                },
            });
        }

        return NextResponse.json({ ok: true, listing: data });
    } catch (e) {
        console.error('[VERIFY_LISTING]', e);
        return NextResponse.json({ error: 'Не удалось обновить объявление' }, { status: 500 });
    }
}
