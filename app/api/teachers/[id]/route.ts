import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { validate, teacherUpdateSchema, uuidSchema } from '@/lib/utils/validation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

/**
 * GET /api/teachers/[id]
 * 
 * Get a single teacher with their stats and recent comments.
 * Public endpoint - no authentication required.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
      .select('*')
      .eq('teacher_id', id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      data: {
        ...teacher,
        total_ratings: stats?.total_ratings || 0,
        average_rating: stats?.overall_rating || 0,
        total_comments: stats?.total_comments || 0,
        rating_distribution: distribution,
        comments: comments || [],
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
  { params }: { params: { id: string } }
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

    const { id } = params;

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

    const { data: teacher, error } = await supabase
      .from('teachers')
      .update({
        ...validation.data,
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
  { params }: { params: { id: string } }
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

    const { id } = params;

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
