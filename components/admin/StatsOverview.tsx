'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { AnalyticsCard, type AnalyticsCardProps } from './AnalyticsCard';
import { Users, Star, MessageSquare, TrendingUp } from 'lucide-react';

/**
 * StatsOverview Component
 * 
 * Displays a grid of key platform statistics.
 */

export interface StatsOverviewProps {
  stats: {
    totalTeachers: number;
    totalRatings: number;
    totalComments: number;
    pendingComments: number;
    weeklyRatings?: number;
    weeklyComments?: number;
  };
  isLoading?: boolean;
  className?: string;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ stats, isLoading = false, className }) => {
  if (isLoading) {
    return (
      <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-4', className)}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="animate-pulse rounded-xl bg-muted p-6">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="mt-2 h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const cards: AnalyticsCardProps[] = [
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: <Users className="h-5 w-5" />,
      trend: 'neutral' as const,
    },
    {
      title: 'Total Ratings',
      value: stats.totalRatings.toLocaleString(),
      subtitle: `${stats.weeklyRatings || 0} this week`,
      icon: <Star className="h-5 w-5" />,
      trend: (stats.weeklyRatings || 0) > 0 ? 'up' : 'neutral' as const,
      trendValue: `+${stats.weeklyRatings || 0}`,
    },
    {
      title: 'Total Comments',
      value: stats.totalComments.toLocaleString(),
      subtitle: `${stats.weeklyComments || 0} this week`,
      icon: <MessageSquare className="h-5 w-5" />,
      trend: (stats.weeklyComments || 0) > 0 ? 'up' : 'neutral' as const,
      trendValue: `+${stats.weeklyComments || 0}`,
    },
    {
      title: 'Pending Moderation',
      value: stats.pendingComments,
      icon: <TrendingUp className="h-5 w-5" />,
      trend: stats.pendingComments > 5 ? 'up' : 'neutral' as const,
      trendValue: stats.pendingComments > 0 ? 'Needs attention' : 'All caught up',
    },
  ];

  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {cards.map((card) => (
        <AnalyticsCard
          key={card.title}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          icon={card.icon}
          trend={card.trend}
          trendValue={card.trendValue}
        />
      ))}
    </div>
  );
};

export { StatsOverview };

