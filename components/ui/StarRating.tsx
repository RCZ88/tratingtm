'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Star } from 'lucide-react';

/**
 * StarRating Component
 * 
 * Interactive 5-star rating component with hover preview and click selection.
 * Supports both interactive (input) and read-only (display) modes.
 */

export interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  showValue?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  value,
  onChange,
  maxStars = 5,
  size = 'md',
  readOnly = false,
  showValue = false,
  className,
}) => {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleMouseEnter = (starIndex: number) => {
    if (readOnly) return;
    setHoverValue(starIndex);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverValue(null);
  };

  const handleClick = (starIndex: number) => {
    if (readOnly) return;
    onChange?.(starIndex);
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex gap-0.5">
        {Array.from({ length: maxStars }, (_, index) => {
          const starIndex = index + 1;
          const isFilled = starIndex <= displayValue;
          const isHalfFilled = !isFilled && starIndex - 0.5 <= displayValue;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(starIndex)}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              className={cn(
                'transition-all duration-150',
                !readOnly && 'cursor-pointer hover:scale-110',
                readOnly && 'cursor-default'
              )}
              aria-label={`Rate ${starIndex} stars`}
            >
              <Star
                className={cn(
                  sizes[size],
                  'transition-colors duration-150',
                  isFilled || isHalfFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-muted-foreground',
                  !readOnly && 'hover:text-amber-400'
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
};

/**
 * Compact star rating display for lists and cards
 */
export interface StarRatingDisplayProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const StarRatingDisplay: React.FC<StarRatingDisplayProps> = ({
  rating,
  count,
  size = 'sm',
  showCount = true,
  className,
}) => {
  const sizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= Math.round(rating);

          return (
            <Star
              key={index}
              className={cn(
                sizes[size],
                isFilled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-muted-foreground'
              )}
            />
          );
        })}
      </div>
      <span className="text-sm font-medium text-foreground">
        {rating.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className="text-sm text-muted-foreground">({count})</span>
      )}
    </div>
  );
};

export { StarRating };

