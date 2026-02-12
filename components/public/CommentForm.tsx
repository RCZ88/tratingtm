'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { HighlightedTextarea } from '@/components/ui/HighlightedTextarea';
import { Button } from '@/components/ui/Button';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { CheckCircle, Info } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { findProfanityMatches, type ProfanityMatch } from '@/lib/utils/profanity';

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
  requiresApproval: boolean | null;
}

const CommentForm: React.FC<CommentFormProps> = ({ teacherId, onSuccess, className }) => {
  const [state, setState] = React.useState<FormState>({
    comment: '',
    isSubmitting: false,
    error: null,
    success: false,
    requiresApproval: null,
  });
  const [bannedWords, setBannedWords] = React.useState<string[]>([]);
  const [matches, setMatches] = React.useState<ProfanityMatch[]>([]);
  const [flaggedWords, setFlaggedWords] = React.useState<string[]>([]);
  const [showModal, setShowModal] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const fetchBannedWords = async () => {
      try {
        const response = await fetch('/api/banned-words');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load banned words');
        }
        if (active) {
          setBannedWords(Array.isArray(data.data) ? data.data : []);
        }
      } catch (error) {
        if (active) {
          setBannedWords([]);
        }
      }
    };

    fetchBannedWords();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!state.comment.trim() || bannedWords.length === 0) {
      setMatches([]);
      setFlaggedWords([]);
      return;
    }
    const result = findProfanityMatches(state.comment, bannedWords);
    setMatches(result.matches);
    setFlaggedWords(result.flaggedWords);
  }, [state.comment, bannedWords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (flaggedWords.length > 0) {
      setShowModal(true);
      return;
    }

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
        const details = Array.isArray(data.details) ? data.details.join(', ') : '';
        if (data?.flaggedWords?.length) {
          setFlaggedWords(data.flaggedWords);
          setShowModal(true);
          throw new Error('Inappropriate language detected');
        }
        throw new Error(details ? `${data.error}: ${details}` : data.error || 'Failed to submit comment');
      }

      setState((prev) => ({
        ...prev,
        success: true,
        isSubmitting: false,
        comment: '',
        requiresApproval: typeof data.requires_approval === 'boolean' ? data.requires_approval : null,
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
      <div className={cn('rounded-lg bg-green-500/10 dark:bg-green-500/20 p-4', className)}>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">
              {state.requiresApproval === false ? 'Comment Posted!' : 'Comment Submitted!'}
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              {state.requiresApproval === false
                ? 'Your comment is now visible.'
                : 'Your comment is pending moderation and will appear once approved.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <HighlightedTextarea
        label="Leave a comment"
        placeholder="Share your experience with this teacher..."
        value={state.comment}
        onChange={(e) =>
          setState((prev) => ({ ...prev, comment: e.target.value, error: null }))
        }
        maxLength={500}
        showCharacterCount
        rows={4}
        helperText="Minimum 10 characters required."
        error={state.error || undefined}
        highlightRanges={matches}
      />

      {flaggedWords.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 dark:bg-red-500/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          Please remove inappropriate words before submitting.
        </div>
      )}

      <div className="flex items-start gap-2 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 p-3">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-300 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Comments are moderated before being published. Please be respectful and constructive.
        </p>
      </div>

      <Button
        type="submit"
        isLoading={state.isSubmitting}
        disabled={state.comment.trim().length < 10 || flaggedWords.length > 0}
        fullWidth
        variant="secondary"
      >
        Submit Comment
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Inappropriate language detected"
        description="Please remove the highlighted words before submitting."
        size="sm"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            {flaggedWords.map((word) => (
              <span
                key={word}
                className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300"
              >
                {word}
              </span>
            ))}
          </div>
          <Button fullWidth onClick={() => setShowModal(false)}>
            OK
          </Button>
        </div>
      </Modal>
    </form>
  );
};

export { CommentForm };


