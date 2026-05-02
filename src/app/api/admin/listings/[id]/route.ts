import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;

    try {
        const supabase = getServiceClient();
        const { error } = await supabase.from('listings').delete().eq('id', id);
        if (error) throw error;
        return new NextResponse(null, { status: 204 });
    } catch (e) {
        console.error('[DELETE /api/admin/listings/[id]]', e);
        return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }
}
