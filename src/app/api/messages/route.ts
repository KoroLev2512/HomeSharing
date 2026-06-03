import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';

export async function GET(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const withUserId = searchParams.get('withUserId');
    const bookingId  = searchParams.get('bookingId');

    const supabase = getServiceClient();
    const userId = session.userId;

    if (withUserId) {
        // Диалог между двумя пользователями
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${withUserId}),and(sender_id.eq.${withUserId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: true })
            .limit(100);
        if (error) return NextResponse.json({ error: 'Ошибка загрузки сообщений' }, { status: 500 });
        return NextResponse.json({ messages: data ?? [] });
    }

    if (bookingId) {
        // Все сообщения по бронированию
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('booking_id', bookingId)
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
            .order('created_at', { ascending: true })
            .limit(100);
        if (error) return NextResponse.json({ error: 'Ошибка загрузки сообщений' }, { status: 500 });
        return NextResponse.json({ messages: data ?? [] });
    }

    // Список диалогов: последнее сообщение по каждому собеседнику
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) return NextResponse.json({ error: 'Ошибка загрузки сообщений' }, { status: 500 });

    // Дедупликация — по одному сообщению на диалог
    const seen = new Set<string>();
    const dialogues = (data ?? []).filter((m) => {
        const key = [m.sender_id, m.receiver_id].sort().join(':');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return NextResponse.json({ dialogues });
}

export async function POST(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json() as {
        receiverId: string;
        text: string;
        bookingId?: string;
        listingId?: string;
    };

    if (!body.receiverId || !body.text?.trim()) {
        return NextResponse.json({ error: 'receiverId и text обязательны' }, { status: 400 });
    }
    if (body.text.length > 2000) {
        return NextResponse.json({ error: 'Сообщение слишком длинное (макс. 2000 символов)' }, { status: 400 });
    }
    if (body.receiverId === session.userId) {
        return NextResponse.json({ error: 'Нельзя написать самому себе' }, { status: 400 });
    }

    const supabase = getServiceClient();

    const { data, error } = await supabase
        .from('messages')
        .insert({
            sender_id:   session.userId,
            receiver_id: body.receiverId,
            text:        body.text.trim(),
            booking_id:  body.bookingId ?? null,
            listing_id:  body.listingId ?? null,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: 'Не удалось отправить сообщение' }, { status: 500 });

    // Создаём уведомление для получателя
    await supabase.from('notifications').insert({
        user_id:  body.receiverId,
        type:     'new_message',
        title:    'Новое сообщение',
        body:     body.text.slice(0, 100),
        link:     `/messages?withUserId=${session.userId}`,
    });

    return NextResponse.json({ message: data }, { status: 201 });
}
