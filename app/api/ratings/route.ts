import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validate, ratingSchema } from '@/lib/utils/validation';

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

    // If anonymous_id provided, check if user has rated
    if (anonymousId) {
      const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('anonymous_id', anonymousId)
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
 * Anonymous users can submit one rating per teacher.
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

    // Check for duplicate rating
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('anonymous_id', anonymous_id)
      .maybeSingle();

    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this teacher' },
        { status: 409 }
      );
    }

    // Insert rating
    const { data: rating, error } = await supabase
      .from('ratings')
      .insert({
        teacher_id,
        stars,
        anonymous_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rating:', error);
      return NextResponse.json(
        { error: 'Failed to submit rating' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: rating, message: 'Rating submitted successfully' },
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
