import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';

/**
 * Allow the current user to flip a small whitelist of self-managed flags.
 * Currently: `isService` (host opt-in/opt-out).
 *
 * Note: NextAuth uses a JWT session, so the new value is reflected in the
 * session only after the next refresh. The client should re-fetch the session
 * (next-auth's `useSession` does this automatically on focus).
 */
export async function PATCH(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const isHost = (body as { isHost?: unknown }).isHost;
    if (typeof isHost !== 'boolean') {
        return NextResponse.json({ error: 'isHost (boolean) is required' }, { status: 400 });
    }

    try {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('User')
            .update({ isService: isHost })
            .eq('id', session.userId)
            .select('id, isAdmin, isService, isUser')
            .maybeSingle();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        return NextResponse.json(
            {
                user: {
                    id: data.id as string,
                    isAdmin: Boolean(data.isAdmin),
                    isService: Boolean(data.isService),
                    isUser: Boolean(data.isUser),
                },
            },
            { status: 200 },
        );
    } catch (e) {
        console.error('[PATCH /api/me]', e);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
