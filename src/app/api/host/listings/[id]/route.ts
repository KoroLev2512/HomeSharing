import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { HostListingsRepo, validateDraft } from '@/shared/lib/hostListingsRepo';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isHost) return NextResponse.json({ error: 'Host access required' }, { status: 403 });

    const { id } = await params;
    const listing = await HostListingsRepo.getOwned(id, session.userId);
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    return NextResponse.json({ listing }, { status: 200 });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isHost) return NextResponse.json({ error: 'Host access required' }, { status: 403 });

    const { id } = await params;

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const v = validateDraft(body as Record<string, unknown>);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

    try {
        const listing = await HostListingsRepo.update(id, session.userId, v.draft);
        if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        return NextResponse.json({ listing }, { status: 200 });
    } catch (e) {
        console.error('[PUT /api/host/listings/[id]]', e);
        return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isHost) return NextResponse.json({ error: 'Host access required' }, { status: 403 });

    const { id } = await params;
    try {
        const ok = await HostListingsRepo.delete(id, session.userId);
        if (!ok) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (e) {
        console.error('[DELETE /api/host/listings/[id]]', e);
        return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }
}
