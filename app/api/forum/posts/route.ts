import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { scanForProfanity } from '@/lib/utils/profanityServer';
import { normalizeReaction, THUMBS_DOWN, THUMBS_UP } from '@/lib/utils/commentReactions';

export const dynamic = 'force-dynamic';

type ForumPostRow = {
  id: string;
  title: string | null;
  body: string;
  author_role: 'user' | 'admin';
  anonymous_id: string | null;
  is_approved: boolean;
  is_flagged: boolean;
  is_pinned: boolean;
  pinned_at: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

async function signImageUrls(rows: ForumPostRow[]) {
  const supabase: any = createServiceClient();
  const map = new Map<string, string | null>();

  await Promise.all(
    rows
      .filter((row) => row.image_path)
      .map(async (row) => {
        if (!row.image_path) return;
        const { data } = await supabase.storage.from('forum-images').createSignedUrl(row.image_path, 60 * 60);
        map.set(row.id, data?.signedUrl || null);
      })
  );

  return map;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') === 'top' ? 'top' : 'newest';
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);
    const cursor = searchParams.get('cursor');
    const anonymousId = searchParams.get('anonymous_id');

    const supabase: any = createClient();
    let query = supabase
      .from('forum_posts')
      .select('*')
      .eq('category', 'forum')
      .eq('is_approved', true)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .limit(Math.max(limit * 3, 60));

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error('Error fetching forum posts:', error);
      return NextResponse.json({ error: 'Failed to fetch forum posts' }, { status: 500 });
    }

    const posts = (rows || []) as ForumPostRow[];
    const postIds = posts.map((row) => row.id);

    const [reactionResult, replyCountResult, emojiResult] = await Promise.all([
      postIds.length > 0
        ? supabase
            .from('forum_post_reactions')
            .select('post_id, reaction, anonymous_id')
            .in('post_id', postIds)
        : Promise.resolve({ data: [] }),
      postIds.length > 0
        ? supabase
            .from('forum_replies')
            .select('post_id')
            .in('post_id', postIds)
            .eq('is_approved', true)
            .eq('is_flagged', false)
        : Promise.resolve({ data: [] }),
      supabase
        .from('comment_reaction_emojis')
        .select('emoji')
        .eq('enabled', true)
        .order('sort_order', { ascending: true })
        .order('emoji', { ascending: true }),
    ]);

    const reactionByPost = new Map<string, {
      emoji_counts: Record<string, number>;
      viewer_emojis: Set<string>;
      like_count: number;
      dislike_count: number;
      total_reactions: number;
    }>();

    postIds.forEach((id) => {
      reactionByPost.set(id, {
        emoji_counts: {},
        viewer_emojis: new Set<string>(),
        like_count: 0,
        dislike_count: 0,
        total_reactions: 0,
      });
    });

    (reactionResult.data || []).forEach((row: any) => {
      const entry = reactionByPost.get(row.post_id);
      if (!entry) return;
      const emoji = normalizeReaction(row.reaction);
      if (!emoji) return;
      entry.emoji_counts[emoji] = (entry.emoji_counts[emoji] || 0) + 1;
      entry.total_reactions += 1;
      if (emoji === THUMBS_UP) entry.like_count += 1;
      if (emoji === THUMBS_DOWN) entry.dislike_count += 1;
      if (anonymousId && row.anonymous_id === anonymousId) {
        entry.viewer_emojis.add(emoji);
      }
    });

    const replyCountByPost = new Map<string, number>();
    (replyCountResult.data || []).forEach((row: any) => {
      replyCountByPost.set(row.post_id, (replyCountByPost.get(row.post_id) || 0) + 1);
    });

    const imageUrlMap = await signImageUrls(posts);

    const normalized = posts.map((post) => {
      const reaction = reactionByPost.get(post.id) || {
        emoji_counts: {},
        viewer_emojis: new Set<string>(),
        like_count: 0,
        dislike_count: 0,
        total_reactions: 0,
      };
      return {
        ...post,
        image_url: imageUrlMap.get(post.id) || null,
        emoji_counts: reaction.emoji_counts,
        viewer_emojis: Array.from(reaction.viewer_emojis),
        like_count: reaction.like_count,
        dislike_count: reaction.dislike_count,
        total_reactions: reaction.total_reactions,
        reply_count: replyCountByPost.get(post.id) || 0,
        is_owner: !!anonymousId && !!post.anonymous_id && post.anonymous_id === anonymousId,
      };
    });

    const sorted = [...normalized].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      if (a.is_pinned && b.is_pinned) {
        const aPinned = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
        const bPinned = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
      }

      if (sort === 'top') {
        if (a.total_reactions !== b.total_reactions) {
          return b.total_reactions - a.total_reactions;
        }
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const page = sorted.slice(0, limit);
    const nextCursor = page.length > 0 ? page[page.length - 1].created_at : null;

    return NextResponse.json({
      data: page,
      meta: {
        next_cursor: nextCursor,
        available_reaction_emojis: (emojiResult.data || []).map((row: any) => row.emoji),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/forum/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const content = typeof body.body === 'string' ? body.body.trim() : '';
    const anonymousId = typeof body.anonymous_id === 'string' ? body.anonymous_id.trim() : '';
    const imagePath = typeof body.image_path === 'string' ? body.image_path.trim() : null;

    if (!content) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
    }

    if (!anonymousId) {
      return NextResponse.json({ error: 'anonymous_id is required' }, { status: 400 });
    }

    const supabase: any = createClient();

    const { data: bannedRows } = await supabase
      .from('banned_words')
      .select('word')
      .eq('enabled', true);

    const bannedWords = (bannedRows || []).map((row: any) => row.word).filter(Boolean);
    const profanity = scanForProfanity(content, bannedWords);
    if (profanity.flaggedWords.length > 0) {
      return NextResponse.json({ error: 'Inappropriate language detected', flaggedWords: profanity.flaggedWords }, { status: 400 });
    }

    const { data: created, error } = await supabase
      .from('forum_posts')
      .insert({
        category: 'forum',
        title: title || null,
        body: content,
        author_role: 'user',
        anonymous_id: anonymousId,
        image_path: imagePath,
        is_approved: false,
        is_flagged: false,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating forum post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({
      data: created,
      message: 'Post submitted for moderation',
      requires_approval: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/forum/posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
