'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import { MessageSquare, User, ThumbsUp, ThumbsDown } from 'lucide-react';

/**
 * CommentList Component
 * 
 * Displays a list of approved comments with timestamps.
 */

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

        likeCount = Math.max(0, likeCount);
        dislikeCount = Math.max(0, dislikeCount);

        return {
          ...comment,
          like_count: likeCount,
          dislike_count: dislikeCount,
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

  if (localComments.length === 0) {
    return (
      <div className={cn('rounded-lg bg-slate-50 p-8 text-center', className)}>
        <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {localComments.map((comment) => {
        const likeCount = comment.like_count || 0;
        const dislikeCount = comment.dislike_count || 0;
        const viewerReaction = comment.viewer_reaction || null;
        const isPending = pendingIds.has(comment.id);

        return (
          <div
            key={comment.id}
            className="rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                  <User className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-600">Anonymous</span>
              </div>
              <time className="text-xs text-slate-400">
                {formatRelativeTime(comment.created_at)}
              </time>
            </div>
            <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
              {comment.comment_text}
            </p>
            <div className="mt-4 flex items-center gap-4">
              <button
                type="button"
                onClick={() => updateReaction(comment.id, 'like')}
                disabled={isPending}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors',
                  viewerReaction === 'like'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                  viewerReaction === 'dislike'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                {dislikeCount}
              </button>
            </div>
          </div>
        );
      })}

      {canExpand && !isExpanded && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadAll}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading comments...' : 'View all comments'}
          </Button>
        </div>
      )}
    </div>
  );
};

export { CommentList };
