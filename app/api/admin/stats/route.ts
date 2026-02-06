import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { getCurrentWeekStart, toISODate } from '@/lib/utils/dateHelpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * 
 * Get platform analytics and statistics.
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

    // Get total counts
    const [
      teachersResult,
      ratingsResult,
      commentsResult,
      pendingCommentsResult,
    ] = await Promise.all([
      supabase.from('teachers').select('*', { count: 'exact', head: true }),
      supabase.from('ratings').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_approved', true),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    ]);

    // Get weekly stats
    const weekStart = getCurrentWeekStart();
    const [
      weeklyRatingsResult,
      weeklyCommentsResult,
    ] = await Promise.all([
      supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', toISODate(weekStart)),
      supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', toISODate(weekStart)),
    ]);

    // Get top rated teachers
    const { data: topTeachers } = await supabase
      .from('teacher_stats')
      .select('*')
      .order('overall_rating', { ascending: false })
      .limit(5);

    // Get recent activity
    const { data: recentRatings } = await supabase
      .from('ratings')
      .select('*, teacher:teachers(name)')
      .order('created_at', { ascending: false })
      .limit(10);

    const stats = {
      totalTeachers: teachersResult.count || 0,
      totalRatings: ratingsResult.count || 0,
      totalComments: commentsResult.count || 0,
      pendingComments: pendingCommentsResult.count || 0,
      weeklyRatings: weeklyRatingsResult.count || 0,
      weeklyComments: weeklyCommentsResult.count || 0,
      topTeachers: topTeachers || [],
      recentActivity: recentRatings || [],
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error in GET /api/admin/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
