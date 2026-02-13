import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof body.title === 'string') payload.title = body.title.trim() || null;
    if (typeof body.body === 'string') payload.body = body.body.trim();
    if (typeof body.is_approved === 'boolean') payload.is_approved = body.is_approved;
    if (typeof body.is_flagged === 'boolean') payload.is_flagged = body.is_flagged;
    if (typeof body.image_path !== 'undefined') payload.image_path = body.image_path || null;
    if (typeof body.is_pinned === 'boolean') {
      payload.is_pinned = body.is_pinned;
      payload.pinned_at = body.is_pinned ? new Date().toISOString() : null;
    }

    const supabase: any = createServiceClient();
    const { data, error } = await supabase
      .from('forum_posts')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating admin forum post:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/forum/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase: any = createServiceClient();
    const { error } = await supabase.from('forum_posts').delete().eq('id', id);

    if (error) {
      console.error('Error deleting admin forum post:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/forum/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
