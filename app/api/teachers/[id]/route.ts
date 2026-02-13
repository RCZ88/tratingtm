import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validate, teacherUpdateSchema, uuidSchema } from '@/lib/utils/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getCurrentWeekStart, toISODate } from '@/lib/utils/dateHelpers';
import { aggregateCommentReactions } from '@/lib/utils/commentReactionAggregates';

/**
 * GET /api/teachers/[id]
 * 
 * Get a single teacher with their stats and recent comments.
 * Public endpoint - no authentication required.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const anonymousId = searchParams.get('anonymous_id');
    const { id } = await params;

    // Validate UUID
    const uuidValidation = validate(uuidSchema, id);
    if (!uuidValidation.success) {
      return NextResponse.json(
        { error: 'Invalid teacher ID' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Fetch teacher
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Fetch teacher stats
    const { data: stats } = await supabase
      .from('teacher_stats')
      .select('*')
      .eq('id', id)
      .single();

    // Fetch department
    const { data: department } = teacher.department_id
      ? await supabase
          .from('departments')
          .select('id, name, color_hex')
          .eq('id', teacher.department_id)
          .maybeSingle()
      : { data: null };

    // Fetch subjects
    const { data: subjectRows } = await supabase
      .from('teacher_subjects')
      .select('subject:subjects(id, name)')
      .eq('teacher_id', id);

    const subjects = (subjectRows || [])
      .map((row: any) => row.subject)
      .filter(Boolean)
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    // Fetch rating distribution
    const { data: ratings } = await supabase
      .from('ratings')
      .select('stars')
      .eq('teacher_id', id);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings?.forEach((r) => {
      distribution[r.stars as keyof typeof distribution]++;
    });

    // Fetch recent approved comments
    const { data: comments } = await supabase
      .from('comments')
      .select('id, comment_text, anonymous_id, created_at')
      .eq('teacher_id', id)
      .eq('is_approved', true)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .limit(10);
    const reactionAggregate = await aggregateCommentReactions(supabase, comments || [], { anonymousId });
    const commentsWithReactions = reactionAggregate.comments.map((comment: any) => {
      const { anonymous_id, ...rest } = comment;
      return {
        ...rest,
        is_owner: !!anonymousId && anonymous_id === anonymousId,
      };
    });


    const weekStart = toISODate(getCurrentWeekStart());
    const { data: weeklyRatings } = await supabase
      .from('weekly_ratings')
      .select('stars')
      .eq('teacher_id', id)
      .eq('week_start', weekStart);

    const weeklyCount = weeklyRatings?.length || 0;
    const weeklySum = (weeklyRatings || []).reduce((sum, row) => sum + row.stars, 0);
    const weeklyAverage =
      weeklyCount >= 3 ? Number((weeklySum / weeklyCount).toFixed(2)) : null;
    const weeklyDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    weeklyRatings?.forEach((r) => {
      weeklyDistribution[r.stars as keyof typeof weeklyDistribution]++;
    });

    return NextResponse.json({
      data: {
        ...teacher,
        department: department || null,
        subjects,
        subject_ids: subjects.map((s: any) => s.id),
        primary_subject: subjects[0]?.name || null,
        total_ratings: stats?.total_ratings || 0,
        average_rating: stats?.overall_rating || 0,
        total_comments: stats?.total_comments || 0,
        weekly_rating_count: weeklyCount,
        weekly_average_rating: weeklyAverage,
        rating_distribution: distribution,
        weekly_rating_distribution: weeklyDistribution,
        comments: commentsWithReactions,
        available_reaction_emojis: reactionAggregate.availableEmojis,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/teachers/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teachers/[id]
 * 
 * Update a teacher.
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
        { error: 'Invalid teacher ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validate(teacherUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if teacher exists
    const { data: existing } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    const { subject_ids, ...teacherData } = validation.data as {
      subject_ids?: string[] | null;
      [key: string]: any;
    };

    const { data: teacher, error } = await supabase
      .from('teachers')
      .update({
        ...teacherData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating teacher:', error);
      return NextResponse.json(
        { error: 'Failed to update teacher' },
        { status: 500 }
      );
    }

    if (subject_ids !== undefined) {
      const { error: deleteError } = await supabase
        .from('teacher_subjects')
        .delete()
        .eq('teacher_id', id);

      if (deleteError) {
        console.error('Error clearing teacher subjects:', deleteError);
        return NextResponse.json({ error: 'Failed to update teacher subjects' }, { status: 500 });
      }

      if (subject_ids && subject_ids.length > 0) {
        const rows = subject_ids.map((subjectId) => ({
          teacher_id: id,
          subject_id: subjectId,
        }));
        const { error: insertError } = await supabase
          .from('teacher_subjects')
          .insert(rows);

        if (insertError) {
          console.error('Error updating teacher subjects:', insertError);
          return NextResponse.json({ error: 'Failed to update teacher subjects' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      data: teacher,
      message: 'Teacher updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/teachers/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teachers/[id]
 * 
 * Delete a teacher (soft delete by setting is_active to false).
 * Requires admin authentication.
 */
export async function DELETE(
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
        { error: 'Invalid teacher ID' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if teacher exists
    const { data: existing } = await supabase
      .from('teachers')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('teachers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting teacher:', error);
      return NextResponse.json(
        { error: 'Failed to delete teacher' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Teacher deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/teachers/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



