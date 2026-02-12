export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/public/SearchBar';
import {
  Star,
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Sparkles,
  BarChart3,
  ThumbsUp
} from 'lucide-react';
import { ActivityFeed, type ActivityItem } from '@/components/public/ActivityFeed';
import { UpdateBannerCarousel } from '@/components/public/UpdateBannerCarousel';

/**
 * Homepage
 * 
 * Hero section with search, quick stats, and featured teachers.
 */
export default async function HomePage() {
  const supabase = createClient();

  // Fetch stats
  const { count: teacherCount } = await supabase
    .from('teachers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: ratingCount } = await supabase
    .from('ratings')
    .select('*', { count: 'exact', head: true });

  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', true);

  const [
    popularTeacherResult,
    mostRatedResult,
    mostCommentedResult,
    ratingSummaryResult,
    topLikedCommentResult,
  ] = await Promise.all([
    supabase
      .from('teacher_popularity')
      .select('*')
      .gt('total_interactions', 0)
      .order('total_interactions', { ascending: false })
      .limit(1),
    supabase
      .from('teacher_stats')
      .select('id, name, total_ratings')
      .gt('total_ratings', 0)
      .order('total_ratings', { ascending: false })
      .limit(1),
    supabase
      .from('teacher_stats')
      .select('id, name, total_comments')
      .gt('total_comments', 0)
      .order('total_comments', { ascending: false })
      .limit(1),
    supabase
      .from('rating_summary')
      .select('*')
      .maybeSingle(),
    supabase
      .from('top_liked_comment')
      .select('*')
      .maybeSingle(),
  ]);

  const mostPopularTeacher = popularTeacherResult.data?.[0] ?? null;
  const mostRatedTeacher = mostRatedResult.data?.[0] ?? null;
  const mostCommentedTeacher = mostCommentedResult.data?.[0] ?? null;
  const ratingSummary = ratingSummaryResult.data;
  const topLikedComment = topLikedCommentResult.data;

  const averageRating = ratingSummary?.average_rating
    ? Number(ratingSummary.average_rating)
    : null;

  const factCards = [
    {
      title: 'Most Popular Teacher',
      value: mostPopularTeacher?.name || 'No data yet',
      teacherId: mostPopularTeacher?.id || null,
      detail: mostPopularTeacher
        ? `${mostPopularTeacher.total_interactions} interactions`
        : 'Waiting for ratings and comments',
      icon: Sparkles,
      style: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
    },
    {
      title: 'Most Rated Teacher',
      value: mostRatedTeacher?.name || 'No ratings yet',
      teacherId: mostRatedTeacher?.id || null,
      detail: mostRatedTeacher
        ? `${mostRatedTeacher.total_ratings} ratings`
        : 'No ratings submitted',
      icon: Star,
      style: 'border-teal-200 bg-teal-500/10 dark:bg-teal-500/20/70 text-teal-700 dark:text-teal-200',
    },
    {
      title: 'Most Commented Teacher',
      value: mostCommentedTeacher?.name || 'No comments yet',
      teacherId: mostCommentedTeacher?.id || null,
      detail: mostCommentedTeacher
        ? `${mostCommentedTeacher.total_comments} comments`
        : 'No comments submitted',
      icon: MessageSquare,
      style: 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/20/70 text-amber-700 dark:text-amber-200',
    },
    {
      title: 'Overall Average Rating',
      value: averageRating ? `${averageRating.toFixed(2)} / 5` : 'N/A',
      teacherId: null,
      detail: ratingCount ? `${ratingCount.toLocaleString()} total ratings` : 'No ratings yet',
      icon: BarChart3,
      style: 'border-sky-200 bg-sky-500/10 dark:bg-sky-500/20/70 text-sky-700 dark:text-sky-200',
    },
  ];

  const shouldShowLikedComment =
    topLikedComment && Number(topLikedComment.like_count || 0) > 0;

  const likedCommentPreview = shouldShowLikedComment
    ? topLikedComment.comment_text.length > 140
      ? `${topLikedComment.comment_text.slice(0, 140)}...`
      : topLikedComment.comment_text
    : '';

  const stats = [
    { label: 'Teachers', value: teacherCount || 0, icon: Users },
    { label: 'Ratings', value: ratingCount || 0, icon: Star },
    { label: 'Comments', value: commentCount || 0, icon: MessageSquare },
  ];

  const { data: activityRatings } = await supabase
    .from('ratings')
    .select('id, teacher_id, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: activityComments } = await supabase
    .from('comments')
    .select('id, teacher_id, created_at')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20);

  const initialActivity = [
    ...(activityRatings || []).map((row) => ({
      id: 'rating_' + row.id,
      type: 'rating' as const,
      teacher_id: row.teacher_id,
      created_at: row.created_at,
    })),
    ...(activityComments || []).map((row) => ({
      id: 'comment_' + row.id,
      type: 'comment' as const,
      teacher_id: row.teacher_id,
      created_at: row.created_at,
    })),
  ];

  const activityTeacherIds = Array.from(new Set(initialActivity.map((item) => item.teacher_id))).filter(Boolean);
  const { data: activityTeachers } = activityTeacherIds.length > 0
    ? await supabase
        .from('teachers')
        .select('id, name')
        .in('id', activityTeacherIds)
    : { data: [] };

  const activityTeacherMap = new Map((activityTeachers || []).map((t) => [t.id, t.name]));
  const activityItems: ActivityItem[] = initialActivity
    .map((item) => ({
      ...item,
      teacher_name: activityTeacherMap.get(item.teacher_id) || null,
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 py-20 lg:py-32">
        <div className="absolute inset-0 leaf-pattern opacity-40" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Rate Your Teachers
              <span className="block text-emerald-100">Anonymously</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-emerald-100">
              Share your experience and help other students find the best educators. 
              All ratings and comments are completely anonymous.
            </p>
            
            {/* Search Bar */}
            <div className="mx-auto mt-10 max-w-xl">
              <SearchBar size="lg" placeholder="Search for a teacher..." />
            </div>

            {/* Quick Stats */}
            <div className="mt-12 flex flex-wrap justify-center gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                    <p className="text-sm text-emerald-100">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Latest Updates Banner */}
      <section className="pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <UpdateBannerCarousel className="mb-6" />
        </div>
      </section>
      {/* Interesting Facts Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Interesting Facts
              </h2>
              <p className="mt-2 text-muted-foreground">
                Highlights from ratings and comments across the platform
              </p>
            </div>
            <Link href="/leaderboard">
              <Button variant="outline" rightIcon={<TrendingUp className="h-4 w-4" />}>
                View Leaderboard
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {factCards.map((card) => (
              <div
                key={card.title}
                className={`rounded-2xl border p-5 shadow-sm ${card.style}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                    <card.icon className="h-4 w-4" />
                    <span>{card.title}</span>
                  </div>
                </div>
                {card.teacherId ? (
                  <Link
                    href={`/teachers/${card.teacherId}`}
                    className="mt-4 inline-flex text-xl font-bold text-foreground hover:text-emerald-700 dark:text-emerald-200"
                  >
                    {card.value}
                  </Link>
                ) : (
                  <p className="mt-4 text-xl font-bold text-foreground">{card.value}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{card.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 mb-12">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
                <ThumbsUp className="h-4 w-4" />
                Top-Liked Comment
              </div>

              {shouldShowLikedComment ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {likedCommentPreview}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {topLikedComment.teacher_name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-200">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {topLikedComment.like_count}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-muted-foreground">
                  No liked comments yet. Be the first to leave one!
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 mb-12">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 p-8 shadow-lg">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-emerald-50">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20">
                      <Calendar className="h-5 w-5" />
                    </span>
                    Weekly Reset Reminder
                  </div>
                  <h3 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                    Vote once per week, every Monday
                  </h3>
                  <p className="mt-2 text-base text-emerald-50/90 sm:text-lg">
                    Your weekly vote refreshes at the start of each week, so you can keep sharing new feedback.
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl bg-white/15 px-4 py-3 text-center text-sm font-semibold text-white">
                  Weekly votes reset
                  <span className="block text-lg font-bold">Every Monday</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
          <div className="mt-10 mb-12">
            <ActivityFeed initialItems={activityItems} />
          </div>

      {/* How It Works Section */}
      <section className="border-t border-border bg-muted py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Share your feedback in three simple steps
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Find Your Teacher',
                description: 'Search or browse our directory to find the teacher you want to rate.',
              },
              {
                step: '02',
                title: 'Rate & Comment',
                description: 'Give a star rating and share your experience with an optional comment.',
              },
              {
                step: '03',
                title: 'Stay Anonymous',
                description: 'Your feedback is completely anonymous. No account required!',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-emerald-100">{item.step}</div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-emerald-600 px-6 py-12 text-center lg:px-16">
            <h2 className="text-3xl font-bold text-white">
              Ready to share your experience?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-100">
              Join thousands of students in helping others find great teachers.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/teachers">
                <Button size="lg" variant="secondary">
                  Browse Teachers
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  View Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



















