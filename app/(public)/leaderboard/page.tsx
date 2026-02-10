'use client';

import * as React from 'react';
import { LeaderboardTable } from '@/components/public/LeaderboardTable';
import { RatingExplainer } from '@/components/public/RatingExplainer';
import { WeeklyResetCountdown } from '@/components/public/WeeklyResetCountdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trophy, Calendar, ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react';
import { formatWeekRange, getRecentWeeks, toISODate } from '@/lib/utils/dateHelpers';
import { Department } from '@/lib/types/database';

interface LeaderboardEntry {
  id: string;
  name: string;
  subject: string | null;
  department: string | null;
  department_color_hex?: string | null;
  image_url: string | null;
  rating_count: number;
  average_rating: number | null;
  weekly_rating_count?: number;
  weekly_average_rating?: number | null;
  comment_count: number;
}

interface LeaderboardData {
  period?: 'weekly_unique' | 'all_time';
  type?: 'overall' | 'department' | 'year_level';
  week_start?: string | null;
  week_end?: string | null;
  items: LeaderboardEntry[];
}

const YEAR_LEVELS = [7, 8, 9, 10, 11, 12];

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<'weekly_unique' | 'all_time'>('all_time');
  const [type, setType] = React.useState<'overall' | 'department' | 'year_level'>('overall');
  const [sortDirection, setSortDirection] = React.useState<'desc' | 'asc'>('desc');
  const recentWeeks = React.useMemo(() => getRecentWeeks(4), []);
  const [selectedWeek, setSelectedWeek] = React.useState<string>(
    () => toISODate(recentWeeks[0].start)
  );
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = React.useState(false);
  const [departmentId, setDepartmentId] = React.useState('');
  const [yearLevel, setYearLevel] = React.useState<number>(YEAR_LEVELS[0]);

  const ratingMode = period === 'weekly_unique' ? 'weekly' : 'all_time';

  React.useEffect(() => {
    let active = true;
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const response = await fetch('/api/departments');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load departments');
        }
        if (active) {
          setDepartments(data.data || []);
          if (!departmentId && data.data?.length) {
            setDepartmentId(data.data[0].id);
          }
        }
      } catch (error) {
        if (active) {
          setDepartments([]);
        }
      } finally {
        if (active) {
          setIsLoadingDepartments(false);
        }
      }
    };

    fetchDepartments();
    return () => {
      active = false;
    };
  }, []);

  const fetchLeaderboard = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('period', period);
      params.set('type', type);
      params.set('sort', sortDirection);
      if (period === 'weekly_unique' && selectedWeek) {
        params.set('week_start', selectedWeek);
      }
      if (type === 'department' && departmentId) {
        params.set('department_id', departmentId);
      }
      if (type === 'year_level') {
        params.set('year_level', yearLevel.toString());
      }

      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period, type, sortDirection, selectedWeek, departmentId, yearLevel]);

  React.useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center relative overflow-hidden rounded-2xl bg-white px-6 py-8 shadow-sm">
          <div className="absolute inset-0 leaf-pattern opacity-40" />
          <div className="relative">
            <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
            <p className="mt-2 text-slate-600">
              Compare ratings across the school community
            </p>
          </div>
        </div>        <div className="mb-6">
          <WeeklyResetCountdown />
        </div>

        {/* Controls */}
        <div className="mb-8 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {['overall', 'department', 'year_level'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option as typeof type)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    type === option
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {option === 'overall'
                    ? 'Overall'
                    : option === 'department'
                    ? 'Department'
                    : 'Year Level'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setPeriod('weekly_unique')}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    period === 'weekly_unique'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  Weekly (Unique)
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('all_time')}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    period === 'all_time'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  All-Time
                </button>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
                }
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm hover:border-emerald-300"
              >
                {sortDirection === 'desc' ? (
                  <ArrowDownWideNarrow className="h-4 w-4" />
                ) : (
                  <ArrowUpWideNarrow className="h-4 w-4" />
                )}
                {sortDirection === 'desc' ? 'Best → Worst' : 'Worst → Best'}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {type === 'department' && (
              <div className="min-w-[220px]">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {isLoadingDepartments && <option>Loading...</option>}
                  {!isLoadingDepartments && departments.length === 0 && (
                    <option value="">No departments</option>
                  )}
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {type === 'year_level' && (
              <div className="min-w-[160px]">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Year Level
                </label>
                <select
                  value={yearLevel}
                  onChange={(e) => setYearLevel(parseInt(e.target.value, 10))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                >
                  {YEAR_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      Year {level}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {period === 'weekly_unique' && (
              <div className="min-w-[220px]">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Week
                </label>
                <div className="inline-flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <select
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
                  >
                    {recentWeeks.map((week) => (
                      <option key={week.start.toISOString()} value={toISODate(week.start)}>
                        {week.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-8">
          <RatingExplainer className="mx-auto max-w-3xl" />
        </div>

        {period === 'weekly_unique' && leaderboard?.week_start && leaderboard?.week_end && (
          <div className="mb-6 text-center text-sm text-slate-500">
            {formatWeekRange(leaderboard.week_start, leaderboard.week_end)}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Trophy className="h-5 w-5" />
              {type === 'overall'
                ? 'Overall Leaderboard'
                : type === 'department'
                ? 'Department Leaderboard'
                : 'Year Level Leaderboard'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10">
                <LoadingSpinner size="md" text="Loading leaderboard..." />
              </div>
            ) : (
              <LeaderboardTable
                entries={leaderboard?.items || []}
                isLoading={false}
                limit={50}
                ratingMode={ratingMode}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



