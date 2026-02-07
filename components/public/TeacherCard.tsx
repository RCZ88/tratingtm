'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { StarRatingDisplay } from '@/components/ui/StarRating';
import { TeacherWithStats } from '@/lib/types/database';
import { User, BookOpen } from 'lucide-react';
import { getAvatarStyle } from '@/lib/utils/teacherDisplay';

/**
 * TeacherCard Component
 * 
 * Displays teacher information in a card format with rating,
 * subject, and department. Links to teacher detail page.
 */

export interface TeacherCardProps {
  teacher: TeacherWithStats;
  className?: string;
}

const TeacherCard: React.FC<TeacherCardProps> = ({ teacher, className }) => {
  const averageRating = teacher.average_rating || 0;
  const totalRatings = teacher.total_ratings || 0;

  return (
    <Link href={`/teachers/${teacher.id}`}>
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg',
          className
        )}
      >
        {/* Image */}
        <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-slate-100">
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
          <h3 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
            {teacher.name}
          </h3>

          {teacher.subject && (
            <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-slate-500">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{teacher.subject}</span>
            </div>
          )}

          {teacher.department && (
            <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
              {teacher.department}
            </p>
          )}

          {/* Rating */}
          <div className="mt-3 flex justify-center">
            <StarRatingDisplay
              rating={averageRating}
              count={totalRatings}
              size="sm"
            />
          </div>

          {/* Comment count */}
          {teacher.total_comments !== undefined && teacher.total_comments > 0 && (
            <p className="mt-2 text-xs text-slate-400">
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
