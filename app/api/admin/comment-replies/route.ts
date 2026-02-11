import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/comment-replies
 * Query params:
 * - comment_id (required)
 * - status: all | approved | pending | hidden
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('comment_id');
    const status = (searchParams.get('status') || 'all').toLowerCase();

    if (!commentId) {
      return NextResponse.json({ error: 'comment_id is required' }, { status: 400 });
    }

    const supabase = createServiceClient();
    let query = supabase
      .from('comment_replies')
      .select('id, comment_id, parent_reply_id, reply_text, anonymous_id, is_approved, is_flagged, created_at')
      .eq('comment_id', commentId)
      .order('created_at', { ascending: true });

    if (status === 'approved') {
      query = query.eq('is_approved', true).eq('is_flagged', false);
    } else if (status === 'pending') {
      query = query.eq('is_approved', false).eq('is_flagged', false);
    } else if (status === 'hidden') {
      query = query.eq('is_flagged', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching admin replies:', error);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/comment-replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
