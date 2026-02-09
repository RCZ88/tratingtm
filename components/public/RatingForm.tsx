'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { CheckCircle, AlertCircle } from 'lucide-react';

/**
 * RatingForm Component
 * 
 * Interactive form for submitting teacher ratings.
 * Includes star selector and duplicate submission prevention.
 */

export interface RatingFormProps {
  teacherId: string;
  onSuccess?: () => void;
  className?: string;
}

interface FormState {
  rating: number;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
  hasRatedThisWeek: boolean;
  updatedWeekly: boolean;
}

const RatingForm: React.FC<RatingFormProps> = ({ teacherId, onSuccess, className }) => {
  const [state, setState] = React.useState<FormState>({
    rating: 0,
    isSubmitting: false,
    error: null,
    success: false,
    hasRatedThisWeek: false,
    updatedWeekly: false,
  });

  // Check if user has already rated this teacher
  React.useEffect(() => {
    const checkExistingRating = async () => {
      try {
        const anonymousId = getAnonymousId();
        const response = await fetch(
          `/api/ratings?teacher_id=${teacherId}&anonymous_id=${anonymousId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.hasRated) {
            setState((prev) => ({ ...prev, hasRatedThisWeek: true }));
          }
        }
      } catch (error) {
        console.error('Error checking existing rating:', error);
      }
    };

    checkExistingRating();
  }, [teacherId]);

  const handleRatingChange = (rating: number) => {
    setState((prev) => ({ ...prev, rating, error: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (state.rating === 0) {
      setState((prev) => ({ ...prev, error: 'Please select a rating' }));
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const anonymousId = getAnonymousId();
      
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacher_id: teacherId,
          stars: state.rating,
          anonymous_id: anonymousId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      setState((prev) => ({
        ...prev,
        success: true,
        updatedWeekly: !!data.weeklyUpdated,
        isSubmitting: false,
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
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Thank You!</p>
            <p className="text-sm text-green-700">
              {state.updatedWeekly
                ? 'Your weekly rating has been updated.'
                : 'Your rating has been submitted successfully.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Rate this teacher
        </label>
        <StarRating
          value={state.rating}
          onChange={handleRatingChange}
          size="lg"
        />
      </div>

      {state.error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {state.hasRatedThisWeek && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          You have already rated this teacher this week. Submitting again will update
          your weekly rating.
        </div>
      )}

      <Button
        type="submit"
        isLoading={state.isSubmitting}
        disabled={state.rating === 0}
        fullWidth
      >
        Submit Rating
      </Button>

      <p className="text-xs text-center text-slate-500">
        Your rating is anonymous. You can update your weekly rating once per week.
      </p>
    </form>
  );
};

export { RatingForm };
