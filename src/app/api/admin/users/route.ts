import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';
import type { IAdminUser } from '@/shared/types/admin';

interface UserRow {
    id: string;
    name: string | null;
    username: string | null;
    email: string;
    image: string | null;
    isAdmin: boolean;
    isHost: boolean;
    isUser: boolean;
    isService: boolean;
    createdAt: string;
}

const toUser = (row: UserRow): IAdminUser => ({
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    image: row.image,
    isAdmin: Boolean(row.isAdmin),
    isHost: Boolean(row.isService),
    isUser: Boolean(row.isUser),
    createdAt: row.createdAt,
});

export async function GET(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    try {
        const supabase = getServiceClient();
        let q = supabase
            .from('User')
            .select('id, name, username, email, image, isAdmin, isService, isUser, createdAt')
            .order('createdAt', { ascending: false });

        if (role === 'admin') q = q.eq('isAdmin', true);
        else if (role === 'host') q = q.eq('isService', true);
        else if (role === 'user') q = q.eq('isAdmin', false).eq('isService', false);

        const { data, error } = await q;
        if (error) throw error;

        return NextResponse.json({ users: (data ?? []).map((r) => toUser(r as UserRow)) });
    } catch (e) {
        console.error('[GET /api/admin/users]', e);
        return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }
}
