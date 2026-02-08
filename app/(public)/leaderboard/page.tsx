'use client';

import * as React from 'react';
import { LeaderboardTable } from '@/components/public/LeaderboardTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Trophy, TrendingDown, Calendar } from 'lucide-react';
import { formatWeekRange, getRecentWeeks } from '@/lib/utils/dateHelpers';

/**
 * Leaderboard Page
 * 
 * Shows top and bottom rated teachers for the current week.
 */

interface LeaderboardEntry {
  id: string;
  name: string;
  subject: string | null;
  department: string | null;
  department_color_hex?: string | null;
  image_url: string | null;
  rating_count: number;
  average_rating: number | null;
  comment_count: number;
}

interface LeaderboardData {
  week_start: string;
  week_end: string;
  top: LeaderboardEntry[];
  bottom: LeaderboardEntry[];
  all: LeaderboardEntry[];
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedWeek, setSelectedWeek] = React.useState<string>('');

  const recentWeeks = getRecentWeeks(4);

  const fetchLeaderboard = React.useCallback(async (weekStart?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '10');
      if (weekStart) params.set('week_start', weekStart);

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
  }, []);

  React.useEffect(() => {
    fetchLeaderboard(selectedWeek);
  }, [fetchLeaderboard, selectedWeek]);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center relative overflow-hidden rounded-2xl bg-white px-6 py-8 shadow-sm">
          <div className="absolute inset-0 leaf-pattern opacity-40" />
          <div className="relative">
            <h1 className="text-3xl font-bold text-slate-900">Weekly Leaderboard</h1>
            <p className="mt-2 text-slate-600">
              See the top and bottom rated teachers this week
            </p>
          </div>
        </div>

        {/* Week Selector */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-sm">
            <Calendar className="h-5 w-5 text-slate-400" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
            >
              {recentWeeks.map((week) => (
                <option key={week.start.toISOString()} value={week.start.toISOString()}>
                  {week.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current Week Display */}
        {leaderboard && (
          <div className="mb-8 text-center">
            <p className="text-sm text-slate-500">
              {formatWeekRange(leaderboard.week_start, leaderboard.week_end)}
            </p>
          </div>
        )}

        {/* Leaderboards */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Top 10 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Trophy className="h-5 w-5" />
                Top 10 Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                entries={leaderboard?.top || []}
                isLoading={isLoading}
                type="top"
                limit={10}
              />
            </CardContent>
          </Card>

          {/* Bottom 10 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <TrendingDown className="h-5 w-5" />
                Bottom 10 Teachers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardTable
                entries={leaderboard?.bottom || []}
                isLoading={isLoading}
                type="bottom"
                limit={10}
              />
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <div className="mt-8 rounded-lg bg-emerald-50 p-4">
          <p className="text-sm text-emerald-800">
            <strong>Note:</strong> Rankings are based on average ratings for the current week.
            The leaderboard resets every Monday at midnight.
          </p>
        </div>
      </div>
    </div>
  );
}
