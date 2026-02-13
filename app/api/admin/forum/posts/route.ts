import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  return !!session;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'all').toLowerCase();
    const q = searchParams.get('q');
    const pinned = searchParams.get('pinned');

    const supabase: any = createServiceClient();
    let query = supabase
      .from('forum_posts')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('pinned_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (status === 'approved') query = query.eq('is_approved', true).eq('is_flagged', false);
    if (status === 'pending') query = query.eq('is_approved', false).eq('is_flagged', false);
    if (status === 'hidden') query = query.eq('is_flagged', true);

    if (pinned === 'true') query = query.eq('is_pinned', true);
    if (pinned === 'false') query = query.eq('is_pinned', false);
    if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin forum posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/forum/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.body === 'string' ? body.body.trim() : '';
    const imagePath = typeof body.image_path === 'string' ? body.image_path.trim() : null;
    const isPinned = !!body.is_pinned;

    if (!content) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const supabase: any = createServiceClient();
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({
        category: 'forum',
        title: title || null,
        body: content,
        author_role: 'admin',
        admin_user_id: (session as any).user?.id || null,
        image_path: imagePath,
        is_approved: true,
        is_flagged: false,
        is_pinned: isPinned,
        pinned_at: isPinned ? now : null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating admin forum post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/forum/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
