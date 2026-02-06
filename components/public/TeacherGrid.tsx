'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { TeacherCard } from './TeacherCard';
import { TeacherWithStats } from '@/lib/types/database';
import { LoadingSpinner, CardSkeleton } from '@/components/ui/LoadingSpinner';

/**
 * TeacherGrid Component
 * 
 * Displays a grid of teacher cards with loading and empty states.
 * Supports pagination and responsive layout.
 */

export interface TeacherGridProps {
  teachers: TeacherWithStats[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  columns?: 2 | 3 | 4;
}

const TeacherGrid: React.FC<TeacherGridProps> = ({
  teachers,
  isLoading = false,
  emptyMessage = 'No teachers found',
  className,
  columns = 3,
}) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-6', gridCols[columns], className)}>
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16', className)}>
        <div className="rounded-full bg-slate-100 p-6">
          <svg
            className="h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-slate-900">{emptyMessage}</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6', gridCols[columns], className)}>
      {teachers.map((teacher) => (
        <TeacherCard key={teacher.id} teacher={teacher} />
      ))}
    </div>
  );
};

export { TeacherGrid };
