import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };

    if (typeof body.status === 'string') payload.status = body.status;
    if (typeof body.admin_notes === 'string') payload.admin_notes = body.admin_notes;

    const supabase: any = createServiceClient();
    const { data, error } = await supabase
      .from('complaints')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating complaint:', error);
      return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/complaints/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
