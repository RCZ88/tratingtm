/**
 * Date Helper Utilities
 * 
 * Functions for calculating week ranges, formatting dates,
 * and handling leaderboard time periods.
 */

import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek, parseISO } from 'date-fns';

/**
 * Gets the start of the current week (Monday)
 */
export function getCurrentWeekStart(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

/**
 * Gets the end of the current week (Sunday)
 */
export function getCurrentWeekEnd(): Date {
  return endOfWeek(new Date(), { weekStartsOn: 1 });
}

/**
 * Gets the week range for a given date
 */
export function getWeekRange(date: Date | string): { start: Date; end: Date } {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return {
    start: startOfWeek(d, { weekStartsOn: 1 }),
    end: endOfWeek(d, { weekStartsOn: 1 }),
  };
}

/**
 * Formats a date for display
 */
export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

/**
 * Formats a week range for display
 */
export function formatWeekRange(startDate: Date | string, endDate?: Date | string): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = endDate
    ? typeof endDate === 'string' ? parseISO(endDate) : endDate
    : endOfWeek(start, { weekStartsOn: 1 });

  const startFormatted = format(start, 'MMM d');
  const endFormatted = format(end, 'MMM d, yyyy');

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Gets the previous week's start date
 */
export function getPreviousWeekStart(date: Date = new Date()): Date {
  return startOfWeek(subWeeks(date, 1), { weekStartsOn: 1 });
}

/**
 * Gets the next week's start date
 */
export function getNextWeekStart(date: Date = new Date()): Date {
  return startOfWeek(addWeeks(date, 1), { weekStartsOn: 1 });
}

/**
 * Checks if a date is in the current week
 */
export function isCurrentWeek(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isSameWeek(d, new Date(), { weekStartsOn: 1 });
}

/**
 * Gets a list of recent weeks for leaderboard selection
 */
export function getRecentWeeks(count: number = 4): Array<{ start: Date; end: Date; label: string }> {
  const weeks = [];
  let currentDate = new Date();

  for (let i = 0; i < count; i++) {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    weeks.push({
      start: weekStart,
      end: weekEnd,
      label: i === 0 ? 'This Week' : i === 1 ? 'Last Week' : formatWeekRange(weekStart, weekEnd),
    });

    currentDate = subWeeks(currentDate, 1);
  }

  return weeks;
}

/**
 * Formats a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }

  return format(d, 'MMM d, yyyy');
}

/**
 * Converts a date to ISO string for database storage
 */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
