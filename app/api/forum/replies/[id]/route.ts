import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const anonymousId = typeof body.anonymous_id === 'string' ? body.anonymous_id.trim() : '';
    const content = typeof body.body === 'string' ? body.body.trim() : '';

    if (!anonymousId || !content) {
      return NextResponse.json({ error: 'anonymous_id and body are required' }, { status: 400 });
    }

    const supabase: any = createServiceClient();
    const { data: existing } = await supabase
      .from('forum_replies')
      .select('id, anonymous_id, author_role')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    if (existing.author_role !== 'user' || existing.anonymous_id !== anonymousId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload: Record<string, any> = {
      body: content,
      updated_at: new Date().toISOString(),
      is_approved: false,
      is_flagged: false,
    };

    if (typeof body.image_path !== 'undefined') {
      payload.image_path = body.image_path || null;
    }

    const { data, error } = await supabase
      .from('forum_replies')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating forum reply:', error);
      return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: 'Reply updated and returned to moderation queue',
      requires_approval: true,
    });
  } catch (error) {
    console.error('Error in PATCH /api/forum/replies/[id]:', error);
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

    const supabase: any = createServiceClient();
    const { data: existing } = await supabase
      .from('forum_replies')
      .select('id, anonymous_id, author_role')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    if (existing.author_role !== 'user' || existing.anonymous_id !== anonymousId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('forum_replies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting forum reply:', error);
      return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/forum/replies/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
