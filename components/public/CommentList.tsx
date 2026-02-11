'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import { MessageSquare, User, ThumbsUp, ThumbsDown, CornerDownRight } from 'lucide-react';

export interface CommentListProps {
  comments: Array<{
    id: string;
    comment_text: string;
    created_at: string;
    like_count?: number;
    dislike_count?: number;
    viewer_reaction?: 'like' | 'dislike' | null;
  }>;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  teacherId?: string;
  totalCount?: number;
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
}) => {
  const [localComments, setLocalComments] = React.useState(comments);
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'time' | 'interactions'>('time');
  const [sortDirection, setSortDirection] = React.useState<'desc' | 'asc'>('desc');
  const [repliesByComment, setRepliesByComment] = React.useState<Record<string, ReplyItem[]>>({});
  const [isLoadingReplies, setIsLoadingReplies] = React.useState(false);

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
  }, [comments]);

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
        const aCount = (a.like_count || 0) + (a.dislike_count || 0);
        const bCount = (b.like_count || 0) + (b.dislike_count || 0);
        return sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
      }

      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
    });
    return entries;
  }, [localComments, sortBy, sortDirection]);

  const updateReaction = async (commentId: string, reaction: 'like' | 'dislike') => {
    const previous = localComments;
    const current = localComments.find((comment) => comment.id === commentId)?.viewer_reaction || null;
    const nextReaction = current === reaction ? null : reaction;
    setPendingIds((prev) => new Set(prev).add(commentId));

    setLocalComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) return comment;
        const currentLocal = comment.viewer_reaction || null;
        const next = currentLocal === reaction ? null : reaction;
        let likeCount = comment.like_count || 0;
        let dislikeCount = comment.dislike_count || 0;

        if (currentLocal === 'like') likeCount -= 1;
        if (currentLocal === 'dislike') dislikeCount -= 1;
        if (next === 'like') likeCount += 1;
        if (next === 'dislike') dislikeCount += 1;

        return {
          ...comment,
          like_count: Math.max(0, likeCount),
          dislike_count: Math.max(0, dislikeCount),
          viewer_reaction: next,
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
          reaction: nextReaction,
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
      <div className={cn('space-y-3', depth > 0 ? 'ml-6 border-l border-slate-200 pl-4' : 'mt-3')}>
        {rows.map((reply) => {
          const isComposerTarget =
            replyTarget?.commentId === commentId && replyTarget?.parentReplyId === reply.id;

          return (
            <div key={reply.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  Anonymous
                </span>
                <time>{formatRelativeTime(reply.created_at)}</time>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{reply.reply_text}</p>

              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => openReplyComposer(commentId, reply.id, reply.reply_text)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <CornerDownRight className="h-3.5 w-3.5" />
                  Reply
                </button>
              </div>

              {isComposerTarget && (
                <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3">
                  <p className="mb-2 text-xs text-slate-500">Replying to: {reply.reply_text.slice(0, 120)}</p>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="animate-pulse rounded-lg bg-slate-100 p-4">
            <div className="h-4 w-1/4 rounded bg-slate-200" />
            <div className="mt-2 h-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (sortedComments.length === 0) {
    return (
      <div className={cn('rounded-lg bg-slate-50 p-8 text-center', className)}>
        <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-xs">
          <button
            type="button"
            onClick={() => setSortBy('time')}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              sortBy === 'time' ? ' bg-emerald-100 text-emerald-700' : ' text-slate-600 hover:bg-white'
            }`}
          >
            Time posted
          </button>
          <button
            type="button"
            onClick={() => setSortBy('interactions')}
            className={`rounded-full px-3 py-1 font-medium transition-colors ${
              sortBy === 'interactions' ? ' bg-emerald-100 text-emerald-700' : ' text-slate-600 hover:bg-white'
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

      {replyError && <div className="rounded-md bg-red-50 p-2 text-xs text-red-600">{replyError}</div>}
      {replySuccess && <div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-700">{replySuccess}</div>}

      {sortedComments.map((comment) => {
        const likeCount = comment.like_count || 0;
        const dislikeCount = comment.dislike_count || 0;
        const viewerReaction = comment.viewer_reaction || null;
        const isPending = pendingIds.has(comment.id);
        const isCommentComposerTarget =
          replyTarget?.commentId === comment.id && replyTarget?.parentReplyId === null;
        const replyCount = (repliesByComment[comment.id] || []).length;

        return (
          <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">Anonymous</span>
              </div>
              <time className="text-xs text-slate-400">{formatRelativeTime(comment.created_at)}</time>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{comment.comment_text}</p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => updateReaction(comment.id, 'like')}
                disabled={isPending}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                  viewerReaction === 'like' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {likeCount}
              </button>
              <button
                type="button"
                onClick={() => updateReaction(comment.id, 'dislike')}
                disabled={isPending}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                  viewerReaction === 'dislike' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                {dislikeCount}
              </button>

              <button
                type="button"
                onClick={() => openReplyComposer(comment.id, null, comment.comment_text)}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
              >
                <CornerDownRight className="h-3.5 w-3.5" />
                Reply
              </button>

              <span className="text-xs text-slate-500">{replyCount} repl{replyCount === 1 ? 'y' : 'ies'}</span>
            </div>

            {isCommentComposerTarget && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs text-slate-500">Replying to: {comment.comment_text.slice(0, 120)}</p>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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
              <p className="mt-3 text-xs text-slate-500">Loading replies...</p>
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
