'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { CommentWithTeacher } from '@/lib/types/database';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import { Check, X, Flag, User, MessageSquare } from 'lucide-react';

/**
 * ModerationQueue Component
 * 
 * Displays pending comments for admin approval/rejection.
 * Supports bulk actions and filtering.
 */

export interface ModerationQueueProps {
  comments: CommentWithTeacher[];
  isLoading?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onFlag?: (id: string) => void;
  className?: string;
}

const ModerationQueue: React.FC<ModerationQueueProps> = ({
  comments,
  isLoading = false,
  onApprove,
  onReject,
  onFlag,
  className,
}) => {
  const [selectedComments, setSelectedComments] = React.useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedComments);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedComments(newSelection);
  };

  const selectAll = () => {
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map((c) => c.id)));
    }
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="h-4 w-4 rounded bg-muted" />
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 rounded bg-muted" />
                <div className="h-16 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-12 text-center', className)}>
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-foreground">No pending comments</h3>
        <p className="mt-1 text-muted-foreground">
          All comments have been moderated. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Bulk Actions */}
      {selectedComments.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-3">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-200">
            {selectedComments.size} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              selectedComments.forEach((id) => onApprove?.(id));
              setSelectedComments(new Set());
            }}
          >
            Approve All
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 dark:text-red-300 hover:text-red-700 dark:text-red-300"
            onClick={() => {
              selectedComments.forEach((id) => onReject?.(id));
              setSelectedComments(new Set());
            }}
          >
            Reject All
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={cn(
              'rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm',
              selectedComments.has(comment.id) && 'border-emerald-300 bg-emerald-500/10'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedComments.has(comment.id)}
                onChange={() => toggleSelection(comment.id)}
                className="mt-1 h-4 w-4 rounded border-border text-emerald-600 dark:text-emerald-300 focus:ring-emerald-500"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                      <User className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                    </div>
                    <div>
                      {comment.teacher && (
                        <p className="font-medium text-foreground">
                          {comment.teacher.name}
                        </p>
                      )}
                      <time className="text-xs text-muted-foreground">
                        {formatRelativeTime(comment.created_at)}
                      </time>
                    </div>
                  </div>
                </div>

                {/* Comment Text */}
                <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">
                  {comment.comment_text}
                </p>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Check className="h-4 w-4" />}
                    onClick={() => onApprove?.(comment.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<X className="h-4 w-4" />}
                    onClick={() => onReject?.(comment.id)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Flag className="h-4 w-4" />}
                    onClick={() => onFlag?.(comment.id)}
                  >
                    Flag
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { ModerationQueue };








