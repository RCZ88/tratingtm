import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validate, teacherSchema, paginationSchema } from '@/lib/utils/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

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
    const department = searchParams.get('department') || '';
    const subject = searchParams.get('subject') || '';
    const sortBy = searchParams.get('sort_by') || 'name';
    const sortOrder = searchParams.get('sort_order') || 'asc';
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const session = await getServerSession(authOptions);
    const supabase = includeInactive && session ? createServiceClient() : createClient();

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

    if (department) {
      query = query.ilike('department', `%${department}%`);
    }

    if (subject) {
      query = query.ilike('subject', `%${subject}%`);
    }

    // Apply sorting
    const validSortColumns = ['name', 'created_at', 'subject', 'department'];
    const orderColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: teachers, error, count } = await query;

    if (error) {
      console.error('Error fetching teachers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch teachers' },
        { status: 500 }
      );
    }

    // Fetch stats for each teacher
    const teacherIds = teachers?.map((t) => t.id) || [];
    
    if (teacherIds.length > 0) {
      const { data: stats } = await supabase
        .from('teacher_stats')
        .select('*')
        .in('id', teacherIds);

      const statsMap = new Map(stats?.map((s) => [s.id, s]) || []);

      const teachersWithStats = teachers?.map((teacher) => ({
        ...teacher,
        total_ratings: statsMap.get(teacher.id)?.total_ratings || 0,
        average_rating: statsMap.get(teacher.id)?.overall_rating || 0,
        total_comments: statsMap.get(teacher.id)?.total_comments || 0,
      }));

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
        subject: validation.data.subject,
        department: validation.data.department,
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
