import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { FORUM_ALLOWED_MIME_TYPES, FORUM_MAX_FILE_SIZE_BYTES, buildForumImagePath, getExtensionFromMime } from '@/lib/utils/forumMedia';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const anonymousId = String(formData.get('anonymous_id') || 'anon');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!FORUM_ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP are allowed' }, { status: 400 });
    }

    if (file.size > FORUM_MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
    }

    const extension = getExtensionFromMime(file.type);
    if (!extension) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const path = buildForumImagePath(anonymousId, extension);
    const supabase: any = createServiceClient();

    const { error: uploadError } = await supabase.storage
      .from('forum-images')
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Error uploading forum image:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from('forum-images')
      .createSignedUrl(path, 60 * 60);

    if (signError) {
      console.error('Error signing forum image URL:', signError);
      return NextResponse.json({ error: 'Image uploaded, but preview URL failed' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        path,
        signed_preview_url: signed?.signedUrl || null,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/forum/uploads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
