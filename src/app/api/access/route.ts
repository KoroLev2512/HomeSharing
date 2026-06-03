/**
 * Access Policy API — управление цифровым доступом (§4.3 диплома).
 *
 * POST /api/access — выдать цифровой доступ (вызывается при подтверждении бронирования)
 * GET  /api/access — получить активные политики для текущего пользователя
 */

import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';
import { RentalEventLog } from '@/shared/lib/rentalEventLog';
import crypto from 'crypto';

export async function GET() {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from('access_policy')
        .select('*, iot_device(name, device_type, vendor)')
        .eq('guest_user_id', session.userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: 'Failed to load access policies' }, { status: 500 });
    return NextResponse.json({ policies: data ?? [] });
}

export async function POST(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
        bookingId: string;
        listingId: string;
        guestUserId: string;
        validFrom: string;
        validUntil: string;
    };

    const { bookingId, listingId, guestUserId, validFrom, validUntil } = body;
    if (!bookingId || !listingId || !guestUserId) {
        return NextResponse.json({ error: 'bookingId, listingId, guestUserId обязательны' }, { status: 400 });
    }

    // Проверяем, что запрашивающий — хост объявления или администратор
    if (!session.isAdmin && !session.isHost) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getServiceClient();

    // Ищем устройство объявления
    const { data: device } = await supabase
        .from('iot_device')
        .select('id, name')
        .eq('listing_id', listingId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

    // Генерируем код доступа (mock: hex-token)
    const accessCode = crypto.randomBytes(16).toString('hex').toUpperCase();

    const { data: policy, error } = await supabase
        .from('access_policy')
        .insert({
            booking_id:    bookingId,
            listing_id:    listingId,
            device_id:     device?.id ?? null,
            guest_user_id: guestUserId,
            access_code:   accessCode,
            valid_from:    validFrom ?? new Date().toISOString(),
            valid_until:   validUntil ?? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
            scope:         'guest',
            status:        'active',
            granted_by:    session.userId,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: 'Не удалось создать политику доступа' }, { status: 500 });

    // Событие в аудит-журнал (§3.4, §4.3)
    void RentalEventLog.write({
        eventType:  'access.granted',
        aggregateType: 'access',
        aggregateId: policy.id,
        actorUserId: session.userId,
        subjectUserId: guestUserId,
        deviceId:   device?.id,
        accessScope: 'guest',
        payload: { bookingId, listingId, policyId: policy.id, validFrom, validUntil },
    });

    return NextResponse.json({ policy }, { status: 201 });
}
