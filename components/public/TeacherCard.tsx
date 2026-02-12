'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { StarRatingDisplay } from '@/components/ui/StarRating';
import { TeacherWithStats } from '@/lib/types/database';
import { User, BookOpen } from 'lucide-react';
import { getAvatarStyle, getDepartmentBadgeStyle } from '@/lib/utils/teacherDisplay';

/**
 * TeacherCard Component
 * 
 * Displays teacher information in a card format with rating,
 * subject, and department. Links to teacher detail page.
 */

export interface TeacherCardProps {
  teacher: TeacherWithStats;
  className?: string;
  ratingMode?: 'weekly' | 'all_time';
}

const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  className,
  ratingMode = 'weekly',
}) => {
  const averageRating = teacher.average_rating || 0;
  const totalRatings = teacher.total_ratings || 0;
  const weeklyRating = teacher.weekly_average_rating ?? null;
  const weeklyCount = teacher.weekly_rating_count || 0;
  const primarySubject =
    teacher.primary_subject ||
    teacher.subjects?.[0]?.name ||
    null;
  const departmentName = teacher.department?.name || null;
  const departmentStyle = getDepartmentBadgeStyle(teacher.department?.color_hex || null);
  const isWeekly = ratingMode === 'weekly';
  const ratingLabel = isWeekly ? 'Weekly (Unique)' : 'All-Time (Total)';
  const displayRating = isWeekly ? weeklyRating : averageRating;
  const displayCount = isWeekly ? weeklyCount : totalRatings;

  return (
    <Link href={`/teachers/${teacher.id}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
          className
        )}
      >
        {/* Image */}
        <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-muted">
          {teacher.image_url ? (
            <Image
              src={teacher.image_url}
              alt={teacher.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center ${getAvatarStyle(teacher.name)}`}>
              <User className="h-12 w-12" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-emerald-700 dark:text-emerald-200 transition-colors line-clamp-1">
            {teacher.name}
          </h3>

          {primarySubject && (
            <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{primarySubject}</span>
            </div>
          )}

          {departmentName && (
            <div className="mt-2 flex justify-center">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${departmentStyle.className}`}
                style={departmentStyle.style}
              >
                {departmentName}
              </span>
            </div>
          )}

          {/* Ratings */}
          <div className="mt-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {ratingLabel}
            </div>
            {isWeekly && displayRating === null ? (
              <p className="text-xs text-muted-foreground">Not enough data</p>
            ) : (
              <div className="flex justify-center">
                <StarRatingDisplay
                  rating={displayRating ?? 0}
                  count={displayCount}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Comment count */}
          {teacher.total_comments !== undefined && teacher.total_comments > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {teacher.total_comments} comment{teacher.total_comments !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Hover overlay indicator */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      </div>
    </Link>
  );
};

export { TeacherCard };





