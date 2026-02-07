import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/departments/sync
 *
 * Sync departments and subjects based on existing teachers.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: teachers, error: teacherError } = await supabase
      .from('teachers')
      .select('department, subject, subjects');

    if (teacherError) {
      console.error('Error fetching teachers for sync:', teacherError);
      return NextResponse.json({ error: 'Failed to read teachers' }, { status: 500 });
    }

    const departmentSet = new Set<string>();
    const subjectsByDepartment = new Map<string, Set<string>>();

    (teachers || []).forEach((teacher) => {
      const department = (teacher.department || '').trim();
      if (!department) return;
      departmentSet.add(department);

      const subjectSet = subjectsByDepartment.get(department) || new Set<string>();
      const subjects: string[] = [];

      if (Array.isArray(teacher.subjects)) {
        subjects.push(...teacher.subjects);
      }
      if (teacher.subject) {
        subjects.push(teacher.subject);
      }

      subjects
        .map((item) => item?.toString().trim())
        .filter(Boolean)
        .forEach((item) => subjectSet.add(item as string));

      subjectsByDepartment.set(department, subjectSet);
    });

    const departments = Array.from(departmentSet).map((name) => ({ name }));

    if (departments.length === 0) {
      return NextResponse.json({
        message: 'No departments found on teachers to sync.',
        data: { departments: 0, subjects: 0 },
      });
    }

    const { error: upsertDeptError } = await supabase
      .from('departments')
      .upsert(departments, { onConflict: 'name' });

    if (upsertDeptError) {
      console.error('Error syncing departments:', upsertDeptError);
      return NextResponse.json({ error: 'Failed to sync departments' }, { status: 500 });
    }

    const { data: deptRows, error: deptFetchError } = await supabase
      .from('departments')
      .select('id, name')
      .in('name', Array.from(departmentSet));

    if (deptFetchError) {
      console.error('Error fetching departments after sync:', deptFetchError);
      return NextResponse.json({ error: 'Failed to finalize sync' }, { status: 500 });
    }

    const deptIdMap = new Map((deptRows || []).map((dept) => [dept.name, dept.id]));

    const subjectRows: Array<{ department_id: string; name: string }> = [];

    subjectsByDepartment.forEach((subjects, deptName) => {
      const departmentId = deptIdMap.get(deptName);
      if (!departmentId) return;
      subjects.forEach((subject) => {
        subjectRows.push({ department_id: departmentId, name: subject });
      });
    });

    if (subjectRows.length > 0) {
      const { error: upsertSubjectError } = await supabase
        .from('subjects')
        .upsert(subjectRows, { onConflict: 'department_id,name' });

      if (upsertSubjectError) {
        console.error('Error syncing subjects:', upsertSubjectError);
        return NextResponse.json({ error: 'Failed to sync subjects' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Sync completed',
      data: { departments: departments.length, subjects: subjectRows.length },
    });
  } catch (error) {
    console.error('Error in POST /api/admin/departments/sync:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
