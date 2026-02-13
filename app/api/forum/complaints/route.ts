import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { scanForProfanity } from '@/lib/utils/profanityServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const anonymousId = typeof body.anonymous_id === 'string' ? body.anonymous_id.trim() : '';
    const imagePath = typeof body.image_path === 'string' ? body.image_path.trim() : null;

    if (!description || !anonymousId) {
      return NextResponse.json({ error: 'description and anonymous_id are required' }, { status: 400 });
    }

    const supabase: any = createServiceClient();
    const { data: bannedRows } = await supabase
      .from('banned_words')
      .select('word')
      .eq('enabled', true);

    const bannedWords = (bannedRows || []).map((row: any) => row.word).filter(Boolean);
    const profanity = scanForProfanity(`${title}\n${description}`, bannedWords);

    if (profanity.flaggedWords.length > 0) {
      return NextResponse.json({ error: 'Inappropriate language detected', flaggedWords: profanity.flaggedWords }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        title: title || null,
        description,
        anonymous_id: anonymousId,
        image_path: imagePath,
        status: 'new',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating complaint:', error);
      return NextResponse.json({ error: 'Failed to submit complaint' }, { status: 500 });
    }

    return NextResponse.json({ data, message: 'Complaint submitted privately' }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/forum/complaints:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
