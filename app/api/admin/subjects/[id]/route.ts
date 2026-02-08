import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/subjects/[id]
 *
 * Admin endpoint: delete a subject.
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting subject:', error);
      return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Subject deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/subjects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const subjectUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  department_id: z.string().uuid('Invalid department ID').optional(),
});

/**
 * PATCH /api/admin/subjects/[id]
 *
 * Admin endpoint: update a subject name or department.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = subjectUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    if (!validation.data.name && !validation.data.department_id) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('subjects')
      .update({
        ...(validation.data.name ? { name: validation.data.name.trim() } : {}),
        ...(validation.data.department_id ? { department_id: validation.data.department_id } : {}),
      })
      .eq('id', params.id)
      .select('id, name, department_id, created_at')
      .single();

    if (error) {
      console.error('Error updating subject:', error);
      return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/subjects/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
