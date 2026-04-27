import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { HostListingsRepo, validateDraft } from '@/shared/lib/hostListingsRepo';

export async function GET() {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isHost) return NextResponse.json({ error: 'Host access required' }, { status: 403 });

    try {
        const listings = await HostListingsRepo.listOwnedBy(session.userId);
        return NextResponse.json({ listings }, { status: 200 });
    } catch (e) {
        console.error('[GET /api/host/listings]', e);
        return NextResponse.json({ error: 'Failed to load listings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isHost) return NextResponse.json({ error: 'Host access required' }, { status: 403 });

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const v = validateDraft(body as Record<string, unknown>);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

    try {
        const listing = await HostListingsRepo.create(v.draft, session.userId);
        return NextResponse.json({ listing }, { status: 201 });
    } catch (e) {
        console.error('[POST /api/host/listings]', e);
        return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
    }
}
