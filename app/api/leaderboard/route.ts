import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentWeekStart, getCurrentWeekEnd, toISODate } from '@/lib/utils/dateHelpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/leaderboard
 * 
 * Get the current week's leaderboard.
 * Returns top and bottom ranked teachers.
 * Query params: week_start (optional, ISO date string)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStartParam = searchParams.get('week_start');
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createClient();

    let weekStart: Date;
    let weekEnd: Date;

    if (weekStartParam) {
      weekStart = new Date(weekStartParam);
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
    } else {
      weekStart = getCurrentWeekStart();
      weekEnd = getCurrentWeekEnd();
    }

    const currentWeekStart = getCurrentWeekStart();
    const isCurrentWeek = toISODate(weekStart) === toISODate(currentWeekStart);

    if (!isCurrentWeek) {
      // For past weeks, use cached data (populated by cron)
      const { data: cachedLeaderboard } = await supabase
        .from('leaderboard_cache')
        .select(`
          *,
          teacher:teachers(id, name, subject, department, image_url)
        `)
        .eq('week_start', toISODate(weekStart))
        .order('rank_position', { ascending: true });

      if (cachedLeaderboard && cachedLeaderboard.length > 0) {
        const formatted = cachedLeaderboard.map((entry) => ({
          id: entry.teacher_id,
          name: entry.teacher?.name,
          subject: entry.teacher?.subject,
          department: entry.teacher?.department,
          image_url: entry.teacher?.image_url,
          rating_count: entry.total_ratings,
          average_rating: entry.average_rating,
          comment_count: entry.total_comments,
          rank_position: entry.rank_position,
        }));

        return NextResponse.json({
          data: {
            week_start: toISODate(weekStart),
            week_end: toISODate(weekEnd),
            top: formatted.filter((e) => e.rank_position && e.rank_position <= limit),
            bottom: formatted
              .filter((e) => e.rank_position && e.rank_position > formatted.length - limit)
              .reverse(),
            all: formatted,
          },
        });
      }
    }

    // Live computation for current week (fast + always fresh)
    const [topRes, bottomRes] = await Promise.all([
      supabase
        .from('current_week_leaderboard')
        .select('*')
        .order('average_rating', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(limit),
      supabase
        .from('current_week_leaderboard')
        .select('*')
        .order('average_rating', { ascending: true })
        .order('rating_count', { ascending: true })
        .limit(limit),
    ]);

    if (topRes.error || bottomRes.error) {
      console.error('Error fetching leaderboard:', topRes.error || bottomRes.error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    const top = topRes.data || [];
    const bottom = bottomRes.data || [];

    return NextResponse.json({
      data: {
        week_start: toISODate(weekStart),
        week_end: toISODate(weekEnd),
        top,
        bottom,
        all: [...top, ...bottom],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
