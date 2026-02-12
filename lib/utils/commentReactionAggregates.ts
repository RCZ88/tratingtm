import { normalizeReaction, isThumbsDownReaction, isThumbsUpReaction } from '@/lib/utils/commentReactions';

type BaseComment = {
  id: string;
  [key: string]: unknown;
};

type AggregateOptions = {
  anonymousId?: string | null;
};

export const aggregateCommentReactions = async <T extends BaseComment>(
  supabase: any,
  comments: T[],
  options: AggregateOptions = {}
): Promise<{
  comments: Array<
    T & {
      like_count: number;
      dislike_count: number;
      viewer_reaction: 'like' | 'dislike' | null;
      emoji_counts: Record<string, number>;
      viewer_emojis: string[];
    }
  >;
  availableEmojis: string[];
}> => {
  const commentIds = comments.map((comment) => comment.id).filter(Boolean);

  const { data: emojiRows } = await supabase
    .from('comment_reaction_emojis')
    .select('emoji')
    .eq('enabled', true)
    .order('sort_order', { ascending: true })
    .order('emoji', { ascending: true });

  const availableEmojis = (emojiRows || []).map((row: any) => row.emoji);

  if (commentIds.length === 0) {
    return {
      comments: comments.map((comment) => ({
        ...comment,
        like_count: 0,
        dislike_count: 0,
        viewer_reaction: null,
        emoji_counts: {},
        viewer_emojis: [],
      })),
      availableEmojis,
    };
  }

  const { data: reactionRows } = await supabase
    .from('comment_reactions')
    .select('comment_id, reaction, anonymous_id')
    .in('comment_id', commentIds);

  const reactionMap = new Map<
    string,
    {
      like_count: number;
      dislike_count: number;
      viewer_reaction: 'like' | 'dislike' | null;
      emoji_counts: Record<string, number>;
      viewer_emojis: Set<string>;
    }
  >();

  comments.forEach((comment) => {
    reactionMap.set(comment.id, {
      like_count: 0,
      dislike_count: 0,
      viewer_reaction: null,
      emoji_counts: {},
      viewer_emojis: new Set<string>(),
    });
  });

  (reactionRows || []).forEach((row: any) => {
    const entry = reactionMap.get(row.comment_id);
    if (!entry) return;

    const normalized = normalizeReaction(row.reaction);
    if (!normalized) return;

    entry.emoji_counts[normalized] = (entry.emoji_counts[normalized] || 0) + 1;

    if (isThumbsUpReaction(normalized)) {
      entry.like_count += 1;
    }
    if (isThumbsDownReaction(normalized)) {
      entry.dislike_count += 1;
    }

    if (options.anonymousId && row.anonymous_id === options.anonymousId) {
      entry.viewer_emojis.add(normalized);
      if (isThumbsUpReaction(normalized)) entry.viewer_reaction = 'like';
      if (isThumbsDownReaction(normalized)) entry.viewer_reaction = 'dislike';
    }
  });

  const withReactions = comments.map((comment) => {
    const entry = reactionMap.get(comment.id);
    return {
      ...comment,
      like_count: entry?.like_count || 0,
      dislike_count: entry?.dislike_count || 0,
      viewer_reaction: entry?.viewer_reaction || null,
      emoji_counts: entry?.emoji_counts || {},
      viewer_emojis: Array.from(entry?.viewer_emojis || []),
    };
  });

  return { comments: withReactions, availableEmojis };
};
