import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');
    const status = (searchParams.get('status') || 'all').toLowerCase();

    const supabase: any = createServiceClient();
    let query = supabase
      .from('forum_replies')
      .select('*')
      .order('created_at', { ascending: false });

    if (postId) query = query.eq('post_id', postId);
    if (status === 'approved') query = query.eq('is_approved', true).eq('is_flagged', false);
    if (status === 'pending') query = query.eq('is_approved', false).eq('is_flagged', false);
    if (status === 'hidden') query = query.eq('is_flagged', true);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin forum replies:', error);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/forum/replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
