import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const bannedWordSchema = z.object({
  word: z.string().min(2).max(100),
  enabled: z.boolean().optional(),
});

/**
 * GET /api/admin/banned-words
 *
 * Admin endpoint: list banned words.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('banned_words')
      .select('id, word, enabled, created_at')
      .order('word', { ascending: true });

    if (error) {
      console.error('Error fetching banned words:', error);
      return NextResponse.json({ error: 'Failed to fetch banned words' }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error('Error in GET /api/admin/banned-words:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/banned-words
 *
 * Admin endpoint: add banned word.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = bannedWordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('banned_words')
      .insert({
        word: validation.data.word.trim().toLowerCase(),
        enabled: validation.data.enabled ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating banned word:', error);
      return NextResponse.json({ error: 'Failed to create banned word' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/banned-words:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
