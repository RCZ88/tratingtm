import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validate, commentSchema } from '@/lib/utils/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

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

    const supabase = createClient();

    let query = supabase.from('comments').select('*');

    // Filter by teacher if provided
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    // Filter by status
    if (status === 'pending') {
      query = query.eq('is_approved', false);
    } else if (status === 'approved') {
      query = query.eq('is_approved', true);
    } else {
      // Default: only show approved comments for public
      query = query.eq('is_approved', true);
    }

    const { data: comments, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: comments || [] });
  } catch (error) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    // Validate input
    const validation = validate(commentSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { teacher_id, comment_text, anonymous_id } = validation.data;

    const supabase = createClient();

    // Verify teacher exists and is active
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id, is_active')
      .eq('id', teacher_id)
      .single();

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    if (!teacher.is_active) {
      return NextResponse.json(
        { error: 'Cannot comment on inactive teacher' },
        { status: 400 }
      );
    }

    // Check moderation setting
    let requiresApproval = true;
    const { data: settings } = await supabase
      .from('app_settings')
      .select('comments_require_approval')
      .eq('id', 'global')
      .maybeSingle();

    if (settings && typeof settings.comments_require_approval === 'boolean') {
      requiresApproval = settings.comments_require_approval;
    }

    // Insert comment (pending approval if enabled)
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
      return NextResponse.json(
        { error: 'Failed to submit comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: comment,
        message: requiresApproval
          ? 'Comment submitted for moderation'
          : 'Comment posted',
        requires_approval: requiresApproval,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
