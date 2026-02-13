import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    const supabase: any = createServiceClient();
    let query = supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching complaints:', error);
      return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/complaints:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
