import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { normalizeReaction } from '@/lib/utils/commentReactions';

export const dynamic = 'force-dynamic';

const reactionSchema = z.object({
  comment_id: z.string().uuid(),
  anonymous_id: z.string().min(1).max(255),
  reaction: z.string().min(1).max(32).optional(),
  emoji: z.string().min(1).max(32).optional(),
});

/**
 * POST /api/comments/reactions
 *
 * Toggle a specific emoji reaction for a comment.
 * If the same user clicks the same emoji again, that emoji reaction is removed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = reactionSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return NextResponse.json({ error: 'Validation failed', details }, { status: 400 });
    }

    const { comment_id, anonymous_id } = validation.data;
    const rawReaction = validation.data.emoji || validation.data.reaction || '';
    const reaction = normalizeReaction(rawReaction);
    if (!reaction) {
      return NextResponse.json({ error: 'Reaction emoji is required' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: allowedRows, error: allowedError } = await supabase
      .from('comment_reaction_emojis')
      .select('emoji')
      .eq('enabled', true);

    if (allowedError) {
      console.error('Error loading enabled reaction emojis:', allowedError);
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
    }

    const allowed = new Set((allowedRows || []).map((row) => row.emoji));
    if (!allowed.has(reaction) && reaction !== '??') {
      return NextResponse.json({ error: 'Reaction emoji is not enabled' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('comment_reactions')
      .select('id')
      .eq('comment_id', comment_id)
      .eq('anonymous_id', anonymous_id)
      .eq('reaction', reaction)
      .maybeSingle();

    if (existingError) {
      console.error('Error checking existing reaction:', existingError);
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
    }

    if (existing?.id) {
      const { error: deleteError } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        console.error('Error deleting reaction:', deleteError);
        return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Reaction removed', active: false, reaction });
    }

    const { error } = await supabase
      .from('comment_reactions')
      .insert({ comment_id, anonymous_id, reaction });

    if (error) {
      console.error('Error creating reaction:', error);
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reaction updated', active: true, reaction });
  } catch (error) {
    console.error('Error in POST /api/comments/reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
