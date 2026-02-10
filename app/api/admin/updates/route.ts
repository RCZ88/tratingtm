import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/updates
 * Admin: list updates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const activeParam = searchParams.get('active');

    const supabase = createServiceClient();
    let query = supabase
      .from('public_updates')
      .select('id, title, body, type, created_at, updated_at, expires_at, teacher_id, link_url, is_active, teacher:teachers(id, name)')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (activeParam === 'true') {
      query = query.eq('is_active', true);
    }
    if (activeParam === 'false') {
      query = query.eq('is_active', false);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching updates:', error);
      return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/updates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/updates
 * Admin: create update
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      body: messageBody,
      type,
      teacher_id,
      link_url,
      expires_at,
      is_active,
    } = body || {};

    if (!title || !messageBody) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = expires_at || new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const resolvedLink = link_url || (teacher_id ? `/teachers/${teacher_id}` : null);

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('public_updates')
      .insert({
        title,
        body: messageBody,
        type: type || 'custom',
        teacher_id: teacher_id || null,
        link_url: resolvedLink,
        expires_at: expiresAt,
        is_active: typeof is_active === 'boolean' ? is_active : true,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating update:', error);
      return NextResponse.json({ error: 'Failed to create update' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in POST /api/admin/updates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
