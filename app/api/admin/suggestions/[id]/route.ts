import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { validatePartial } from '@/lib/utils/validation';
import { z } from 'zod';
import { splitSubjectList, normalizeSubjectName } from '@/lib/utils/subjectParsing';

const adminSuggestionUpdateSchema = z.object({
  status: z.enum(['new', 'working', 'approved', 'declined']).optional(),
  title: z.string().max(255).optional().nullable(),
  description: z.string().max(2000).optional(),
  teacher_name: z.string().max(255).optional().nullable(),
  department: z.string().max(255).optional().nullable(),
  subject: z.string().max(255).optional().nullable(),
  level: z.string().max(10).optional().nullable(),
  year_level: z.string().max(50).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validatePartial(adminSuggestionUpdateSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const { data: updated, error } = await supabase
      .from('suggestions')
      .update(validation.data)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating suggestion:', error);
      return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
    }

    // If approved, sync department/subject into lookup tables
    if (
      updated?.status === 'approved' &&
      (updated.type === 'teacher_add' || updated.type === 'teacher_modify')
    ) {
      const departmentName = updated.department?.trim();
      const subjectName = updated.subject?.trim();

      if (departmentName) {
        const { data: deptRow, error: deptError } = await supabase
          .from('departments')
          .upsert({ name: departmentName }, { onConflict: 'name' })
          .select('id, name')
          .single();

        if (deptError) {
          console.error('Error syncing department from suggestion:', deptError);
        } else if (subjectName) {
          const subjectNames = splitSubjectList(subjectName).map(normalizeSubjectName);
          for (const name of subjectNames) {
            if (!name) continue;
            const { error: subjectError } = await supabase
              .from('subjects')
              .upsert(
                {
                  department_id: deptRow.id,
                  name,
                },
                { onConflict: 'department_id,name' }
              );

            if (subjectError) {
              console.error('Error syncing subject from suggestion:', subjectError);
            }
          }
        }
      }
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error in PATCH /api/admin/suggestions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
