import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/updates/[id]
 * Admin: update an existing update
 */
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

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.title === 'string') payload.title = body.title;
    if (typeof body.body === 'string') payload.body = body.body;
    if (typeof body.type === 'string') payload.type = body.type;
    if (typeof body.teacher_id !== 'undefined') payload.teacher_id = body.teacher_id;
    if (typeof body.link_url !== 'undefined') payload.link_url = body.link_url;
    if (typeof body.expires_at !== 'undefined') payload.expires_at = body.expires_at;
    if (typeof body.is_active === 'boolean') payload.is_active = body.is_active;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('public_updates')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating update:', error);
      return NextResponse.json({ error: 'Failed to update update' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/updates/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/updates/[id]
 * Admin: delete an update
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('public_updates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting update:', error);
      return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Update deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/updates/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
