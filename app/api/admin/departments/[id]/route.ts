import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/admin/departments/[id]
 *
 * Admin endpoint: delete a department.
 */
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', params.id);

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
