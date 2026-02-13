import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { scanForProfanity } from '@/lib/utils/profanityServer';
import { normalizeReaction, THUMBS_DOWN, THUMBS_UP } from '@/lib/utils/commentReactions';

export const dynamic = 'force-dynamic';

type ReplyRow = {
  id: string;
  post_id: string;
  parent_reply_id: string | null;
  body: string;
  author_role: 'user' | 'admin';
  anonymous_id: string | null;
  is_approved: boolean;
  is_flagged: boolean;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

async function signReplyImages(rows: ReplyRow[]) {
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
    const postId = searchParams.get('post_id');
    const anonymousId = searchParams.get('anonymous_id');

    if (!postId) {
      return NextResponse.json({ error: 'post_id is required' }, { status: 400 });
    }

    const supabase: any = createServiceClient();
    const { data: rows, error } = await supabase
      .from('forum_replies')
      .select('*')
      .eq('post_id', postId)
      .eq('is_approved', true)
      .eq('is_flagged', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching forum replies:', error);
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    const replies = (rows || []) as ReplyRow[];
    const ids = replies.map((row) => row.id);

    const { data: reactions } = ids.length > 0
      ? await supabase.from('forum_reply_reactions').select('reply_id, reaction, anonymous_id').in('reply_id', ids)
      : { data: [] as any[] };

    const reactionMap = new Map<string, {
      emoji_counts: Record<string, number>;
      viewer_emojis: Set<string>;
      like_count: number;
      dislike_count: number;
    }>();

    ids.forEach((id) => {
      reactionMap.set(id, {
        emoji_counts: {},
        viewer_emojis: new Set<string>(),
        like_count: 0,
        dislike_count: 0,
      });
    });

    (reactions || []).forEach((row: any) => {
      const entry = reactionMap.get(row.reply_id);
      if (!entry) return;
      const emoji = normalizeReaction(row.reaction);
      if (!emoji) return;
      entry.emoji_counts[emoji] = (entry.emoji_counts[emoji] || 0) + 1;
      if (emoji === THUMBS_UP) entry.like_count += 1;
      if (emoji === THUMBS_DOWN) entry.dislike_count += 1;
      if (anonymousId && row.anonymous_id === anonymousId) {
        entry.viewer_emojis.add(emoji);
      }
    });

    const imageMap = await signReplyImages(replies);

    const enriched = replies.map((row) => {
      const reaction = reactionMap.get(row.id) || {
        emoji_counts: {},
        viewer_emojis: new Set<string>(),
        like_count: 0,
        dislike_count: 0,
      };

      return {
        ...row,
        image_url: imageMap.get(row.id) || null,
        emoji_counts: reaction.emoji_counts,
        viewer_emojis: Array.from(reaction.viewer_emojis),
        like_count: reaction.like_count,
        dislike_count: reaction.dislike_count,
        is_owner: !!anonymousId && !!row.anonymous_id && row.anonymous_id === anonymousId,
      };
    });

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('Error in GET /api/forum/replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postId = typeof body.post_id === 'string' ? body.post_id : '';
    const parentReplyId = typeof body.parent_reply_id === 'string' ? body.parent_reply_id : null;
    const content = typeof body.body === 'string' ? body.body.trim() : '';
    const anonymousId = typeof body.anonymous_id === 'string' ? body.anonymous_id.trim() : '';
    const imagePath = typeof body.image_path === 'string' ? body.image_path.trim() : null;

    if (!postId || !content || !anonymousId) {
      return NextResponse.json({ error: 'post_id, body, and anonymous_id are required' }, { status: 400 });
    }

    const supabase: any = createServiceClient();

    const { data: post } = await supabase
      .from('forum_posts')
      .select('id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (parentReplyId) {
      const { data: parent } = await supabase
        .from('forum_replies')
        .select('id, post_id')
        .eq('id', parentReplyId)
        .single();

      if (!parent || parent.post_id !== postId) {
        return NextResponse.json({ error: 'Invalid parent reply' }, { status: 400 });
      }
    }

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
      .from('forum_replies')
      .insert({
        post_id: postId,
        parent_reply_id: parentReplyId,
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
      console.error('Error creating forum reply:', error);
      return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 });
    }

    return NextResponse.json({
      data: created,
      message: 'Reply submitted for moderation',
      requires_approval: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/forum/replies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
