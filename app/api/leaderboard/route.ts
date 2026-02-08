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
          teacher:teachers(id, name, department_id, image_url)
        `)
        .eq('week_start', toISODate(weekStart))
        .gt('total_ratings', 0)
        .order('rank_position', { ascending: true });

      if (cachedLeaderboard && cachedLeaderboard.length > 0) {
        const teacherIds = cachedLeaderboard.map((entry) => entry.teacher_id);
        const departmentIds = Array.from(
          new Set(
            cachedLeaderboard
              .map((entry) => entry.teacher?.department_id)
              .filter(Boolean)
          )
        ) as string[];

        const [deptResult, subjectResult] = await Promise.all([
          departmentIds.length > 0
            ? supabase
                .from('departments')
                .select('id, name, color_hex')
                .in('id', departmentIds)
            : Promise.resolve({ data: [] }),
          teacherIds.length > 0
            ? supabase
                .from('teacher_subjects')
                .select('teacher_id, subject:subjects(id, name)')
                .in('teacher_id', teacherIds)
            : Promise.resolve({ data: [] }),
        ]);

        const deptMap = new Map((deptResult.data || []).map((dept) => [dept.id, dept]));
        const subjectMap = new Map<string, Array<{ id: string; name: string }>>();
        (subjectResult.data || []).forEach((row: any) => {
          const subject = row.subject;
          if (!subject) return;
          const list = subjectMap.get(row.teacher_id) || [];
          list.push(subject);
          subjectMap.set(row.teacher_id, list);
        });

        const formatted = cachedLeaderboard.map((entry) => {
          const subjects = (subjectMap.get(entry.teacher_id) || []).sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          const department = entry.teacher?.department_id
            ? deptMap.get(entry.teacher.department_id) || null
            : null;

          return {
            id: entry.teacher_id,
            name: entry.teacher?.name,
            subject: subjects[0]?.name || null,
            department: department?.name || null,
            department_color_hex: department?.color_hex || null,
            image_url: entry.teacher?.image_url,
            rating_count: entry.total_ratings,
            average_rating: entry.average_rating,
            comment_count: entry.total_comments,
            rank_position: entry.rank_position,
          };
        });

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
    let rowsWithColor = safeRows;

    if (safeRows.length > 0) {
      const teacherIds = safeRows.map((row) => row.id);
      const { data: teacherRows } = await supabase
        .from('teachers')
        .select('id, department_id')
        .in('id', teacherIds);

      const departmentIds = Array.from(
        new Set((teacherRows || []).map((row) => row.department_id).filter(Boolean))
      ) as string[];

      const { data: deptRows } =
        departmentIds.length > 0
          ? await supabase
              .from('departments')
              .select('id, color_hex')
              .in('id', departmentIds)
          : { data: [] as Array<{ id: string; color_hex: string }> };

      const deptMap = new Map((deptRows || []).map((dept) => [dept.id, dept]));
      const deptIdByTeacher = new Map(
        (teacherRows || []).map((row) => [row.id, row.department_id])
      );

      rowsWithColor = safeRows.map((row) => {
        const deptId = deptIdByTeacher.get(row.id);
        const colorHex = deptId ? deptMap.get(deptId)?.color_hex || null : null;
        return { ...row, department_color_hex: colorHex };
      });
    }

    const byTop = [...rowsWithColor].sort((a, b) => {
      const aAvg = a.average_rating ?? -1;
      const bAvg = b.average_rating ?? -1;
      if (bAvg !== aAvg) return bAvg - aAvg;
      const aCount = a.rating_count ?? 0;
      const bCount = b.rating_count ?? 0;
      return bCount - aCount;
    });
    const byBottom = [...rowsWithColor].sort((a, b) => {
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
        all: rowsWithColor,
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
