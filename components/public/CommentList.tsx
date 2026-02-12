'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import { MessageSquare, User, CornerDownRight, Smile } from 'lucide-react';
import {
  defaultReactionEmojis,
  THUMBS_DOWN,
  THUMBS_UP,
} from '@/lib/utils/commentReactions';

export interface CommentListProps {
  comments: Array<{
    id: string;
    comment_text: string;
    created_at: string;
    like_count?: number;
    dislike_count?: number;
    viewer_reaction?: 'like' | 'dislike' | null;
    emoji_counts?: Record<string, number>;
    viewer_emojis?: string[];
  }>;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  teacherId?: string;
  totalCount?: number;
  availableReactionEmojis?: string[];
}

type ReplyItem = {
  id: string;
  comment_id: string;
  parent_reply_id: string | null;
  reply_text: string;
  anonymous_id: string;
  created_at: string;
  is_approved: boolean;
  is_flagged: boolean;
};

const CommentList: React.FC<CommentListProps> = ({
  comments,
  isLoading = false,
  emptyMessage = 'No comments yet. Be the first to share your thoughts!',
  className,
  teacherId,
  totalCount,
  availableReactionEmojis,
}) => {
  const [localComments, setLocalComments] = React.useState(comments);
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'time' | 'interactions'>('time');
  const [sortDirection, setSortDirection] = React.useState<'desc' | 'asc'>('desc');
  const [repliesByComment, setRepliesByComment] = React.useState<Record<string, ReplyItem[]>>({});
  const [isLoadingReplies, setIsLoadingReplies] = React.useState(false);
  const [emojiPickerOpenId, setEmojiPickerOpenId] = React.useState<string | null>(null);
  const [reactionEmojis, setReactionEmojis] = React.useState<string[]>(
    availableReactionEmojis?.length ? availableReactionEmojis : [...defaultReactionEmojis]
  );

  const [replyTarget, setReplyTarget] = React.useState<{
    commentId: string;
    parentReplyId: string | null;
    preview: string;
  } | null>(null);
  const [replyText, setReplyText] = React.useState('');
  const [replyError, setReplyError] = React.useState<string | null>(null);
  const [replySuccess, setReplySuccess] = React.useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = React.useState(false);

  React.useEffect(() => {
    setLocalComments(comments);

    const fromComments = Array.from(
      new Set(
        comments
          .flatMap((comment) => Object.keys(comment.emoji_counts || {}))
          .filter((emoji) => emoji && emoji !== THUMBS_UP && emoji !== THUMBS_DOWN)
      )
    );

    const nextEmojis = availableReactionEmojis?.length
      ? [...availableReactionEmojis]
      : [...defaultReactionEmojis];

    setReactionEmojis(
      Array.from(new Set([...nextEmojis.filter((emoji) => emoji !== THUMBS_UP && emoji !== THUMBS_DOWN), ...fromComments]))
    );
  }, [comments, availableReactionEmojis]);

  React.useEffect(() => {
    const loadReactions = async () => {
      try {
        const response = await fetch('/api/comment-reaction-emojis');
        const data = await response.json();
        if (response.ok && Array.isArray(data.data) && data.data.length > 0) {
          setReactionEmojis((prev) =>
            Array.from(
              new Set(
                [...data.data, ...prev].filter((emoji) => emoji !== THUMBS_UP && emoji !== THUMBS_DOWN)
              )
            )
          );
        }
      } catch (error) {
        console.error('Error loading reaction emojis:', error);
      }
    };

    loadReactions();
  }, []);

  const canExpand = !!teacherId && typeof totalCount === 'number' && totalCount > localComments.length;

  const handleLoadAll = async () => {
    if (!teacherId) return;
    setIsLoadingMore(true);
    try {
      const anonymousId = getAnonymousId();
      const params = new URLSearchParams();
      params.set('teacher_id', teacherId);
      params.set('anonymous_id', anonymousId);
      const response = await fetch(`/api/comments?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setLocalComments(data.data || []);
        if (Array.isArray(data.meta?.available_reaction_emojis)) {
          setReactionEmojis((prev) =>
            Array.from(
              new Set(
                [...data.meta.available_reaction_emojis, ...prev].filter(
                  (emoji: string) => emoji !== THUMBS_UP && emoji !== THUMBS_DOWN
                )
              )
            )
          );
        }
        setIsExpanded(true);
      }
    } catch (error) {
      console.error('Error loading all comments:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  React.useEffect(() => {
    const loadReplies = async () => {
      const ids = localComments.map((comment) => comment.id).filter(Boolean);
      if (ids.length === 0) {
        setRepliesByComment({});
        return;
      }

      setIsLoadingReplies(true);
      try {
        const params = new URLSearchParams();
        params.set('comment_ids', ids.join(','));
        const response = await fetch(`/api/comment-replies?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch replies');
        }

        const grouped: Record<string, ReplyItem[]> = {};
        (data.data || []).forEach((reply: ReplyItem) => {
          if (!grouped[reply.comment_id]) grouped[reply.comment_id] = [];
          grouped[reply.comment_id].push(reply);
        });
        setRepliesByComment(grouped);
      } catch (error) {
        console.error('Error loading replies:', error);
      } finally {
        setIsLoadingReplies(false);
      }
    };

    loadReplies();
  }, [localComments]);

  const sortedComments = React.useMemo(() => {
    const entries = [...localComments];
    entries.sort((a, b) => {
      if (sortBy === 'interactions') {
        const aCount = Object.values(a.emoji_counts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
        const bCount = Object.values(b.emoji_counts || {}).reduce((sum, value) => sum + Number(value || 0), 0);
        return sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
      }

      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    });
    return entries;
  }, [localComments, sortBy, sortDirection]);

  const updateReaction = async (commentId: string, emoji: string) => {
    const previous = localComments;
    setPendingIds((prev) => new Set(prev).add(commentId));

    setLocalComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment;
        const emojiCounts = { ...(comment.emoji_counts || {}) };
        const viewerEmojis = new Set(comment.viewer_emojis || []);

        if (viewerEmojis.has(emoji)) {
          viewerEmojis.delete(emoji);
          emojiCounts[emoji] = Math.max(0, (emojiCounts[emoji] || 0) - 1);
          if (emojiCounts[emoji] === 0) delete emojiCounts[emoji];
        } else {
          viewerEmojis.add(emoji);
          emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
        }

        return {
          ...comment,
          emoji_counts: emojiCounts,
          viewer_emojis: Array.from(viewerEmojis),
          like_count: emojiCounts[THUMBS_UP] || 0,
          dislike_count: emojiCounts[THUMBS_DOWN] || 0,
          viewer_reaction: viewerEmojis.has(THUMBS_UP)
            ? 'like'
            : viewerEmojis.has(THUMBS_DOWN)
            ? 'dislike'
            : null,
        };
      })
    );

    try {
      const anonymousId = getAnonymousId();
      const response = await fetch('/api/comments/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_id: commentId,
          anonymous_id: anonymousId,
          emoji,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reaction');
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      setLocalComments(previous);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const toggleEmojiPicker = (commentId: string) => {
    setEmojiPickerOpenId((prev) => (prev === commentId ? null : commentId));
  };

  const openReplyComposer = (commentId: string, parentReplyId: string | null, preview: string) => {
    setReplyError(null);
    setReplySuccess(null);
    setReplyTarget({ commentId, parentReplyId, preview });
  };

  const submitReply = async () => {
    if (!replyTarget) return;
    setReplyError(null);
    setReplySuccess(null);

    const trimmed = replyText.trim();
    if (trimmed.length < 5) {
      setReplyError('Reply must be at least 5 characters.');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const anonymousId = getAnonymousId();
      const response = await fetch('/api/comment-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_id: replyTarget.commentId,
          parent_reply_id: replyTarget.parentReplyId,
          reply_text: trimmed,
          anonymous_id: anonymousId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit reply');
      }

      if (data.requires_approval) {
        setReplySuccess('Reply submitted for moderation.');
      } else if (data.data) {
        setRepliesByComment((prev) => {
          const next = { ...prev };
          const rows = [...(next[replyTarget.commentId] || [])];
          rows.push(data.data);
          rows.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          next[replyTarget.commentId] = rows;
          return next;
        });
        setReplySuccess('Reply posted.');
      }

      setReplyText('');
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : 'Failed to submit reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const renderReplies = (commentId: string, parentReplyId: string | null, depth: number) => {
    const allReplies = repliesByComment[commentId] || [];
    const rows = allReplies.filter((reply) => reply.parent_reply_id === parentReplyId);
    if (rows.length === 0) return null;

    return (
      <div className={cn('space-y-3', depth > 0 ? 'ml-6 border-l border-border pl-4' : 'mt-3')}>
        {rows.map((reply) => {
          const isComposerTarget =
            replyTarget?.commentId === commentId && replyTarget?.parentReplyId === reply.id;

          return (
            <div key={reply.id} className="rounded-md border border-border bg-muted p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Anonymous
                </span>
                <time>{formatRelativeTime(reply.created_at)}</time>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{reply.reply_text}</p>

              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => openReplyComposer(commentId, reply.id, reply.reply_text)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-200 hover:text-emerald-800"
                >
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Reply
                </button>
              </div>

              {isComposerTarget && (
                <div className="mt-3 rounded-md border border-emerald-500/30 bg-card p-3">
                  <p className="mb-2 text-xs text-muted-foreground">Replying to: {reply.reply_text.slice(0, 120)}</p>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                    placeholder="Write your reply..."
                  />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={submitReply} isLoading={isSubmittingReply}>
                      Post Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyTarget(null);
                        setReplyText('');
                        setReplyError(null);
                        setReplySuccess(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {renderReplies(commentId, reply.id, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const getVisibleEmojis = (comment: CommentListProps['comments'][number]) => {
    const used = Object.keys(comment.emoji_counts || {}).filter(
      (emoji) => emoji && emoji !== THUMBS_UP && emoji !== THUMBS_DOWN
    );
    const ordered = reactionEmojis.filter((emoji) => used.includes(emoji));
    const extras = used.filter((emoji) => !reactionEmojis.includes(emoji));
    return [...ordered, ...extras];
  };
  const getAvailableEmojis = (comment: CommentListProps['comments'][number]) => {
    const used = new Set(
      Object.keys(comment.emoji_counts || {}).filter(
        (emoji) => emoji && emoji !== THUMBS_UP && emoji !== THUMBS_DOWN
      )
    );
    return reactionEmojis.filter((emoji) => !used.has(emoji));
  };
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-muted p-4">
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="mt-2 h-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (sortedComments.length === 0) {
    return (
      <div className={cn('rounded-lg bg-muted p-8 text-center', className)}>
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-border bg-muted p-1 text-xs">
          <button
            type="button"
            onClick={() => setSortBy('time')}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              sortBy === 'time' ? ' bg-emerald-500/15 text-emerald-700 dark:text-emerald-200' : ' text-muted-foreground hover:bg-card'
            }`}
          >
            Time posted
          </button>
          <button
            type="button"
            onClick={() => setSortBy('interactions')}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              sortBy === 'interactions' ? ' bg-emerald-500/15 text-emerald-700 dark:text-emerald-200' : ' text-muted-foreground hover:bg-card'
            }`}
          >
            Interactions
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
        >
          {sortDirection === 'desc'
            ? sortBy === 'time'
              ? 'Newest -> Oldest'
              : 'Most -> Least'
            : sortBy === 'time'
            ? 'Oldest -> Newest'
            : 'Least -> Most'}
        </Button>
      </div>

      {replyError && <div className="rounded-md bg-red-500/10 dark:bg-red-500/20 p-2 text-xs text-red-600 dark:text-red-300">{replyError}</div>}
      {replySuccess && <div className="rounded-md bg-emerald-500/10 p-2 text-xs text-emerald-700 dark:text-emerald-200">{replySuccess}</div>}

      {sortedComments.map((comment) => {
        const viewerEmojis = comment.viewer_emojis || [];
        const isPending = pendingIds.has(comment.id);
        const isCommentComposerTarget =
          replyTarget?.commentId === comment.id && replyTarget?.parentReplyId === null;
        const replyCount = (repliesByComment[comment.id] || []).length;
        const emojiSequence = getVisibleEmojis(comment);
        const availableEmojis = getAvailableEmojis(comment);
        const emojiCounts = comment.emoji_counts || {};

        return (
          <div key={comment.id} className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Anonymous</span>
              </div>
              <time className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</time>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{comment.comment_text}</p>

            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateReaction(comment.id, THUMBS_UP)}
                  disabled={isPending}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    viewerEmojis.includes(THUMBS_UP)
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                      : 'border-border bg-muted text-muted-foreground hover:bg-card'
                  )}
                >
                  <span>{THUMBS_UP}</span>
                  <span>{emojiCounts[THUMBS_UP] || 0}</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateReaction(comment.id, THUMBS_DOWN)}
                  disabled={isPending}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    viewerEmojis.includes(THUMBS_DOWN)
                      ? 'border-rose-400/40 bg-rose-500/15 text-rose-600 dark:text-rose-200'
                      : 'border-border bg-muted text-muted-foreground hover:bg-card'
                  )}
                >
                  <span>{THUMBS_DOWN}</span>
                  <span>{emojiCounts[THUMBS_DOWN] || 0}</span>
                </button>

                {emojiSequence.map((emoji) => {
                  const count = emojiCounts[emoji] || 0;
                  const isActive = viewerEmojis.includes(emoji);
                  return (
                    <button
                      key={`${comment.id}-${emoji}`}
                      type="button"
                      onClick={() => updateReaction(comment.id, emoji)}
                      disabled={isPending}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                        isActive
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                          : 'border-border bg-muted text-muted-foreground hover:bg-card'
                      )}
                    >
                      <span>{emoji}</span>
                      <span>{count}</span>
                    </button>
                  );
                })}
                {availableEmojis.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => toggleEmojiPicker(comment.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-card"
                    >
                      <Smile className="h-3.5 w-3.5" />
                      Tap an emoji to react
                    </button>
                    {emojiPickerOpenId === comment.id && (
                      <div className="absolute left-0 top-full z-20 mt-2 w-max rounded-xl border border-border bg-card p-2 shadow-lg">
                        <div className="flex flex-wrap gap-1.5">
                          {availableEmojis.map((emoji) => (
                            <button
                              key={`${comment.id}-picker-${emoji}`}
                              type="button"
                              onClick={() => {
                                updateReaction(comment.id, emoji);
                                setEmojiPickerOpenId(null);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-base transition-colors hover:bg-card"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openReplyComposer(comment.id, null, comment.comment_text)}
                  className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-card"
                >
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Reply
                </button>

                <span className="text-xs text-muted-foreground">{replyCount} repl{replyCount === 1 ? 'y' : 'ies'}</span>
              </div>
            </div>

            {isCommentComposerTarget && (
              <div className="mt-3 rounded-md border border-emerald-500/30 bg-muted p-3">
                <p className="mb-2 text-xs text-muted-foreground">Replying to: {comment.comment_text.slice(0, 120)}</p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="Write your reply..."
                />
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={submitReply} isLoading={isSubmittingReply}>
                    Post Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyTarget(null);
                      setReplyText('');
                      setReplyError(null);
                      setReplySuccess(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isLoadingReplies ? (
              <p className="mt-3 text-xs text-muted-foreground">Loading replies...</p>
            ) : (
              renderReplies(comment.id, null, 0)
            )}
          </div>
        );
      })}

      {canExpand && !isExpanded && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={handleLoadAll} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading comments...' : 'View all comments'}
          </Button>
        </div>
      )}
    </div>
  );
};

export { CommentList };

