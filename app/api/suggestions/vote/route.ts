import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validate, suggestionVoteSchema } from '@/lib/utils/validation';

export const dynamic = 'force-dynamic';

/**
 * POST /api/suggestions/vote
 * Upsert or clear a vote by anonymous_id.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validate(suggestionVoteSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { suggestion_id, anonymous_id, vote } = validation.data;
    const supabase = createClient();

    const { data: existing } = await supabase
      .from('suggestion_votes')
      .select('id, vote')
      .eq('suggestion_id', suggestion_id)
      .eq('anonymous_id', anonymous_id)
      .maybeSingle();

    if (!vote) {
      if (existing?.id) {
        await supabase
          .from('suggestion_votes')
          .delete()
          .eq('id', existing.id);
      }
      return NextResponse.json({ message: 'Vote cleared' });
    }

    if (existing?.id) {
      if (existing.vote === vote) {
        await supabase
          .from('suggestion_votes')
          .delete()
          .eq('id', existing.id);
        return NextResponse.json({ message: 'Vote cleared' });
      }

      const { error: updateError } = await supabase
        .from('suggestion_votes')
        .update({ vote })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error updating vote:', updateError);
        return NextResponse.json({ error: 'Failed to update vote' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Vote updated' });
    }

    const { error: insertError } = await supabase
      .from('suggestion_votes')
      .insert({ suggestion_id, anonymous_id, vote });

    if (insertError) {
      console.error('Error creating vote:', insertError);
      return NextResponse.json({ error: 'Failed to submit vote' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Vote submitted' }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/suggestions/vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
