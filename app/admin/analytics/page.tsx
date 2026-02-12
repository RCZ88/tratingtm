'use client';

import * as React from 'react';
import { AnalyticsCard } from '@/components/admin/AnalyticsCard';
import { GrowthChart, type GrowthPoint } from '@/components/admin/GrowthChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  Users, 
  Star, 
  MessageSquare, 
  TrendingUp,
  Calendar,
  BarChart3
} from 'lucide-react';

/**
 * Analytics Dashboard Page
 * 
 * Detailed platform analytics and statistics.
 */

interface AnalyticsData {
  totalTeachers: number;
  totalRatings: number;
  totalComments: number;
  pendingComments: number;
  weeklyRatings: number;
  weeklyComments: number;
  topTeachers: Array<{
    id: string;
    name: string;
    overall_rating: number;
    total_ratings: number;
  }>;
  recentActivity: Array<{
    id: string;
    stars: number;
    created_at: string;
    teacher: { name: string };
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [growthData, setGrowthData] = React.useState<GrowthPoint[]>([]);
  const [isGrowthLoading, setIsGrowthLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const result = await response.json();

        if (response.ok) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  React.useEffect(() => {
    const fetchGrowth = async () => {
      try {
        const response = await fetch('/api/admin/growth?days=30');
        const result = await response.json();

        if (response.ok) {
          setGrowthData(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching growth data:', error);
      } finally {
        setIsGrowthLoading(false);
      }
    };

    fetchGrowth();
  }, []);

  const growthTotals = React.useMemo(() => {
    return growthData.reduce(
      (acc, point) => {
        acc.ratings += point.ratings;
        acc.comments += point.comments;
        return acc;
      },
      { ratings: 0, comments: 0 }
    );
  }, [growthData]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Platform performance and insights</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Total Teachers"
          value={data?.totalTeachers || 0}
          icon={<Users className="h-5 w-5" />}
        />
        <AnalyticsCard
          title="Total Ratings"
          value={(data?.totalRatings || 0).toLocaleString()}
          trend="up"
          trendValue={`+${data?.weeklyRatings || 0} this week`}
          icon={<Star className="h-5 w-5" />}
        />
        <AnalyticsCard
          title="Total Comments"
          value={(data?.totalComments || 0).toLocaleString()}
          trend="up"
          trendValue={`+${data?.weeklyComments || 0} this week`}
          icon={<MessageSquare className="h-5 w-5" />}
        />
        <AnalyticsCard
          title="Pending Moderation"
          value={data?.pendingComments || 0}
          trend={data?.pendingComments && data.pendingComments > 5 ? 'up' : 'neutral'}
          trendValue={data?.pendingComments && data.pendingComments > 0 ? 'Needs attention' : 'All caught up'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Detailed Stats */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Top Teachers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Rated Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.topTeachers && data.topTeachers.length > 0 ? (
              <div className="space-y-3">
                {data.topTeachers.map((teacher, index) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-medium text-emerald-600 dark:text-emerald-300">
                      {index + 1}
                    </span>
                      <div>
                        <p className="font-medium text-foreground">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {teacher.total_ratings} ratings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-foreground">
                        {teacher.overall_rating?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 10).map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {activity.teacher?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Rated {activity.stars} stars
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart Placeholder */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Platform Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            {isGrowthLoading ? (
              <div className="flex h-64 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : growthData.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Last 30 days
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ratings and comments submitted
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Ratings: {growthTotals.ratings}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                      Comments: {growthTotals.comments}
                    </span>
                  </div>
                </div>

                <div className="h-64">
                  <GrowthChart data={growthData} />
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-center">
                <div>
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No activity yet</p>
                  <p className="text-sm text-muted-foreground">
                    Growth charts will appear once ratings or comments are created
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




