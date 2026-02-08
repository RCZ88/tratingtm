import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';
import { teacherSchema, validate } from '@/lib/utils/validation';
import { splitSubjectList, normalizeSubjectName } from '@/lib/utils/subjectParsing';

const rawTeacherSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(100),
  department_id: z.string().uuid().optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  subject_ids: z.array(z.string().uuid()).optional().nullable(),
  subjects: z.array(z.string().max(100)).optional().nullable(),
  subject: z.string().max(100).optional().nullable(),
  levels: z.array(z.enum(['SL', 'HL'])).optional().nullable(),
  year_levels: z.array(z.number().int().min(7).max(12)).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  image_url: z.string().url().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

const rawTeacherArraySchema = z.array(rawTeacherSchema);

function formatZodErrors(errors: z.ZodIssue[]) {
  return errors.map((err) => {
    const path = err.path.length > 0 ? err.path.join('.') : 'root';
    return `${path}: ${err.message}`;
  });
}

/**
 * POST /api/teachers/import
 *
 * Bulk import teachers from JSON.
 * Accepts either:
 * - An array of teacher objects
 * - { teachers: [...] }
 * Also accepts an array of strings (treated as teacher names).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const rawList = Array.isArray(body) ? body : body?.teachers;

    if (!Array.isArray(rawList)) {
      return NextResponse.json(
        { error: 'Invalid payload. Send an array or { teachers: [...] }.' },
        { status: 400 }
      );
    }

    const normalized = rawList.map((item) => {
      if (typeof item === 'string') {
        return { name: item };
      }
      return item;
    });

    const supabase = createServiceClient();
    const rawValidation = rawTeacherArraySchema.safeParse(normalized);
    if (!rawValidation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodErrors(rawValidation.error.errors),
        },
        { status: 400 }
      );
    }

    const departmentCache = new Map<string, string>();
    const subjectCache = new Map<string, string>();

    let inserted = 0;

    for (const raw of rawValidation.data) {
      let departmentId = raw.department_id || null;
      const departmentName = raw.department?.trim();

      if (!departmentId && departmentName) {
        const cached = departmentCache.get(departmentName.toLowerCase());
        if (cached) {
          departmentId = cached;
        } else {
          const { data: deptRow, error: deptError } = await supabase
            .from('departments')
            .upsert({ name: departmentName }, { onConflict: 'name' })
            .select('id')
            .single();

          if (deptError) {
            console.error('Error creating department during import:', deptError);
            return NextResponse.json({ error: 'Failed to import teachers' }, { status: 500 });
          }
          departmentId = deptRow.id;
          departmentCache.set(departmentName.toLowerCase(), deptRow.id);
        }
      }

      let subjectIds = raw.subject_ids || null;
      if (!subjectIds) {
        const subjectNames: string[] = [];
        if (Array.isArray(raw.subjects)) {
          raw.subjects.forEach((entry) => {
            if (!entry) return;
            splitSubjectList(entry).forEach((subject) =>
              subjectNames.push(normalizeSubjectName(subject))
            );
          });
        }
        if (raw.subject) {
          splitSubjectList(raw.subject).forEach((subject) =>
            subjectNames.push(normalizeSubjectName(subject))
          );
        }

        if (subjectNames.length > 0 && departmentId) {
          const ids: string[] = [];
          for (const subjectName of subjectNames) {
            const cacheKey = `${departmentId}:${subjectName.toLowerCase()}`;
            const cached = subjectCache.get(cacheKey);
            if (cached) {
              ids.push(cached);
              continue;
            }
            const { data: subjectRow, error: subjectError } = await supabase
              .from('subjects')
              .upsert(
                { department_id: departmentId, name: subjectName },
                { onConflict: 'department_id,name' }
              )
              .select('id')
              .single();
            if (subjectError) {
              console.error('Error creating subject during import:', subjectError);
              return NextResponse.json({ error: 'Failed to import teachers' }, { status: 500 });
            }
            subjectCache.set(cacheKey, subjectRow.id);
            ids.push(subjectRow.id);
          }
          subjectIds = Array.from(new Set(ids));
        }
      }

      const teacherInput = {
        name: raw.name,
        department_id: departmentId,
        subject_ids: subjectIds,
        levels: raw.levels ?? null,
        year_levels: raw.year_levels ?? null,
        bio: raw.bio ?? null,
        image_url: raw.image_url ?? null,
        is_active: raw.is_active ?? true,
      };

      const validation = validate(teacherSchema, teacherInput);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.errors,
          },
          { status: 400 }
        );
      }

      const { data: teacherRow, error: insertError } = await supabase
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
        .select('id')
        .single();

      if (insertError) {
        console.error('Error importing teacher:', insertError);
        return NextResponse.json(
          { error: 'Failed to import teachers' },
          { status: 500 }
        );
      }

      if (teacherRow?.id && validation.data.subject_ids && validation.data.subject_ids.length > 0) {
        const subjectRows = validation.data.subject_ids.map((subjectId) => ({
          teacher_id: teacherRow.id,
          subject_id: subjectId,
        }));
        const { error: subjectInsertError } = await supabase
          .from('teacher_subjects')
          .insert(subjectRows);
        if (subjectInsertError) {
          console.error('Error importing teacher subjects:', subjectInsertError);
          return NextResponse.json(
            { error: 'Failed to import teachers' },
            { status: 500 }
          );
        }
      }

      inserted += 1;
    }

    return NextResponse.json({
      message: 'Teachers imported successfully',
      inserted,
    });
  } catch (error) {
    console.error('Error in POST /api/teachers/import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
