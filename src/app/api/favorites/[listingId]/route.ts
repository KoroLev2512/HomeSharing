import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/lib/auth';
import { getServiceClient } from '@/shared/utils/supabase/service';

export async function DELETE(_req: Request, { params }: { params: Promise<{ listingId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await params;

    try {
        const supabase = getServiceClient();
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', session.user.id)
            .eq('listing_id', listingId);

        if (error) throw error;
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e) {
        console.error('[DELETE /api/favorites/[listingId]]', e);
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }
}
