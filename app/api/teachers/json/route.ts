import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const teacherJsonSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(100),
  subject: z.string().max(100).optional().nullable(),
  subjects: z.array(z.string().max(100)).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
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

    return NextResponse.json({ data: data || [] });
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
    const teachers = validation.data.map((t) => ({ ...t, updated_at: now }));

    const withId = teachers.filter((t) => t.id);
    const withoutId = teachers.filter((t) => !t.id);

    const chunkSize = 500;

    for (let i = 0; i < withId.length; i += chunkSize) {
      const chunk = withId.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('teachers')
        .upsert(chunk, { onConflict: 'id' });
      if (error) {
        console.error('Error upserting teachers:', error);
        return NextResponse.json({ error: 'Failed to update teachers' }, { status: 500 });
      }
    }

    for (let i = 0; i < withoutId.length; i += chunkSize) {
      const chunk = withoutId.slice(i, i + chunkSize);
      const { error } = await supabase.from('teachers').insert(chunk);
      if (error) {
        console.error('Error inserting teachers:', error);
        return NextResponse.json({ error: 'Failed to insert teachers' }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: 'Teachers updated successfully',
      updated: withId.length,
      inserted: withoutId.length,
    });
  } catch (error) {
    console.error('Error in PUT /api/teachers/json:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
