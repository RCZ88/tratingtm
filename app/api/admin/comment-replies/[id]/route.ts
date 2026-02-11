import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';
import { validate, replyModerationSchema, uuidSchema } from '@/lib/utils/validation';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/comment-replies/[id]
 * Update moderation flags for a reply.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const idValidation = validate(uuidSchema, id);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid reply ID' }, { status: 400 });
    }

    const body = await request.json();
    const validation = validate(replyModerationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from('comment_replies')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('comment_replies')
      .update(validation.data)
      .eq('id', id)
      .select('id, comment_id, parent_reply_id, reply_text, anonymous_id, is_approved, is_flagged, created_at')
      .single();

    if (error) {
      console.error('Error updating reply:', error);
      return NextResponse.json({ error: 'Failed to update reply' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Reply updated successfully' });
  } catch (error) {
    console.error('Error in PUT /api/admin/comment-replies/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/comment-replies/[id]
 * Permanently delete a reply.
 */
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
    const idValidation = validate(uuidSchema, id);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'Invalid reply ID' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: existing } = await supabase
      .from('comment_replies')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Reply not found' }, { status: 404 });
    }

    const { error } = await supabase.from('comment_replies').delete().eq('id', id);
    if (error) {
      console.error('Error deleting reply:', error);
      return NextResponse.json({ error: 'Failed to delete reply' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/comment-replies/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
