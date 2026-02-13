import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { normalizeReaction, THUMBS_DOWN, THUMBS_UP } from '@/lib/utils/commentReactions';

export const dynamic = 'force-dynamic';

const schema = z.object({
  target_type: z.enum(['post', 'reply']),
  target_id: z.string().uuid(),
  anonymous_id: z.string().min(1).max(255),
  emoji: z.string().min(1).max(32),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const { target_type, target_id, anonymous_id } = parsed.data;
    const emoji = normalizeReaction(parsed.data.emoji);

    if (!emoji) {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    const supabase: any = createClient();
    const { data: allowedRows } = await supabase
      .from('comment_reaction_emojis')
      .select('emoji')
      .eq('enabled', true);

    const allowed = new Set((allowedRows || []).map((row: any) => row.emoji));
    if (!allowed.has(emoji) && emoji !== THUMBS_UP && emoji !== THUMBS_DOWN) {
      return NextResponse.json({ error: 'Reaction emoji is not enabled' }, { status: 400 });
    }

    const isPost = target_type === 'post';
    const table = isPost ? 'forum_post_reactions' : 'forum_reply_reactions';
    const targetColumn = isPost ? 'post_id' : 'reply_id';

    const { data: existing } = await supabase
      .from(table)
      .select('id')
      .eq(targetColumn, target_id)
      .eq('anonymous_id', anonymous_id)
      .eq('reaction', emoji)
      .maybeSingle();

    if (existing?.id) {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('Error removing forum reaction:', deleteError);
        return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Reaction removed', active: false, emoji });
    }

    const { error: insertError } = await supabase
      .from(table)
      .insert({
        [targetColumn]: target_id,
        anonymous_id,
        reaction: emoji,
      });

    if (insertError) {
      console.error('Error adding forum reaction:', insertError);
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reaction updated', active: true, emoji });
  } catch (error) {
    console.error('Error in POST /api/forum/reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
