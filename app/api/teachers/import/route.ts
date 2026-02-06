import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';
import { teacherSchema } from '@/lib/utils/validation';

const teacherArraySchema = z.array(teacherSchema);

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

    const validation = teacherArraySchema.safeParse(normalized);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatZodErrors(validation.error.errors),
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const teachers = validation.data;
    const chunkSize = 500;

    for (let i = 0; i < teachers.length; i += chunkSize) {
      const chunk = teachers.slice(i, i + chunkSize);
      const { error } = await supabase.from('teachers').insert(chunk);

      if (error) {
        console.error('Error importing teachers:', error);
        return NextResponse.json(
          { error: 'Failed to import teachers' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Teachers imported successfully',
      inserted: teachers.length,
    });
  } catch (error) {
    console.error('Error in POST /api/teachers/import:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
