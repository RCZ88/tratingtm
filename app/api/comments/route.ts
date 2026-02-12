import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validate, commentSchema } from '@/lib/utils/validation';
import { scanForProfanity } from '@/lib/utils/profanityServer';
import { aggregateCommentReactions } from '@/lib/utils/commentReactionAggregates';

export const dynamic = 'force-dynamic';

/**
 * GET /api/comments
 *
 * Get comments for a teacher or all pending comments (admin).
 * Query params: teacher_id (optional), status (optional, admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const status = searchParams.get('status');
    const anonymousId = searchParams.get('anonymous_id');

    const supabase = createClient();

    let query = supabase.from('comments').select('*');

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    if (status === 'pending') {
      query = query.eq('is_approved', false).eq('is_flagged', false);
    } else if (status === 'approved') {
      query = query.eq('is_approved', true).eq('is_flagged', false);
    } else {
      query = query.eq('is_approved', true).eq('is_flagged', false);
    }

    const { data: comments, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    const aggregated = await aggregateCommentReactions(supabase, comments || [], { anonymousId });

    return NextResponse.json({
      data: aggregated.comments,
      meta: {
        available_reaction_emojis: aggregated.availableEmojis,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/comments
 *
 * Submit a new comment for a teacher.
 * Comments require moderation before being visible.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validate(commentSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { teacher_id, comment_text, anonymous_id } = validation.data;

    const supabase = createClient();

    const { data: bannedRows, error: bannedError } = await supabase
      .from('banned_words')
      .select('word')
      .eq('enabled', true);
    if (bannedError) {
      console.error('Error loading banned words:', bannedError);
    }
    const bannedWords = (bannedRows || []).map((row) => row.word).filter(Boolean);
    const profanityResult = scanForProfanity(comment_text, bannedWords);

    if (profanityResult.flaggedWords.length > 0) {
      return NextResponse.json(
        { error: 'Inappropriate language detected', flaggedWords: profanityResult.flaggedWords },
        { status: 400 }
      );
    }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, is_active')
      .eq('id', teacher_id)
      .single();

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (!teacher.is_active) {
      return NextResponse.json({ error: 'Cannot comment on inactive teacher' }, { status: 400 });
    }

    let requiresApproval = true;
    const { data: settings } = await supabase
      .from('app_settings')
      .select('comments_require_approval')
      .eq('id', 'global')
      .maybeSingle();

    if (settings && typeof settings.comments_require_approval === 'boolean') {
      requiresApproval = settings.comments_require_approval;
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        teacher_id,
        comment_text,
        anonymous_id,
        is_approved: !requiresApproval,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: comment,
        message: requiresApproval ? 'Comment submitted for moderation' : 'Comment posted',
        requires_approval: requiresApproval,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
