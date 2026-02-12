import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  emoji: z.string().min(1).max(16),
  enabled: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('comment_reaction_emojis')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('emoji', { ascending: true });

    if (error) {
      console.error('Error fetching admin reaction emojis:', error);
      return NextResponse.json({ error: 'Failed to fetch emojis' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/comment-reaction-emojis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { emoji, enabled = true, sort_order = 100 } = parsed.data;

    const { data, error } = await supabase
      .from('comment_reaction_emojis')
      .insert({ emoji: emoji.trim(), enabled, sort_order })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating reaction emoji:', error);
      return NextResponse.json({ error: 'Failed to create emoji' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/comment-reaction-emojis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
