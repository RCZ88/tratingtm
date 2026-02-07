import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const reactionSchema = z.object({
  comment_id: z.string().uuid(),
  anonymous_id: z.string().min(1).max(255),
  reaction: z.enum(['like', 'dislike']).nullable().optional(),
});

/**
 * POST /api/comments/reactions
 *
 * Set or clear a reaction for a comment.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = reactionSchema.safeParse(body);
    if (!validation.success) {
      const details = validation.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return NextResponse.json({ error: 'Validation failed', details }, { status: 400 });
    }

    const { comment_id, anonymous_id, reaction } = validation.data;
    const supabase = createClient();

    if (!reaction) {
      const { error } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('comment_id', comment_id)
        .eq('anonymous_id', anonymous_id);

      if (error) {
        console.error('Error deleting reaction:', error);
        return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Reaction removed' });
    }

    const { error } = await supabase
      .from('comment_reactions')
      .upsert(
        { comment_id, anonymous_id, reaction },
        { onConflict: 'comment_id,anonymous_id' }
      );

    if (error) {
      console.error('Error upserting reaction:', error);
      return NextResponse.json({ error: 'Failed to update reaction' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Reaction updated' });
  } catch (error) {
    console.error('Error in POST /api/comments/reactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
