import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/banned-words
 *
 * Public endpoint: list enabled banned words.
 */
export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('banned_words')
      .select('word')
      .eq('enabled', true)
      .order('word', { ascending: true });

    if (error) {
      console.error('Error fetching banned words:', error);
      return NextResponse.json({ error: 'Failed to fetch banned words' }, { status: 500 });
    }

    const words = (data || [])
      .map((row) => row.word)
      .filter(Boolean);

    return NextResponse.json({ data: words });
  } catch (error) {
    console.error('Error in GET /api/banned-words:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
