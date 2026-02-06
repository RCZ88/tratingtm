'use client';

import * as React from 'react';
import Link from 'next/link';
import { StatsOverview } from '@/components/admin/StatsOverview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Users, 
  MessageSquare, 
  BarChart3, 
  Plus, 
  TrendingUp,
  Clock
} from 'lucide-react';

/**
 * Admin Dashboard Page
 * 
 * Overview of platform statistics and quick actions.
 */

interface DashboardStats {
  totalTeachers: number;
  totalRatings: number;
  totalComments: number;
  pendingComments: number;
  weeklyRatings: number;
  weeklyComments: number;
  topTeachers: Array<{
    id: string;
    name: string;
    overall_rating: number | null;
  }>;
  recentActivity: Array<{
    id: string;
    stars: number;
    created_at: string;
    teacher?: { name: string | null };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();

        if (response.ok) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      label: 'Add Teacher',
      href: '/admin/teachers/new',
      icon: Plus,
      variant: 'primary' as const,
    },
    {
      label: 'Moderate Comments',
      href: '/admin/moderation',
      icon: MessageSquare,
      variant: 'secondary' as const,
    },
    {
      label: 'View Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      variant: 'outline' as const,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats || {
        totalTeachers: 0,
        totalRatings: 0,
        totalComments: 0,
        pendingComments: 0,
        weeklyRatings: 0,
        weeklyComments: 0,
        topTeachers: [],
        recentActivity: [],
      }} isLoading={isLoading} />

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button
                variant={action.variant}
                fullWidth
                leftIcon={<action.icon className="h-4 w-4" />}
              >
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner />
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 5).map((activity: any) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {activity.teacher?.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        Rated {activity.stars} stars
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Rated Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner />
            ) : stats?.topTeachers && stats.topTeachers.length > 0 ? (
              <div className="space-y-3">
                {stats.topTeachers.slice(0, 5).map((teacher: any, index: number) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                        {index + 1}
                      </span>
                      <p className="font-medium text-slate-900">{teacher.name}</p>
                    </div>
                    <span className="text-sm font-medium text-amber-500">
                      {teacher.overall_rating?.toFixed(1) || 'N/A'} ★
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
