import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/updates/changelog
 * Public: return older updates (past 24 hours)
 * Query params: page, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const supabase = createClient();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('public_updates')
      .select('id, title, body, type, created_at, expires_at, teacher_id, link_url, is_active, teacher:teachers(id, name)', { count: 'exact' })
      .eq('is_active', true)
      .lt('created_at', cutoff)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching changelog updates:', error);
      return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in GET /api/updates/changelog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
