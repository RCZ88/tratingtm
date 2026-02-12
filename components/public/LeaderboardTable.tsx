'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { StarRatingDisplay } from '@/components/ui/StarRating';
import { LeaderboardEntry } from '@/lib/types/database';
import { Trophy, Medal, Award, User, TrendingUp, TrendingDown } from 'lucide-react';
import { getDepartmentBadgeStyle } from '@/lib/utils/teacherDisplay';

/**
 * LeaderboardTable Component
 * 
 * Displays top and bottom ranked teachers in a table format.
 * Includes ranking indicators and trend icons.
 */

type LeaderboardEntryWithDeptColor = LeaderboardEntry & {
  department_color_hex?: string | null;
  weekly_rating_count?: number;
  weekly_average_rating?: number | null;
};

export interface LeaderboardTableProps {
  entries: LeaderboardEntryWithDeptColor[];
  isLoading?: boolean;
  showRank?: boolean;
  limit?: number;
  type?: 'top' | 'bottom';
  className?: string;
  ratingMode?: 'weekly' | 'all_time';
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  isLoading = false,
  showRank = true,
  limit = 10,
  type = 'top',
  className,
  ratingMode = 'weekly',
}) => {
  const displayEntries = typeof limit === 'number' ? entries.slice(0, limit) : entries;
  const isWeekly = ratingMode === 'weekly';
  const ratingHeader = isWeekly ? 'Weekly Rating' : 'All-Time Rating';
  const countHeader = isWeekly ? 'Weekly Votes' : 'All-Time Votes';

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-border bg-card', className)}>
        <div className="animate-pulse space-y-2 p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-3 w-1/4 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayEntries.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-8 text-center', className)}>
        <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-muted-foreground">No rankings available for this period</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              {showRank && (
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rank
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Teacher
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {ratingHeader}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {countHeader}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayEntries.map((entry, index) => {
              const rank = index + 1;
              const averageRating = entry.average_rating || 0;
              const ratingCount = entry.rating_count || 0;
              const weeklyRating = entry.weekly_average_rating ?? null;
              const weeklyCount = entry.weekly_rating_count || 0;
              const displayRating = isWeekly ? weeklyRating : averageRating;
              const displayCount = isWeekly ? weeklyCount : ratingCount;
              const deptStyle = getDepartmentBadgeStyle(entry.department_color_hex || null);

              return (
                <tr
                  key={entry.id}
                  className="transition-colors hover:bg-muted"
                >
                  {showRank && (
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex h-8 w-8 items-center justify-center">
                        {getRankIcon(rank)}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-4">
                    <Link
                      href={`/teachers/${entry.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                        {entry.image_url ? (
                          <Image
                            src={entry.image_url}
                            alt={entry.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-emerald-500/15">
                            <User className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-emerald-700 dark:text-emerald-200 transition-colors">
                          {entry.name}
                        </p>
                        {entry.subject && (
                          <p className="text-xs text-muted-foreground">{entry.subject}</p>
                        )}
                        {entry.department && (
                          <span
                            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${deptStyle.className}`}
                            style={deptStyle.style}
                          >
                            {entry.department}
                          </span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    {isWeekly && displayRating === null ? (
                      <p className="text-xs text-muted-foreground">Not enough data</p>
                    ) : (
                      <StarRatingDisplay
                        rating={displayRating ?? 0}
                        size="sm"
                        showCount={false}
                      />
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-muted-foreground">
                      {displayCount} rating{displayCount !== 1 ? 's' : ''}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { LeaderboardTable };







