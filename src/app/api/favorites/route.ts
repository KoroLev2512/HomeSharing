import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/lib/auth';
import { getServiceClient } from '@/shared/utils/supabase/service';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = getServiceClient();
        const { data, error } = await supabase
            .from('favorites')
            .select('listing_id, created_at')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json(
            { favorites: (data ?? []).map((row) => row.listing_id as string) },
            { status: 200 },
        );
    } catch (e) {
        console.error('[GET /api/favorites]', e);
        return NextResponse.json({ error: 'Failed to load favorites' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const listingId = (body as { listingId?: unknown })?.listingId;
    if (typeof listingId !== 'string' || listingId.length === 0) {
        return NextResponse.json({ error: 'listingId is required' }, { status: 400 });
    }

    try {
        const supabase = getServiceClient();
        const { error } = await supabase
            .from('favorites')
            .upsert(
                { user_id: session.user.id, listing_id: listingId },
                { onConflict: 'user_id,listing_id', ignoreDuplicates: true },
            );

        if (error) {
            // FK violation → unknown listing
            if (error.code === '23503') {
                return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e) {
        console.error('[POST /api/favorites]', e);
        return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }
}

export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = getServiceClient();
        const { error } = await supabase.from('favorites').delete().eq('user_id', session.user.id);
        if (error) throw error;
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e) {
        console.error('[DELETE /api/favorites]', e);
        return NextResponse.json({ error: 'Failed to clear favorites' }, { status: 500 });
    }
}
