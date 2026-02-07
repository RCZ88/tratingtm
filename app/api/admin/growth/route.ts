import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';
import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

interface GrowthPoint {
  date: string;
  ratings: number;
  comments: number;
  total: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = Number.parseInt(searchParams.get('days') || '30', 10);
    const days = Number.isFinite(daysParam) ? Math.min(Math.max(daysParam, 1), 365) : 30;

    const end = new Date();
    const start = startOfDay(subDays(end, days - 1));
    const startIso = start.toISOString();

    const supabase = createServiceClient();

    const [ratingsResult, commentsResult] = await Promise.all([
      supabase
        .from('ratings')
        .select('created_at')
        .gte('created_at', startIso),
      supabase
        .from('comments')
        .select('created_at')
        .gte('created_at', startIso),
    ]);

    if (ratingsResult.error) {
      console.error('Error fetching rating growth:', ratingsResult.error);
      return NextResponse.json({ error: 'Failed to load ratings growth' }, { status: 500 });
    }

    if (commentsResult.error) {
      console.error('Error fetching comment growth:', commentsResult.error);
      return NextResponse.json({ error: 'Failed to load comments growth' }, { status: 500 });
    }

    const ratingCounts = new Map<string, number>();
    const commentCounts = new Map<string, number>();

    (ratingsResult.data || []).forEach((row) => {
      if (!row.created_at) return;
      const dayKey = row.created_at.slice(0, 10);
      ratingCounts.set(dayKey, (ratingCounts.get(dayKey) || 0) + 1);
    });

    (commentsResult.data || []).forEach((row) => {
      if (!row.created_at) return;
      const dayKey = row.created_at.slice(0, 10);
      commentCounts.set(dayKey, (commentCounts.get(dayKey) || 0) + 1);
    });

    const daysRange = eachDayOfInterval({ start, end });
    const data: GrowthPoint[] = daysRange.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      const ratings = ratingCounts.get(key) || 0;
      const comments = commentCounts.get(key) || 0;
      return {
        date: key,
        ratings,
        comments,
        total: ratings + comments,
      };
    });

    const maxTotal = data.reduce((max, point) => Math.max(max, point.total), 0);

    return NextResponse.json({
      data,
      meta: {
        days,
        maxTotal,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/growth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
