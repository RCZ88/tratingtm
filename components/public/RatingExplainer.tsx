'use client';

import * as React from 'react';
import { CalendarDays, History, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface RatingExplainerProps {
  className?: string;
  showTitle?: boolean;
}

const RatingExplainer: React.FC<RatingExplainerProps> = ({
  className,
  showTitle = true,
}) => {
  return (
    <div className={cn('rounded-lg border border-border bg-muted px-4 py-3', className)}>
      {showTitle && (
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          How ratings work
        </div>
      )}
      <ul className={cn('mt-2 grid gap-2 text-sm text-muted-foreground', !showTitle && 'mt-0')}>
        <li className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          <span>
            <strong className="text-foreground">Weekly</strong> - shows ratings from this week only; resets every Monday.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <History className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <span>
            <strong className="text-foreground">All-Time</strong> - combines every rating ever submitted.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-600" />
          <span>
            <strong className="text-foreground">Not enough data</strong> - appears when a teacher has fewer than 3 weekly ratings.
          </span>
        </li>
      </ul>
    </div>
  );
};

export { RatingExplainer };




