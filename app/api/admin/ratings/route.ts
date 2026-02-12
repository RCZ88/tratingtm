import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED_TABLES = ['ratings', 'weekly_ratings'] as const;
type RatingsTable = (typeof ALLOWED_TABLES)[number];

/**
 * GET /api/admin/ratings
 * Query params: teacher_id, table=ratings|weekly_ratings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacher_id');
    const tableParam = searchParams.get('table');

    if (!teacherId) {
      return NextResponse.json({ error: 'teacher_id is required' }, { status: 400 });
    }

    if (!tableParam || !ALLOWED_TABLES.includes(tableParam as RatingsTable)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    const table = tableParam as RatingsTable;
    const supabase = createServiceClient();

    const fields = table === 'weekly_ratings'
      ? 'id, teacher_id, stars, anonymous_id, created_at, week_start'
      : 'id, teacher_id, stars, anonymous_id, created_at';

    const { data, error } = await supabase
      .from(table)
      .select(fields)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin ratings:', error);
      return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/ratings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}