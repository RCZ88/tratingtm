import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const teacherJsonSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(100),
  department_id: z.string().uuid().optional().nullable(),
  subject_ids: z.array(z.string().uuid()).optional().nullable(),
  levels: z.array(z.enum(['SL', 'HL'])).optional().nullable(),
  year_levels: z.array(z.number().int().min(7).max(12)).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  image_url: z.string().url().max(500).optional().nullable(),
  is_active: z.boolean().optional(),
});

const teacherJsonArraySchema = z.array(teacherJsonSchema);

function normalizePayload(body: unknown) {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object' && Array.isArray((body as any).teachers)) {
    return (body as any).teachers;
  }
  return null;
}

/**
 * GET /api/teachers/json
 * 
 * Returns all teachers as JSON for editing.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') !== 'false';

    const supabase = createServiceClient();
    let query = supabase.from('teachers').select('*').order('name', { ascending: true });
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching teachers:', error);
      return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
    }

    const teacherIds = (data || []).map((teacher) => teacher.id);
    let subjectMap = new Map<string, string[]>();
    if (teacherIds.length > 0) {
      const { data: subjectRows } = await supabase
        .from('teacher_subjects')
        .select('teacher_id, subject_id')
        .in('teacher_id', teacherIds);

      subjectMap = new Map<string, string[]>();
      (subjectRows || []).forEach((row) => {
        const list = subjectMap.get(row.teacher_id) || [];
        list.push(row.subject_id);
        subjectMap.set(row.teacher_id, list);
      });
    }

    const enriched = (data || []).map((teacher) => ({
      ...teacher,
      subject_ids: subjectMap.get(teacher.id) || [],
    }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('Error in GET /api/teachers/json:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/teachers/json
 * 
 * Upserts teachers from JSON (by id).
 * Requires admin authentication.
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const payload = normalizePayload(body);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid payload. Send an array or { teachers: [...] }.' },
        { status: 400 }
      );
    }

    const validation = teacherJsonArraySchema.safeParse(payload);
    if (!validation.success) {
      const details = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return NextResponse.json({ error: 'Validation failed', details }, { status: 400 });
    }

    const supabase = createServiceClient();
    const now = new Date().toISOString();

    let updatedCount = 0;
    let insertedCount = 0;

    for (const teacher of validation.data) {
      const { subject_ids, ...teacherData } = teacher;
      let teacherId = teacher.id;

      if (teacherId) {
        const { data: upserted, error } = await supabase
          .from('teachers')
          .upsert({ ...teacherData, id: teacherId, updated_at: now }, { onConflict: 'id' })
          .select('id')
          .single();

        if (error) {
          console.error('Error upserting teacher:', error);
          return NextResponse.json({ error: 'Failed to update teachers' }, { status: 500 });
        }
        teacherId = upserted?.id || teacherId;
        updatedCount += 1;
      } else {
        const { data: inserted, error } = await supabase
          .from('teachers')
          .insert({ ...teacherData, updated_at: now })
          .select('id')
          .single();

        if (error) {
          console.error('Error inserting teacher:', error);
          return NextResponse.json({ error: 'Failed to insert teachers' }, { status: 500 });
        }
        teacherId = inserted?.id;
        insertedCount += 1;
      }

      if (teacherId && subject_ids !== undefined) {
        const { error: deleteError } = await supabase
          .from('teacher_subjects')
          .delete()
          .eq('teacher_id', teacherId);

        if (deleteError) {
          console.error('Error clearing teacher subjects:', deleteError);
          return NextResponse.json({ error: 'Failed to update teachers' }, { status: 500 });
        }

        if (subject_ids && subject_ids.length > 0) {
          const rows = subject_ids.map((subjectId) => ({
            teacher_id: teacherId,
            subject_id: subjectId,
          }));
          const { error: insertError } = await supabase
            .from('teacher_subjects')
            .insert(rows);
          if (insertError) {
            console.error('Error inserting teacher subjects:', insertError);
            return NextResponse.json({ error: 'Failed to update teachers' }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Teachers updated successfully',
      updated: updatedCount,
      inserted: insertedCount,
    });
  } catch (error) {
    console.error('Error in PUT /api/teachers/json:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
