'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { CheckCircle, Info } from 'lucide-react';

/**
 * CommentForm Component
 * 
 * Form for submitting anonymous comments about teachers.
 * Includes character counting and moderation notice.
 */

export interface CommentFormProps {
  teacherId: string;
  onSuccess?: () => void;
  className?: string;
}

interface FormState {
  comment: string;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ teacherId, onSuccess, className }) => {
  const [state, setState] = React.useState<FormState>({
    comment: '',
    isSubmitting: false,
    error: null,
    success: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (state.comment.trim().length < 10) {
      setState((prev) => ({
        ...prev,
        error: 'Comment must be at least 10 characters',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const anonymousId = getAnonymousId();
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          comment_text: state.comment.trim(),
          anonymous_id: anonymousId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit comment');
      }

      setState((prev) => ({
        ...prev,
        success: true,
        isSubmitting: false,
        comment: '',
      }));

      onSuccess?.();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        isSubmitting: false,
      }));
    }
  };

  if (state.success) {
    return (
      <div className={cn('rounded-lg bg-green-50 p-4', className)}>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">Comment Submitted!</p>
            <p className="text-sm text-green-700">
              Your comment is pending moderation and will appear once approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <Textarea
        label="Leave a comment"
        placeholder="Share your experience with this teacher..."
        value={state.comment}
        onChange={(e) =>
          setState((prev) => ({ ...prev, comment: e.target.value, error: null }))
        }
        maxLength={500}
        showCharacterCount
        rows={4}
        error={state.error || undefined}
      />

      <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Comments are moderated before being published. Please be respectful and constructive.
        </p>
      </div>

      <Button
        type="submit"
        isLoading={state.isSubmitting}
        disabled={state.comment.trim().length < 10}
        fullWidth
        variant="secondary"
      >
        Submit Comment
      </Button>
    </form>
  );
};

export { CommentForm };
