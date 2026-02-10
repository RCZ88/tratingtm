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
 * - teacher_id (single)
 * - teacher_ids (comma-separated)
 * - department_id (single)
 * - department_ids (comma-separated)
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
    const teacherIdsParam = searchParams.get('teacher_ids');
    const departmentId = searchParams.get('department_id');
    const departmentIdsParam = searchParams.get('department_ids');
    const query = searchParams.get('q');

    const supabase = createServiceClient();

    let dbQuery = supabase
      .from('comments')
      .select('*, teacher:teachers(id, name, image_url, department_id)')
      .order('created_at', { ascending: false });

    let requestedTeacherIds = new Set<string>();
    if (teacherId) {
      requestedTeacherIds.add(teacherId);
    }
    if (teacherIdsParam) {
      teacherIdsParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => requestedTeacherIds.add(value));
    }

    let departmentIds = new Set<string>();
    if (departmentId) {
      departmentIds.add(departmentId);
    }
    if (departmentIdsParam) {
      departmentIdsParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => departmentIds.add(value));
    }

    if (departmentIds.size > 0) {
      const { data: teacherRows, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .in('department_id', Array.from(departmentIds));

      if (teacherError) {
        console.error('Error fetching teachers by department:', teacherError);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
      }

      const deptTeacherIds = new Set((teacherRows || []).map((row) => row.id));
      if (requestedTeacherIds.size > 0) {
        requestedTeacherIds = new Set(
          Array.from(requestedTeacherIds).filter((id) => deptTeacherIds.has(id))
        );
      } else {
        requestedTeacherIds = deptTeacherIds;
      }
    }

    if (requestedTeacherIds.size > 0) {
      dbQuery = dbQuery.in('teacher_id', Array.from(requestedTeacherIds));
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
