import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  emoji: z.string().min(1).max(16).optional(),
  enabled: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

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
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createServiceClient();
    const payload: Record<string, unknown> = {};
    if (parsed.data.emoji !== undefined) payload.emoji = parsed.data.emoji.trim();
    if (parsed.data.enabled !== undefined) payload.enabled = parsed.data.enabled;
    if (parsed.data.sort_order !== undefined) payload.sort_order = parsed.data.sort_order;

    const { data, error } = await supabase
      .from('comment_reaction_emojis')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating reaction emoji:', error);
      return NextResponse.json({ error: 'Failed to update emoji' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PATCH /api/admin/comment-reaction-emojis/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();
    const { error } = await supabase.from('comment_reaction_emojis').delete().eq('id', id);

    if (error) {
      console.error('Error deleting reaction emoji:', error);
      return NextResponse.json({ error: 'Failed to delete emoji' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/comment-reaction-emojis/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
