import { NextResponse } from 'next/server';
import { createId } from '@paralleldrive/cuid2';
import { loadSession } from '@/shared/lib/sessionGuards';
import { getServiceClient } from '@/shared/utils/supabase/service';

const LISTING_IMAGES_BUCKET = 'listing-images';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const getExt = (fileName: string, mimeType: string): string => {
    const fromName = fileName.split('.').pop()?.toLowerCase();
    if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
    if (mimeType === 'image/png') return 'png';
    if (mimeType === 'image/webp') return 'webp';
    if (mimeType === 'image/gif') return 'gif';
    return 'jpg';
};

export async function POST(req: Request) {
    const session = await loadSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.isHost) return NextResponse.json({ error: 'Host access required' }, { status: 403 });

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
        const objectPath = `${session.userId}/${createId()}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        let { error: uploadError } = await supabase.storage
            .from(LISTING_IMAGES_BUCKET)
            .upload(objectPath, buffer, {
                upsert: false,
                contentType: file.type,
                cacheControl: '3600',
            });

        if (uploadError?.message?.toLowerCase().includes('bucket') && uploadError.message.toLowerCase().includes('not found')) {
            const { error: createBucketError } = await supabase.storage.createBucket(LISTING_IMAGES_BUCKET, {
                public: true,
                fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
            });

            if (!createBucketError) {
                const retry = await supabase.storage
                    .from(LISTING_IMAGES_BUCKET)
                    .upload(objectPath, buffer, {
                        upsert: false,
                        contentType: file.type,
                        cacheControl: '3600',
                    });
                uploadError = retry.error;
            }
        }

        if (uploadError) {
            return NextResponse.json(
                { error: `Failed to upload image: ${uploadError.message}` },
                { status: 500 },
            );
        }

        const { data: publicData } = supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(objectPath);
        return NextResponse.json({ url: publicData.publicUrl }, { status: 200 });
    } catch (e) {
        console.error('[POST /api/host/listing-images]', e);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}
