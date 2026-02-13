import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const anonymousId = typeof body.anonymous_id === 'string' ? body.anonymous_id.trim() : '';

    if (!anonymousId) {
      return NextResponse.json({ error: 'anonymous_id is required' }, { status: 400 });
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
      is_approved: false,
      is_flagged: false,
    };

    if (typeof body.title === 'string') payload.title = body.title.trim() || null;
    if (typeof body.body === 'string') payload.body = body.body.trim();
    if (typeof body.image_path !== 'undefined') payload.image_path = body.image_path || null;

    if (!payload.body) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }

    const supabase: any = createClient();
    const { data: existing } = await supabase
      .from('forum_posts')
      .select('id, anonymous_id, author_role')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existing.author_role !== 'user' || existing.anonymous_id !== anonymousId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating forum post:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: 'Post updated and returned to moderation queue',
      requires_approval: true,
    });
  } catch (error) {
    console.error('Error in PATCH /api/forum/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const anonymousId = typeof body.anonymous_id === 'string' ? body.anonymous_id.trim() : '';

    if (!anonymousId) {
      return NextResponse.json({ error: 'anonymous_id is required' }, { status: 400 });
    }

    const supabase: any = createClient();
    const { data: existing } = await supabase
      .from('forum_posts')
      .select('id, anonymous_id, author_role')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existing.author_role !== 'user' || existing.anonymous_id !== anonymousId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting forum post:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/forum/posts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
