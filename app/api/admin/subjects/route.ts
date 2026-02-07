import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const subjectSchema = z.object({
  name: z.string().min(2).max(100),
  department_id: z.string().uuid(),
});

/**
 * GET /api/admin/subjects
 *
 * Admin endpoint: list subjects with department names.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get('department_id');

    const supabase = createServiceClient();

    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name');

    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }

    let query = supabase
      .from('subjects')
      .select('id, name, department_id, created_at')
      .order('name', { ascending: true });

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    }

    const { data: subjects, error } = await query;

    if (error) {
      console.error('Error fetching subjects:', error);
      return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }

    const departmentMap = new Map((departments || []).map((dept) => [dept.id, dept.name]));
    const enriched = (subjects || []).map((subject) => ({
      ...subject,
      department: departmentMap.get(subject.department_id) || null,
    }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('Error in GET /api/admin/subjects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/subjects
 *
 * Admin endpoint: create a subject.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = subjectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name: validation.data.name.trim(),
        department_id: validation.data.department_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subject:', error);
      return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/subjects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
