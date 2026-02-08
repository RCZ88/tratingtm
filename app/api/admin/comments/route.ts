import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/comments
 *
 * Admin comment list with filters.
 * Query params:
 * - status: all | approved | pending | hidden
 * - teacher_id
 * - q (search in comment_text)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all').toLowerCase();
    const teacherId = searchParams.get('teacher_id');
    const query = searchParams.get('q');

    const supabase = createServiceClient();

    let dbQuery = supabase
      .from('comments')
      .select('*, teacher:teachers(id, name, image_url)')
      .order('created_at', { ascending: false });

    if (teacherId) {
      dbQuery = dbQuery.eq('teacher_id', teacherId);
    }

    if (query) {
      dbQuery = dbQuery.ilike('comment_text', `%${query}%`);
    }

    if (status === 'approved') {
      dbQuery = dbQuery.eq('is_approved', true).eq('is_flagged', false);
    } else if (status === 'pending') {
      dbQuery = dbQuery.eq('is_approved', false).eq('is_flagged', false);
    } else if (status === 'hidden') {
      dbQuery = dbQuery.eq('is_flagged', true);
    }

    const { data, error } = await dbQuery;
    if (error) {
      console.error('Error fetching admin comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
