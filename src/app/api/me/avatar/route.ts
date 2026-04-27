import { NextResponse } from 'next/server';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';

const AVATARS_BUCKET = 'avatars';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const getExt = (fileName: string, mimeType: string): string => {
    const fromName = fileName.split('.').pop()?.toLowerCase();
    if (fromName) return fromName;
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    if (mimeType === 'image/gif') return 'gif';
    return 'jpg';
};

export async function POST(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const form = await req.formData();
        const file = form.get('file');
        if (!(file instanceof File)) {
            return NextResponse.json({ error: 'File is required (field: file)' }, { status: 400 });
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: 'File size must be between 1 byte and 5MB' }, { status: 400 });
        }

        const supabase = getServiceClient();
        const ext = getExt(file.name, file.type);
        const objectPath = `${session.userId}/${Date.now()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        const { error: uploadError } = await supabase.storage
            .from(AVATARS_BUCKET)
            .upload(objectPath, buffer, {
                upsert: true,
                contentType: file.type,
                cacheControl: '3600',
            });

        if (uploadError) {
            return NextResponse.json(
                {
                    error:
                        'Failed to upload avatar to storage. Ensure bucket "avatars" exists and has public read access.',
                },
                { status: 500 },
            );
        }

        const { data: publicData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(objectPath);
        const imageUrl = publicData.publicUrl;

        const { data: updatedUser, error: updateError } = await supabase
            .from('User')
            .update({ image: imageUrl })
            .eq('id', session.userId)
            .select('id, image')
            .maybeSingle();

        if (updateError) throw updateError;
        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ image: imageUrl }, { status: 200 });
    } catch (e) {
        console.error('[POST /api/me/avatar]', e);
        return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
}

export async function DELETE() {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const supabase = getServiceClient();
        const { data: updatedUser, error: updateError } = await supabase
            .from('User')
            .update({ image: null })
            .eq('id', session.userId)
            .select('id, image')
            .maybeSingle();

        if (updateError) throw updateError;
        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ image: null }, { status: 200 });
    } catch (e) {
        console.error('[DELETE /api/me/avatar]', e);
        return NextResponse.json({ error: 'Failed to reset avatar' }, { status: 500 });
    }
}
