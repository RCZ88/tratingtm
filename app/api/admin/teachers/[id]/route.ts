import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { validate, uuidSchema } from '@/lib/utils/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getCurrentWeekStart, toISODate } from '@/lib/utils/dateHelpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/teachers/[id]
 * Admin teacher detail with stats and approved comments.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const uuidValidation = validate(uuidSchema, id);
    if (!uuidValidation.success) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const { data: stats } = await supabase
      .from('teacher_stats')
      .select('*')
      .eq('id', id)
      .single();

    const { data: department } = teacher.department_id
      ? await supabase
          .from('departments')
          .select('id, name, color_hex')
          .eq('id', teacher.department_id)
          .maybeSingle()
      : { data: null };

    const { data: subjectRows } = await supabase
      .from('teacher_subjects')
      .select('subject:subjects(id, name)')
      .eq('teacher_id', id);

    const subjects = (subjectRows || [])
      .map((row: any) => row.subject)
      .filter(Boolean)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    const { data: ratings } = await supabase
      .from('ratings')
      .select('stars')
      .eq('teacher_id', id);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings?.forEach((r) => {
      distribution[r.stars as keyof typeof distribution]++;
    });

    const { data: comments } = await supabase
      .from('comments')
      .select('id, comment_text, created_at')
      .eq('teacher_id', id)
      .eq('is_approved', true)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .limit(10);

    const commentIds = comments?.map((c) => c.id) || [];
    const reactionMap = new Map<
      string,
      { like_count: number; dislike_count: number; viewer_reaction: 'like' | 'dislike' | null }
    >();

    commentIds.forEach((commentId) => {
      reactionMap.set(commentId, { like_count: 0, dislike_count: 0, viewer_reaction: null });
    });

    if (commentIds.length > 0) {
      const { data: reactions } = await supabase
        .from('comment_reactions')
        .select('comment_id, reaction')
        .in('comment_id', commentIds);

      reactions?.forEach((reaction) => {
        const entry = reactionMap.get(reaction.comment_id);
        if (!entry) return;
        if (reaction.reaction === 'like') entry.like_count += 1;
        if (reaction.reaction === 'dislike') entry.dislike_count += 1;
      });
    }

    const commentsWithReactions = (comments || []).map((comment) => {
      const counts = reactionMap.get(comment.id) || {
        like_count: 0,
        dislike_count: 0,
        viewer_reaction: null,
      };
      return {
        ...comment,
        like_count: counts.like_count,
        dislike_count: counts.dislike_count,
        viewer_reaction: counts.viewer_reaction,
      };
    });

    const weekStart = toISODate(getCurrentWeekStart());
    const { data: weeklyRatings } = await supabase
      .from('weekly_ratings')
      .select('stars')
      .eq('teacher_id', id)
      .eq('week_start', weekStart);

    const weeklyCount = weeklyRatings?.length || 0;
    const weeklySum = (weeklyRatings || []).reduce((sum, row) => sum + row.stars, 0);
    const weeklyAverage = weeklyCount >= 3 ? Number((weeklySum / weeklyCount).toFixed(2)) : null;

    return NextResponse.json({
      data: {
        ...teacher,
        department: department || null,
        subjects,
        subject_ids: subjects.map((s: any) => s.id),
        primary_subject: subjects[0]?.name || null,
        total_ratings: stats?.total_ratings || 0,
        average_rating: stats?.overall_rating || 0,
        total_comments: stats?.total_comments || 0,
        weekly_rating_count: weeklyCount,
        weekly_average_rating: weeklyAverage,
        rating_distribution: distribution,
        comments: commentsWithReactions,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/teachers/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}