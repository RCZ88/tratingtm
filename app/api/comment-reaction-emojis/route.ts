import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
        const { data, error } = await supabase
      .from('comment_reaction_emojis')
      .select('emoji')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })
      .order('emoji', { ascending: true });

    if (error && error.code === '42703') {
      const fallback = await supabase
        .from('comment_reaction_emojis')
        .select('emoji')
        .order('emoji', { ascending: true });

      if (fallback.error) {
        console.error('Error fetching reaction emojis:', fallback.error);
        return NextResponse.json({ error: 'Failed to fetch reaction emojis' }, { status: 500 });
      }

      return NextResponse.json({ data: (fallback.data || []).map((row) => row.emoji) });
    }

    if (error) {
      console.error('Error fetching reaction emojis:', error);
      return NextResponse.json({ error: 'Failed to fetch reaction emojis' }, { status: 500 });
    }

    return NextResponse.json({ data: (data || []).map((row) => row.emoji) });
  } catch (error) {
    console.error('Error in GET /api/comment-reaction-emojis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

