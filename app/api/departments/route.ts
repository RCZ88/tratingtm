import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/departments
 *
 * Public endpoint: list departments.
 */
export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('departments')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching departments:', error);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (error) {
    console.error('Error in GET /api/departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
