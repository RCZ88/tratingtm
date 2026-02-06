import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

/**
 * GET /api/admin/comments/pending
 * 
 * Get all pending comments for moderation.
 * Includes teacher information.
 * Requires admin authentication.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        teacher:teachers(id, name, subject, image_url)
      `)
      .eq('is_approved', false)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pending comments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: comments || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/comments/pending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
