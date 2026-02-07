import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const departmentSchema = z.object({
  name: z.string().min(2).max(100),
});

/**
 * GET /api/admin/departments
 *
 * Admin endpoint: list departments.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching departments:', error);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error('Error in GET /api/admin/departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/departments
 *
 * Admin endpoint: create a department.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = departmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('departments')
      .insert({ name: validation.data.name.trim() })
      .select()
      .single();

    if (error) {
      console.error('Error creating department:', error);
      return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
