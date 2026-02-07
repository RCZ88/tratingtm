import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { TeacherWithStats } from '@/lib/types/database';
import { Button } from '@/components/ui/Button';
import { TeacherGrid } from '@/components/public/TeacherGrid';
import { SearchBar } from '@/components/public/SearchBar';
import { Star, Users, MessageSquare, TrendingUp } from 'lucide-react';

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

  // Fetch top-rated teachers
  const { data: topStatsData } = await supabase
    .from('teacher_stats')
    .select('*')
    .gt('total_ratings', 0)
    .order('overall_rating', { ascending: false })
    .limit(6);

  const topStats = topStatsData ?? [];
  let featuredTeachers: TeacherWithStats[] = [];
  const topIds = topStats.map((stat) => stat.id);

  if (topIds.length > 0) {
    const { data: topTeacherRows } = await supabase
      .from('teachers')
      .select('*')
      .in('id', topIds)
      .eq('is_active', true);

    const teacherMap = new Map(topTeacherRows?.map((t) => [t.id, t]) || []);

    const nextFeatured: TeacherWithStats[] = [];
    for (const stat of topStats) {
      const teacher = teacherMap.get(stat.id);
      if (!teacher) continue;
      nextFeatured.push({
        ...teacher,
        total_ratings: stat.total_ratings,
        average_rating: stat.overall_rating,
        total_comments: stat.total_comments,
      });
    }
    featuredTeachers = nextFeatured;
  }

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

      {/* Featured Teachers Section */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Top Rated Teachers
              </h2>
              <p className="mt-2 text-slate-600">
                Discover the highest-rated educators this week
              </p>
            </div>
            <Link href="/teachers">
              <Button variant="outline" rightIcon={<TrendingUp className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </div>

          <div className="mt-10">
            <TeacherGrid teachers={featuredTeachers} columns={3} />
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
