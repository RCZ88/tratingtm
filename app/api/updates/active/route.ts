import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/updates/active
 * Public: return latest updates from the last 24 hours (max 5)
 */
export async function GET() {
  try {
    const supabase = createClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('public_updates')
      .select('id, title, body, type, created_at, expires_at, teacher_id, link_url, is_active, teacher:teachers(id, name)')
      .eq('is_active', true)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching active updates:', error);
      return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/updates/active:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
