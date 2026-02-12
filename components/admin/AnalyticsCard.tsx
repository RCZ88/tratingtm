'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * AnalyticsCard Component
 * 
 * Displays a single analytics metric with title, value, and trend indicator.
 */

export interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  subtitle,
  trend = 'neutral',
  trendValue,
  icon,
  className,
}) => {
  const trendIcons = {
    up: <TrendingUp className="h-4 w-4 text-green-500" />,
    down: <TrendingDown className="h-4 w-4 text-red-500" />,
    neutral: <Minus className="h-4 w-4 text-muted-foreground" />,
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600 dark:text-red-300',
    neutral: 'text-muted-foreground',
  };

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
          {icon}
        </div>
        )}
      </div>

      {trendValue && (
        <div className="mt-4 flex items-center gap-2">
          {trendIcons[trend]}
          <span className={cn('text-sm font-medium', trendColors[trend])}>
            {trendValue}
          </span>
          <span className="text-sm text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
};

export { AnalyticsCard };






