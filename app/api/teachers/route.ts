import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validate, teacherSchema, paginationSchema } from '@/lib/utils/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

const HONORIFIC_PREFIX = /^(mr|ms|mrs|miss)\.?\s+/i;

function normalizeTeacherNameForSort(name?: string | null) {
  if (!name) return '';
  return name.replace(HONORIFIC_PREFIX, '').trim().toLowerCase();
}

/**
 * GET /api/teachers
 * 
 * List all active teachers with optional filtering and pagination.
 * Public endpoint - no authentication required.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination and filter params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const departmentParam = searchParams.get('department') || '';
    const departmentIdParam = searchParams.get('department_id') || '';
    const subjectParam = searchParams.get('subject') || '';
    const subjectIdParam = searchParams.get('subject_id') || '';
    const sortBy = searchParams.get('sort_by') || 'name';
    const sortOrder = searchParams.get('sort_order') || 'asc';
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const session = await getServerSession(authOptions);
    const supabase = includeInactive && session ? createServiceClient() : createClient();

    // Resolve department ID if a name is provided
    let departmentId = departmentIdParam || '';
    if (!departmentId && departmentParam) {
      const { data: deptMatch } = await supabase
        .from('departments')
        .select('id')
        .eq('name', departmentParam)
        .maybeSingle();
      departmentId = deptMatch?.id || '';
      if (!departmentId) {
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
    }

    // Resolve subject ID if a name is provided
    let subjectId = subjectIdParam || '';
    if (!subjectId && subjectParam) {
      let subjectQuery = supabase.from('subjects').select('id').eq('name', subjectParam);
      if (departmentId) {
        subjectQuery = subjectQuery.eq('department_id', departmentId);
      }
      const { data: subjectMatch } = await subjectQuery.limit(1).maybeSingle();
      subjectId = subjectMatch?.id || '';
      if (!subjectId) {
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
    }

    // Build query
    let query = supabase.from('teachers').select('*', { count: 'exact' });

    // Apply filters
    if (!includeInactive) {
      query = query.eq('is_active', true);
    } else if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    if (subjectId) {
      const { data: subjectMatches, error: subjectMatchError } = await supabase
        .from('teacher_subjects')
        .select('teacher_id')
        .eq('subject_id', subjectId);

      if (subjectMatchError) {
        console.error('Error fetching teacher subjects:', subjectMatchError);
        return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
      }

      const teacherIdsForSubject = (subjectMatches || []).map((row) => row.teacher_id);
      if (teacherIdsForSubject.length === 0) {
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }

      query = query.in('id', teacherIdsForSubject);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let teachers: any[] | null = null;
    let count: number | null = null;

    if (sortBy === 'name') {
      const { data: allTeachers, error, count: totalCount } = await query;
      if (error) {
        console.error('Error fetching teachers:', error);
        return NextResponse.json(
          { error: 'Failed to fetch teachers' },
          { status: 500 }
        );
      }

      const sorted = (allTeachers || []).sort((a, b) => {
        const aKey = normalizeTeacherNameForSort(a.name);
        const bKey = normalizeTeacherNameForSort(b.name);
        const cmp = aKey.localeCompare(bKey, 'en', { sensitivity: 'base' });
        if (cmp !== 0) {
          return sortOrder === 'desc' ? -cmp : cmp;
        }
        const fallback = (a.name || '').localeCompare(b.name || '', 'en', { sensitivity: 'base' });
        return sortOrder === 'desc' ? -fallback : fallback;
      });

      teachers = sorted.slice(from, to + 1);
      count = totalCount ?? sorted.length;
    } else {
      // Apply sorting
      const validSortColumns = ['name', 'created_at'];
      const orderColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
      query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(from, to);

      const result = await query;
      teachers = result.data;
      count = result.count ?? null;

      if (result.error) {
        console.error('Error fetching teachers:', result.error);
        return NextResponse.json(
          { error: 'Failed to fetch teachers' },
          { status: 500 }
        );
      }
    }

    // Fetch stats for each teacher
    const teacherIds = teachers?.map((t) => t.id) || [];
    if (teacherIds.length > 0) {
      const departmentIds = Array.from(
        new Set((teachers || []).map((t) => t.department_id).filter(Boolean))
      ) as string[];

      const [statsResult, deptResult, subjectResult] = await Promise.all([
        supabase.from('teacher_stats').select('*').in('id', teacherIds),
        departmentIds.length > 0
          ? supabase
              .from('departments')
              .select('id, name, color_hex')
              .in('id', departmentIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from('teacher_subjects')
          .select('teacher_id, subject:subjects(id, name)')
          .in('teacher_id', teacherIds),
      ]);

      const statsMap = new Map(statsResult.data?.map((s) => [s.id, s]) || []);
      const deptMap = new Map(deptResult.data?.map((d) => [d.id, d]) || []);

      const subjectMap = new Map<
        string,
        Array<{ id: string; name: string }>
      >();
      (subjectResult.data || []).forEach((row: any) => {
        const subject = row.subject;
        if (!subject) return;
        const list = subjectMap.get(row.teacher_id) || [];
        list.push(subject);
        subjectMap.set(row.teacher_id, list);
      });

      const teachersWithStats = teachers?.map((teacher) => {
        const subjects = (subjectMap.get(teacher.id) || []).sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        return {
          ...teacher,
          department: teacher.department_id ? deptMap.get(teacher.department_id) || null : null,
          subjects,
          subject_ids: subjects.map((s) => s.id),
          primary_subject: subjects[0]?.name || null,
          total_ratings: statsMap.get(teacher.id)?.total_ratings || 0,
          average_rating: statsMap.get(teacher.id)?.overall_rating || 0,
          total_comments: statsMap.get(teacher.id)?.total_comments || 0,
        };
      });

      return NextResponse.json({
        data: teachersWithStats,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    return NextResponse.json({
      data: teachers || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error in GET /api/teachers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teachers
 * 
 * Create a new teacher.
 * Requires admin authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validate(teacherSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: teacher, error } = await supabase
      .from('teachers')
      .insert({
        name: validation.data.name,
        department_id: validation.data.department_id,
        levels: validation.data.levels,
        year_levels: validation.data.year_levels,
        bio: validation.data.bio,
        image_url: validation.data.image_url,
        is_active: validation.data.is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating teacher:', error);
      return NextResponse.json(
        { error: 'Failed to create teacher' },
        { status: 500 }
      );
    }

    if (teacher && validation.data.subject_ids && validation.data.subject_ids.length > 0) {
      const subjectRows = validation.data.subject_ids.map((subjectId) => ({
        teacher_id: teacher.id,
        subject_id: subjectId,
      }));

      const { error: subjectError } = await supabase
        .from('teacher_subjects')
        .insert(subjectRows);

      if (subjectError) {
        console.error('Error assigning teacher subjects:', subjectError);
        return NextResponse.json(
          { error: 'Failed to assign teacher subjects' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { data: teacher, message: 'Teacher created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/teachers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
