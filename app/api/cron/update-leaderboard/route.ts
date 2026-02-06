import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/cron/update-leaderboard
 * 
 * Cron job endpoint to update the weekly leaderboard.
 * Should be called weekly (recommended: Monday at midnight).
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Call the database function to update leaderboard
    const { error } = await supabase.rpc('update_weekly_leaderboard');

    if (error) {
      console.error('Error updating leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to update leaderboard', details: error.message },
        { status: 500 }
      );
    }

    // Get the updated leaderboard for confirmation
    const { data: leaderboard } = await supabase
      .from('leaderboard_cache')
      .select('*')
      .order('rank_position', { ascending: true })
      .limit(10);

    return NextResponse.json({
      message: 'Leaderboard updated successfully',
      topEntries: leaderboard || [],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cron update-leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/update-leaderboard
 * 
 * Alternative endpoint for manual trigger.
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
