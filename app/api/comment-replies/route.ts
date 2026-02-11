import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validate, replySchema } from '@/lib/utils/validation';
import { scanForProfanity } from '@/lib/utils/profanityServer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/comment-replies
 * Public endpoint for approved replies.
 * Query params:
 * - comment_id: single comment id
 * - comment_ids: comma-separated comment ids
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('comment_id');
    const commentIdsParam = searchParams.get('comment_ids');

    const commentIds = new Set<string>();
    if (commentId) commentIds.add(commentId);
    if (commentIdsParam) {
      commentIdsParam
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => commentIds.add(value));
    }

    if (commentIds.size === 0) {
      return NextResponse.json({ data: [] });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('comment_replies')
      .select('id, comment_id, parent_reply_id, reply_text, anonymous_id, created_at, is_approved, is_flagged')
      .in('comment_id', Array.from(commentIds))
      .eq('is_approved', true)
      .eq('is_flagged', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching replies:', error);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/comment-replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/comment-replies
 * Create a new reply to a comment or to another reply.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validate(replySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { comment_id, parent_reply_id, reply_text, anonymous_id } = validation.data;
    const supabase = createClient();

    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, teacher_id')
      .eq('id', comment_id)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (parent_reply_id) {
      const { data: parentReply, error: parentError } = await supabase
        .from('comment_replies')
        .select('id, comment_id')
        .eq('id', parent_reply_id)
        .single();

      if (parentError || !parentReply || parentReply.comment_id !== comment_id) {
        return NextResponse.json({ error: 'Invalid parent reply' }, { status: 400 });
      }
    }

    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, is_active')
      .eq('id', comment.teacher_id)
      .single();

    if (!teacher || !teacher.is_active) {
      return NextResponse.json({ error: 'Cannot reply on inactive teacher comments' }, { status: 400 });
    }

    const { data: bannedRows, error: bannedError } = await supabase
      .from('banned_words')
      .select('word')
      .eq('enabled', true);
    if (bannedError) {
      console.error('Error loading banned words:', bannedError);
    }

    const bannedWords = (bannedRows || []).map((row) => row.word).filter(Boolean);
    const profanityResult = scanForProfanity(reply_text, bannedWords);
    if (profanityResult.flaggedWords.length > 0) {
      return NextResponse.json(
        { error: 'Inappropriate language detected', flaggedWords: profanityResult.flaggedWords },
        { status: 400 }
      );
    }

    let requiresApproval = true;
    const { data: settings } = await supabase
      .from('app_settings')
      .select('replies_require_approval')
      .eq('id', 'global')
      .maybeSingle();

    if (settings && typeof settings.replies_require_approval === 'boolean') {
      requiresApproval = settings.replies_require_approval;
    }

    const { data: reply, error } = await supabase
      .from('comment_replies')
      .insert({
        comment_id,
        parent_reply_id: parent_reply_id || null,
        reply_text,
        anonymous_id,
        is_approved: !requiresApproval,
      })
      .select('id, comment_id, parent_reply_id, reply_text, anonymous_id, created_at, is_approved, is_flagged')
      .single();

    if (error) {
      console.error('Error creating reply:', error);
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: reply,
        message: requiresApproval ? 'Reply submitted for moderation' : 'Reply posted',
        requires_approval: requiresApproval,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/comment-replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
