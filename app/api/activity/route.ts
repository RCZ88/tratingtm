import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient();

    const [ratingsResult, commentsResult, repliesResult] = await Promise.all([
      supabase
        .from('ratings')
        .select('id, teacher_id, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('comments')
        .select('id, teacher_id, created_at')
        .eq('is_approved', true)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('comment_replies')
        .select('id, created_at, comments!inner(teacher_id)')
        .eq('is_approved', true)
        .eq('is_flagged', false)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (ratingsResult.error || commentsResult.error || repliesResult.error) {
      console.error('Error fetching activity:', ratingsResult.error || commentsResult.error || repliesResult.error);
      return NextResponse.json({ error: 'Failed to load activity' }, { status: 500 });
    }

    const ratingRows = (ratingsResult.data || []).map((row) => ({
      id: `rating_${row.id}`,
      type: 'rating' as const,
      teacher_id: row.teacher_id,
      created_at: row.created_at,
    }));

    const commentRows = (commentsResult.data || []).map((row) => ({
      id: `comment_${row.id}`,
      type: 'comment' as const,
      teacher_id: row.teacher_id,
      created_at: row.created_at,
    }));

    const replyRows = (repliesResult.data || [])
      .map((row: any) => ({
        id: `reply_${row.id}`,
        type: 'reply' as const,
        teacher_id: row.comments?.teacher_id || null,
        created_at: row.created_at,
      }))
      .filter((row) => !!row.teacher_id);

    const combined = [...ratingRows, ...commentRows, ...replyRows];

    const teacherIds = Array.from(new Set(combined.map((item) => item.teacher_id))).filter(Boolean);
    const { data: teachers } = teacherIds.length > 0
      ? await supabase
          .from('teachers')
          .select('id, name')
          .in('id', teacherIds)
      : { data: [] };

    const teacherMap = new Map((teachers || []).map((t) => [t.id, t.name]));

    const items = combined
      .map((item) => ({
        ...item,
        teacher_name: teacherMap.get(item.teacher_id) || null,
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('Error in GET /api/activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
