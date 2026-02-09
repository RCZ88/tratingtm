import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentWeekStart, getCurrentWeekEnd, getWeekRange, toISODate } from '@/lib/utils/dateHelpers';
import { parseISO } from 'date-fns';

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
    const periodParam = searchParams.get('period') || 'weekly';
    const period = periodParam === 'weekly' ? 'weekly_unique' : periodParam;
    const limit = parseInt(searchParams.get('limit') || '10');

    const supabase = createClient();
    let weekStart: Date;
    let weekEnd: Date;

    if (period === 'all_time') {
      const { data: statsRows, error: statsError } = await supabase
        .from('teacher_stats')
        .select('id, name, total_ratings, overall_rating, total_comments')
        .gt('total_ratings', 0);

      if (statsError) {
        console.error('Error fetching all-time leaderboard:', statsError);
        return NextResponse.json(
          { error: 'Failed to fetch leaderboard' },
          { status: 500 }
        );
      }

      const teacherIds = (statsRows || []).map((row) => row.id);
      const currentWeekStart = toISODate(getCurrentWeekStart());
      const { data: teacherRows } =
        teacherIds.length > 0
          ? await supabase
              .from('teachers')
              .select('id, department_id, image_url, is_active')
              .in('id', teacherIds)
          : { data: [] as Array<{ id: string; department_id: string | null; image_url: string | null; is_active: boolean }> };

      const activeTeacherIds = new Set(
        (teacherRows || []).filter((row) => row.is_active).map((row) => row.id)
      );

      const activeStats = (statsRows || []).filter((row) => activeTeacherIds.has(row.id));

      const departmentIds = Array.from(
        new Set((teacherRows || []).map((row) => row.department_id).filter(Boolean))
      ) as string[];

      const [deptResult, subjectResult, weeklyResult] = await Promise.all([
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
        teacherIds.length > 0
          ? supabase
              .from('weekly_ratings')
              .select('teacher_id, stars')
              .in('teacher_id', teacherIds)
              .eq('week_start', currentWeekStart)
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

      const teacherMap = new Map(
        (teacherRows || []).map((row) => [row.id, row])
      );

      const weeklyMap = new Map<string, { count: number; sum: number }>();
      (weeklyResult.data || []).forEach((row: any) => {
        const entry = weeklyMap.get(row.teacher_id) || { count: 0, sum: 0 };
        entry.count += 1;
        entry.sum += row.stars;
        weeklyMap.set(row.teacher_id, entry);
      });

      const formatted = activeStats.map((row) => {
        const teacher = teacherMap.get(row.id);
        const subjects = (subjectMap.get(row.id) || []).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        const department = teacher?.department_id
          ? deptMap.get(teacher.department_id) || null
          : null;
        const weekly = weeklyMap.get(row.id) || { count: 0, sum: 0 };
        const weeklyAverage =
          weekly.count >= 3 ? Number((weekly.sum / weekly.count).toFixed(2)) : null;

        return {
          id: row.id,
          name: row.name,
          subject: subjects[0]?.name || null,
          department: department?.name || null,
          department_color_hex: department?.color_hex || null,
          image_url: teacher?.image_url || null,
          rating_count: row.total_ratings || 0,
          average_rating: row.overall_rating,
          comment_count: row.total_comments || 0,
          weekly_rating_count: weekly.count,
          weekly_average_rating: weeklyAverage,
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
          period: 'all_time',
          week_start: null,
          week_end: null,
          top: byTop.slice(0, limit),
          bottom: byBottom.slice(0, limit),
          all: formatted,
        },
      });
    }

    if (period === 'weekly_unique') {
      const range = weekStartParam
        ? getWeekRange(parseISO(weekStartParam))
        : { start: getCurrentWeekStart(), end: getCurrentWeekEnd() };
      weekStart = range.start;
      weekEnd = range.end;

      const weekStartIso = toISODate(weekStart);
      const weekEndExclusive = new Date(weekEnd);
      weekEndExclusive.setDate(weekEndExclusive.getDate() + 1);
      const weekEndIso = weekEndExclusive.toISOString();

      const [weeklyResult, commentResult] = await Promise.all([
        supabase
          .from('weekly_ratings')
          .select('teacher_id, stars')
          .eq('week_start', weekStartIso),
        supabase
          .from('comments')
          .select('teacher_id')
          .eq('is_approved', true)
          .gte('created_at', weekStartIso)
          .lt('created_at', weekEndIso),
      ]);

      if (weeklyResult.error || commentResult.error) {
        console.error(
          'Error fetching weekly leaderboard:',
          weeklyResult.error || commentResult.error
        );
        return NextResponse.json(
          { error: 'Failed to fetch leaderboard' },
          { status: 500 }
        );
      }

      const weeklyMap = new Map<string, { count: number; sum: number }>();
      (weeklyResult.data || []).forEach((row: any) => {
        const entry = weeklyMap.get(row.teacher_id) || { count: 0, sum: 0 };
        entry.count += 1;
        entry.sum += row.stars;
        weeklyMap.set(row.teacher_id, entry);
      });

      const commentMap = new Map<string, number>();
      (commentResult.data || []).forEach((row: any) => {
        commentMap.set(row.teacher_id, (commentMap.get(row.teacher_id) || 0) + 1);
      });

      const teacherIds = Array.from(weeklyMap.keys());
      if (teacherIds.length === 0) {
        return NextResponse.json({
          data: {
            period: 'weekly_unique',
            week_start: toISODate(weekStart),
            week_end: toISODate(weekEnd),
            top: [],
            bottom: [],
            all: [],
          },
        });
      }

      const { data: teacherRows } = await supabase
        .from('teachers')
        .select('id, name, department_id, image_url, is_active')
        .in('id', teacherIds);

      const activeTeachers = (teacherRows || []).filter((row) => row.is_active);
      const activeTeacherIds = activeTeachers.map((row) => row.id);

      const departmentIds = Array.from(
        new Set(activeTeachers.map((row) => row.department_id).filter(Boolean))
      ) as string[];


      const [deptResult, subjectResult, statsResult] = await Promise.all([
        supabase
          .from('departments')
          .select('id, name, color_hex')
          .in('id', departmentIds),
        supabase
          .from('teacher_subjects')
          .select('teacher_id, subject:subjects(id, name)')
          .in('teacher_id', activeTeacherIds),
        supabase
          .from('teacher_stats')
          .select('id, total_ratings, overall_rating, total_comments')
          .in('id', activeTeacherIds),
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

      const statsMap = new Map(
        (statsResult.data || []).map((row: any) => [row.id, row])
      );

      const formatted = activeTeachers.map((teacher) => {
        const weekly = weeklyMap.get(teacher.id) || { count: 0, sum: 0 };
        const weeklyAverage =
          weekly.count >= 3 ? Number((weekly.sum / weekly.count).toFixed(2)) : null;
        const subjects = (subjectMap.get(teacher.id) || []).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        const department = teacher.department_id
          ? deptMap.get(teacher.department_id) || null
          : null;
        const stats = statsMap.get(teacher.id);

        return {
          id: teacher.id,
          name: teacher.name,
          subject: subjects[0]?.name || null,
          department: department?.name || null,
          department_color_hex: department?.color_hex || null,
          image_url: teacher.image_url,
          rating_count: stats?.total_ratings || 0,
          average_rating: stats?.overall_rating || null,
          comment_count: stats?.total_comments || 0,
          weekly_rating_count: weekly.count,
          weekly_average_rating: weeklyAverage,
        };
      });

      const eligible = formatted.filter((row) => (row.weekly_rating_count || 0) >= 3);

      const byTop = [...eligible].sort((a, b) => {
        const aAvg = a.weekly_average_rating ?? -1;
        const bAvg = b.weekly_average_rating ?? -1;
        if (bAvg !== aAvg) return bAvg - aAvg;
        const aCount = a.weekly_rating_count ?? 0;
        const bCount = b.weekly_rating_count ?? 0;
        return bCount - aCount;
      });

      const byBottom = [...eligible].sort((a, b) => {
        const aAvg = a.weekly_average_rating ?? -1;
        const bAvg = b.weekly_average_rating ?? -1;
        if (aAvg !== bAvg) return aAvg - bAvg;
        const aCount = a.weekly_rating_count ?? 0;
        const bCount = b.weekly_rating_count ?? 0;
        return bCount - aCount;
      });

      return NextResponse.json({
        data: {
          period: 'weekly_unique',
          week_start: toISODate(weekStart),
          week_end: toISODate(weekEnd),
          top: byTop.slice(0, limit),
          bottom: byBottom.slice(0, limit),
          all: formatted,
        },
      });
    }

    if (weekStartParam) {
      const parsed = parseISO(weekStartParam);
      const range = getWeekRange(parsed);
      weekStart = range.start;
      weekEnd = range.end;
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
            period: 'weekly',
            week_start: toISODate(weekStart),
            week_end: toISODate(weekEnd),
            top: byTop.slice(0, limit),
            bottom: byBottom.slice(0, limit),
            all: formatted,
          },
        });
      }

      // If no cache exists for the requested week, compute from raw data
      const weekStartIso = weekStart.toISOString();
      const weekEndExclusive = new Date(weekEnd);
      weekEndExclusive.setDate(weekEndExclusive.getDate() + 1);
      const weekEndIso = weekEndExclusive.toISOString();

      const [ratingResult, commentResult] = await Promise.all([
        supabase
          .from('ratings')
          .select('teacher_id, stars')
          .gte('created_at', weekStartIso)
          .lt('created_at', weekEndIso),
        supabase
          .from('comments')
          .select('teacher_id')
          .eq('is_approved', true)
          .gte('created_at', weekStartIso)
          .lt('created_at', weekEndIso),
      ]);

      if (ratingResult.error || commentResult.error) {
        console.error('Error computing historical leaderboard:', ratingResult.error || commentResult.error);
        return NextResponse.json(
          { error: 'Failed to fetch leaderboard' },
          { status: 500 }
        );
      }

      const ratingMap = new Map<string, { count: number; sum: number }>();
      (ratingResult.data || []).forEach((row) => {
        const entry = ratingMap.get(row.teacher_id) || { count: 0, sum: 0 };
        entry.count += 1;
        entry.sum += row.stars;
        ratingMap.set(row.teacher_id, entry);
      });

      const commentMap = new Map<string, number>();
      (commentResult.data || []).forEach((row) => {
        commentMap.set(row.teacher_id, (commentMap.get(row.teacher_id) || 0) + 1);
      });

      const teacherIds = Array.from(ratingMap.keys());
      if (teacherIds.length === 0) {
        return NextResponse.json({
          data: {
            period: 'weekly',
            week_start: toISODate(weekStart),
            week_end: toISODate(weekEnd),
            top: [],
            bottom: [],
            all: [],
          },
        });
      }

      const { data: teacherRows } = await supabase
        .from('teachers')
        .select('id, name, department_id, image_url, is_active')
        .in('id', teacherIds);

      const activeTeachers = (teacherRows || []).filter((row) => row.is_active);
      const activeTeacherIds = activeTeachers.map((row) => row.id);

      const departmentIds = Array.from(
        new Set(activeTeachers.map((row) => row.department_id).filter(Boolean))
      ) as string[];

      const [deptResult, subjectResult] = await Promise.all([
        departmentIds.length > 0
          ? supabase
              .from('departments')
              .select('id, name, color_hex')
              .in('id', departmentIds)
          : Promise.resolve({ data: [] }),
        activeTeacherIds.length > 0
          ? supabase
              .from('teacher_subjects')
              .select('teacher_id, subject:subjects(id, name)')
              .in('teacher_id', activeTeacherIds)
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

      const formatted = activeTeachers.map((teacher) => {
        const rating = ratingMap.get(teacher.id) || { count: 0, sum: 0 };
        const avg = rating.count > 0 ? Number((rating.sum / rating.count).toFixed(2)) : null;
        const subjects = (subjectMap.get(teacher.id) || []).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        const department = teacher.department_id
          ? deptMap.get(teacher.department_id) || null
          : null;

        return {
          id: teacher.id,
          name: teacher.name,
          subject: subjects[0]?.name || null,
          department: department?.name || null,
          department_color_hex: department?.color_hex || null,
          image_url: teacher.image_url,
          rating_count: rating.count,
          average_rating: avg,
          comment_count: commentMap.get(teacher.id) || 0,
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
          period: 'weekly',
          week_start: toISODate(weekStart),
          week_end: toISODate(weekEnd),
          top: byTop.slice(0, limit),
          bottom: byBottom.slice(0, limit),
          all: formatted,
        },
      });
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
        period: 'weekly',
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


