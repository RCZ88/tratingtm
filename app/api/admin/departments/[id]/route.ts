import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/departments/[id]
 *
 * Admin endpoint: delete a department.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting department:', error);
      return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Department deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/departments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const departmentUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  color_hex: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, 'Invalid hex color')
    .optional(),
});

/**
 * PATCH /api/admin/departments/[id]
 *
 * Admin endpoint: update a department name or color.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = departmentUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    if (!validation.data.name && !validation.data.color_hex) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('departments')
      .update({
        ...(validation.data.name ? { name: validation.data.name.trim() } : {}),
        ...(validation.data.color_hex ? { color_hex: validation.data.color_hex } : {}),
      })
      .eq('id', id)
      .select('id, name, color_hex, created_at')
      .single();

    if (error) {
      console.error('Error updating department:', error);
      return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/departments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
