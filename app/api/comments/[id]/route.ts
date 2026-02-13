import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { validate, commentModerationSchema, uuidSchema } from '@/lib/utils/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { scanForProfanity } from '@/lib/utils/profanityServer';

/**
 * PUT /api/comments/[id]
 * 
 * Update a comment (approve, reject, or flag).
 * Requires admin authentication.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate UUID
    const uuidValidation = validate(uuidSchema, id);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validate(commentModerationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if comment exists
    const { data: existing } = await supabase
      .from('comments')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json(
        { error: 'Failed to update comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: comment,
      message: 'Comment updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/comments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/comments/[id]
 *
 * Edit own comment.
 * Requires matching anonymous_id.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const uuidValidation = validate(uuidSchema, id);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const anonymousId = typeof body.anonymous_id === 'string' ? body.anonymous_id.trim() : '';
    const commentText = typeof body.comment_text === 'string' ? body.comment_text.trim() : '';

    if (!anonymousId) {
      return NextResponse.json({ error: 'anonymous_id is required' }, { status: 400 });
    }

    if (commentText.length < 10 || commentText.length > 500) {
      return NextResponse.json({ error: 'Comment must be between 10 and 500 characters' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from('comments')
      .select('id, anonymous_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existing.anonymous_id !== anonymousId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: bannedRows, error: bannedError } = await supabase
      .from('banned_words')
      .select('word')
      .eq('enabled', true);
    if (bannedError) {
      console.error('Error loading banned words:', bannedError);
    }
    const bannedWords = (bannedRows || []).map((row) => row.word).filter(Boolean);
    const profanityResult = scanForProfanity(commentText, bannedWords);

    if (profanityResult.flaggedWords.length > 0) {
      return NextResponse.json(
        { error: 'Inappropriate language detected', flaggedWords: profanityResult.flaggedWords },
        { status: 400 }
      );
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

    const { data: updated, error } = await supabase
      .from('comments')
      .update({
        comment_text: commentText,
        is_approved: !requiresApproval,
        is_flagged: false,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating own comment:', error);
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
    }

    return NextResponse.json({
      data: updated,
      message: requiresApproval
        ? 'Comment updated and sent for moderation'
        : 'Comment updated successfully',
      requires_approval: requiresApproval,
    });
  } catch (error) {
    console.error('Error in PATCH /api/comments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]
 * 
 * Delete a comment permanently.
 * Requires admin authentication.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin path
    const session = await getServerSession(authOptions);
    const { id } = await params;

    const uuidValidation = validate(uuidSchema, id);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'Invalid comment ID' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    if (session) {
      const { data: existing } = await supabase
        .from('comments')
        .select('id')
        .eq('id', id)
        .single();

      if (!existing) {
        return NextResponse.json(
          { error: 'Comment not found' },
          { status: 404 }
        );
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting comment:', error);
        return NextResponse.json(
          { error: 'Failed to delete comment' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Comment deleted successfully',
      });
    }

    // Public user path (owner only)
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'anonymous_id is required' }, { status: 400 });
    }

    const anonymousId = typeof body.anonymous_id === 'string' ? body.anonymous_id.trim() : '';
    if (!anonymousId) {
      return NextResponse.json({ error: 'anonymous_id is required' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('comments')
      .select('id, anonymous_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existing.anonymous_id !== anonymousId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting own comment:', error);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/comments/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
