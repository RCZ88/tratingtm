import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/subjects
 *
 * Public endpoint: list subjects.
 * Optional query params:
 * - department (name)
 * - department_id
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentName = searchParams.get('department');
    const departmentIdParam = searchParams.get('department_id');

    const supabase = createClient();

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name');

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }

    const departmentMap = new Map((departments || []).map((dept) => [dept.id, dept.name]));

    let departmentId = departmentIdParam || undefined;
    if (!departmentId && departmentName) {
      const match = (departments || []).find((dept) => dept.name === departmentName);
      departmentId = match?.id;
    }

    if (departmentName && !departmentId) {
      return NextResponse.json({ data: [] });
    }

    let query = supabase
      .from('subjects')
      .select('id, name, department_id')
      .order('name', { ascending: true });

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data: subjects, error } = await query;

    if (error) {
      console.error('Error fetching subjects:', error);
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }

    const enriched = (subjects || []).map((subject) => ({
      ...subject,
      department: departmentMap.get(subject.department_id) || null,
    }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('Error in GET /api/subjects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
