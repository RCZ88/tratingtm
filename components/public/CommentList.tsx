'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Comment } from '@/lib/types/database';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import { MessageSquare, User } from 'lucide-react';

/**
 * CommentList Component
 * 
 * Displays a list of approved comments with timestamps.
 */

export interface CommentListProps {
  comments: Array<Pick<Comment, 'id' | 'comment_text' | 'created_at'>>;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  isLoading = false,
  emptyMessage = 'No comments yet. Be the first to share your thoughts!',
  className,
}) => {
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

  if (comments.length === 0) {
    return (
      <div className={cn('rounded-lg bg-slate-50 p-8 text-center', className)}>
        <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
                <User className="h-4 w-4 text-indigo-600" />
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
        </div>
      ))}
    </div>
  );
};

export { CommentList };
