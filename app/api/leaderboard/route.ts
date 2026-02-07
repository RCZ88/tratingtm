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
        .gt('total_ratings', 0)
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

        const byTop = [...formatted].sort((a, b) => {
          const aAvg = a.average_rating ?? -1;
          const bAvg = b.average_rating ?? -1;
          if (bAvg !== aAvg) return bAvg - aAvg;
          const aCount = a.rating_count ?? 0;
          const bCount = b.rating_count ?? 0;
          return bCount - aCount;
        });

        const byBottom = [...formatted].sort((a, b) => {
          const aAvg = a.average_rating ?? -1;
          const bAvg = b.average_rating ?? -1;
          if (aAvg !== bAvg) return aAvg - bAvg;
          const aCount = a.rating_count ?? 0;
          const bCount = b.rating_count ?? 0;
          return bCount - aCount;
        });

        return NextResponse.json({
          data: {
            week_start: toISODate(weekStart),
            week_end: toISODate(weekEnd),
            top: byTop.slice(0, limit),
            bottom: byBottom.slice(0, limit),
            all: formatted,
          },
        });
      }
    }

    // Live computation for current week (fast + always fresh)
    const { data: allRows, error: allError } = await supabase
      .from('current_week_leaderboard')
      .select('*')
      .gt('rating_count', 0);

    if (allError) {
      console.error('Error fetching leaderboard:', allError);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    const safeRows = allRows || [];
    const byTop = [...safeRows].sort((a, b) => {
      const aAvg = a.average_rating ?? -1;
      const bAvg = b.average_rating ?? -1;
      if (bAvg !== aAvg) return bAvg - aAvg;
      const aCount = a.rating_count ?? 0;
      const bCount = b.rating_count ?? 0;
      return bCount - aCount;
    });
    const byBottom = [...safeRows].sort((a, b) => {
      const aAvg = a.average_rating ?? -1;
      const bAvg = b.average_rating ?? -1;
      if (aAvg !== bAvg) return aAvg - bAvg;
      const aCount = a.rating_count ?? 0;
      const bCount = b.rating_count ?? 0;
      return bCount - aCount;
    });

    const top = byTop.slice(0, limit);
    const bottom = byBottom.slice(0, limit);

    return NextResponse.json({
      data: {
        week_start: toISODate(weekStart),
        week_end: toISODate(weekEnd),
        top,
        bottom,
        all: safeRows,
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
