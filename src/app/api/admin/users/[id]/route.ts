import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;

    let body: unknown;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const b = body as Record<string, unknown>;
    const patch: Record<string, boolean> = {};
    if (typeof b.isAdmin === 'boolean') patch.isAdmin = b.isAdmin;
    if (typeof b.isHost === 'boolean') patch.isService = b.isHost;
    if (typeof b.isUser === 'boolean') patch.isUser = b.isUser;

    if (Object.keys(patch).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    try {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('User')
            .update(patch)
            .eq('id', id)
            .select('id, name, username, email, image, isAdmin, isService, isUser, createdAt')
            .maybeSingle();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const row = data as { id: string; name: string | null; username: string | null; email: string; image: string | null; isAdmin: boolean; isService: boolean; isUser: boolean; createdAt: string };
        return NextResponse.json({
            user: {
                id: row.id,
                name: row.name,
                username: row.username,
                email: row.email,
                image: row.image,
                isAdmin: Boolean(row.isAdmin),
                isHost: Boolean(row.isService),
                isUser: Boolean(row.isUser),
                createdAt: row.createdAt,
            },
        });
    } catch (e) {
        console.error('[PATCH /api/admin/users/[id]]', e);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
