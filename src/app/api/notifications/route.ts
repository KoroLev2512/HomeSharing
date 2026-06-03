import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';

export async function GET() {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return NextResponse.json({ error: 'Ошибка загрузки уведомлений' }, { status: 500 });
    return NextResponse.json({
        notifications: data ?? [],
        unreadCount: (data ?? []).filter((n) => !n.is_read).length,
    });
}
