import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validate, ratingSchema } from '@/lib/utils/validation';
import { getCurrentWeekStart, toISODate } from '@/lib/utils/dateHelpers';

/**
 * GET /api/ratings
 * 
 * Get ratings for a teacher or check if user has rated.
 * Query params: teacher_id (required), anonymous_id (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const anonymousId = searchParams.get('anonymous_id');

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const weekStart = toISODate(getCurrentWeekStart());

    // If anonymous_id provided, check if user has rated this week
    if (anonymousId) {
      const { data: existingRating } = await supabase
        .from('weekly_ratings')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('anonymous_id', anonymousId)
        .eq('week_start', weekStart)
        .maybeSingle();

      return NextResponse.json({
        hasRated: !!existingRating,
      });
    }

    // Otherwise return all ratings for the teacher
    const { data: ratings, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: ratings || [] });
  } catch (error) {
    console.error('Error in GET /api/ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ratings
 * 
 * Submit a new rating for a teacher.
 * Anonymous users can submit one rating per teacher per week.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validate(ratingSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    const { teacher_id, stars, anonymous_id } = validation.data;

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
        { error: 'Cannot rate inactive teacher' },
        { status: 400 }
      );
    }

    const weekStart = toISODate(getCurrentWeekStart());

    // Check for weekly rating
    const { data: existingWeekly } = await supabase
      .from('weekly_ratings')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('anonymous_id', anonymous_id)
      .eq('week_start', weekStart)
      .maybeSingle();

    // Upsert weekly rating
    const { error: weeklyError } = await supabase
      .from('weekly_ratings')
      .upsert(
        {
          teacher_id,
          stars,
          anonymous_id,
          week_start: weekStart,
        },
        { onConflict: 'teacher_id,anonymous_id,week_start' }
      );

    if (weeklyError) {
      console.error('Error creating weekly rating:', weeklyError);
      return NextResponse.json(
        { error: 'Failed to submit weekly rating' },
        { status: 500 }
      );
    }

    let rating = null;
    if (!existingWeekly) {
      const result = await supabase
        .from('ratings')
        .insert({
          teacher_id,
          stars,
          anonymous_id,
        })
        .select()
        .single();

      if (result.error) {
        console.error('Error creating rating:', result.error);
        return NextResponse.json(
          { error: 'Failed to submit rating' },
          { status: 500 }
        );
      }
      rating = result.data;
    }

    return NextResponse.json(
      {
        data: rating,
        weeklyUpdated: !!existingWeekly,
        message: existingWeekly
          ? 'Weekly rating updated successfully'
          : 'Rating submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
