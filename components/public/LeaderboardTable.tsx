'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { StarRatingDisplay } from '@/components/ui/StarRating';
import { LeaderboardEntry } from '@/lib/types/database';
import { Trophy, Medal, Award, User, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * LeaderboardTable Component
 * 
 * Displays top and bottom ranked teachers in a table format.
 * Includes ranking indicators and trend icons.
 */

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  isLoading?: boolean;
  showRank?: boolean;
  limit?: number;
  type?: 'top' | 'bottom';
  className?: string;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  isLoading = false,
  showRank = true,
  limit = 10,
  type = 'top',
  className,
}) => {
  const displayEntries = entries.slice(0, limit);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-slate-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-slate-500">#{rank}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-slate-200 bg-white', className)}>
        <div className="animate-pulse space-y-2 p-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-8 w-8 rounded bg-slate-200" />
              <div className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-slate-200" />
                <div className="h-3 w-1/4 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayEntries.length === 0) {
    return (
      <div className={cn('rounded-xl border border-slate-200 bg-white p-8 text-center', className)}>
        <TrendingUp className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-slate-500">No rankings available for this period</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {showRank && (
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rank
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Teacher
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rating
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Reviews
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayEntries.map((entry, index) => {
              const rank = index + 1;
              const averageRating = entry.average_rating || 0;
              const ratingCount = entry.rating_count || 0;

              return (
                <tr
                  key={entry.id}
                  className="transition-colors hover:bg-slate-50"
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
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                        {entry.image_url ? (
                          <Image
                            src={entry.image_url}
                            alt={entry.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-indigo-100">
                            <User className="h-5 w-5 text-indigo-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {entry.name}
                        </p>
                        {entry.subject && (
                          <p className="text-xs text-slate-500">{entry.subject}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <StarRatingDisplay
                      rating={averageRating}
                      size="sm"
                      showCount={false}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-600">
                      {ratingCount} rating{ratingCount !== 1 ? 's' : ''}
                    </span>
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
