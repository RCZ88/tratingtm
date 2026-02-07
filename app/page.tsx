import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/public/SearchBar';
import { 
  Star, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Sparkles, 
  BarChart3, 
  ThumbsUp 
} from 'lucide-react';

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
      detail: mostPopularTeacher
        ? `${mostPopularTeacher.total_interactions} interactions`
        : 'Waiting for ratings and comments',
      icon: Sparkles,
      style: 'border-emerald-200 bg-emerald-50/70 text-emerald-700',
    },
    {
      title: 'Most Rated Teacher',
      value: mostRatedTeacher?.name || 'No ratings yet',
      detail: mostRatedTeacher
        ? `${mostRatedTeacher.total_ratings} ratings`
        : 'No ratings submitted',
      icon: Star,
      style: 'border-teal-200 bg-teal-50/70 text-teal-700',
    },
    {
      title: 'Most Commented Teacher',
      value: mostCommentedTeacher?.name || 'No comments yet',
      detail: mostCommentedTeacher
        ? `${mostCommentedTeacher.total_comments} comments`
        : 'No comments submitted',
      icon: MessageSquare,
      style: 'border-amber-200 bg-amber-50/70 text-amber-700',
    },
    {
      title: 'Overall Average Rating',
      value: averageRating ? `${averageRating.toFixed(2)} / 5` : 'N/A',
      detail: ratingCount ? `${ratingCount.toLocaleString()} total ratings` : 'No ratings yet',
      icon: BarChart3,
      style: 'border-sky-200 bg-sky-50/70 text-sky-700',
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

      {/* Interesting Facts Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Interesting Facts
              </h2>
              <p className="mt-2 text-slate-600">
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
                <p className="mt-4 text-xl font-bold text-slate-900">{card.value}</p>
                <p className="mt-1 text-sm text-slate-600">{card.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
                <ThumbsUp className="h-4 w-4" />
                Top-Liked Comment
              </div>

              {shouldShowLikedComment ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {likedCommentPreview}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {topLikedComment.teacher_name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {topLikedComment.like_count}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-slate-500">
                  No liked comments yet. Be the first to leave one!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-slate-200 bg-slate-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
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
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-slate-600">{item.description}</p>
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
