import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';
import { scanForProfanity } from '@/lib/utils/profanityServer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/comments/purge
 *
 * Admin endpoint: delete all comments containing banned words.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data: bannedWords, error: bannedError } = await supabase
      .from('banned_words')
      .select('word')
      .eq('enabled', true);

    if (bannedError) {
      console.error('Error fetching banned words for purge:', bannedError);
      return NextResponse.json({ error: 'Failed to load banned words' }, { status: 500 });
    }

    const wordList = (bannedWords || [])
      .map((row) => row.word)
      .filter(Boolean);

    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('id, comment_text');

    if (commentsError) {
      console.error('Error fetching comments for purge:', commentsError);
      return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
    }

    const flaggedIds: string[] = [];
    (comments || []).forEach((comment) => {
      const result = scanForProfanity(comment.comment_text || '', wordList);
      if (result.flaggedWords.length > 0) {
        flaggedIds.push(comment.id);
      }
    });

    if (flaggedIds.length === 0) {
      return NextResponse.json({ message: 'No comments matched', deleted: 0 });
    }

    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .in('id', flaggedIds);

    if (deleteError) {
      console.error('Error deleting flagged comments:', deleteError);
      return NextResponse.json({ error: 'Failed to delete comments' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Deleted flagged comments', deleted: flaggedIds.length });
  } catch (error) {
    console.error('Error in POST /api/admin/comments/purge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
