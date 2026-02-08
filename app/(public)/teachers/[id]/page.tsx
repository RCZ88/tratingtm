'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { StarRatingDisplay } from '@/components/ui/StarRating';
import { RatingForm } from '@/components/public/RatingForm';
import { CommentForm } from '@/components/public/CommentForm';
import { CommentList } from '@/components/public/CommentList';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, User, BookOpen, Building2, BarChart3 } from 'lucide-react';
import { formatYearLevels, getAvatarStyle, getDepartmentBadgeStyle } from '@/lib/utils/teacherDisplay';
import { getAnonymousId } from '@/lib/utils/anonymousId';

/**
 * Teacher Detail Page
 * 
 * Shows teacher profile, ratings, and comments.
 * Allows anonymous rating and commenting.
 */

interface TeacherData {
  id: string;
  name: string;
  department: { id: string; name: string; color_hex?: string } | null;
  subjects: Array<{ id: string; name: string }>;
  subject_ids?: string[];
  primary_subject?: string | null;
  department_id?: string | null;
  levels: string[] | null;
  year_levels: number[] | null;
  bio: string | null;
  image_url: string | null;
  total_ratings: number;
  average_rating: number;
  total_comments: number;
  rating_distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  comments: Array<{
    id: string;
    comment_text: string;
    created_at: string;
    like_count: number;
    dislike_count: number;
    viewer_reaction: 'like' | 'dislike' | null;
  }>;
}

export default function TeacherDetailPage() {
  const params = useParams();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = React.useState<TeacherData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const fetchTeacher = React.useCallback(async () => {
    try {
      const anonymousId = getAnonymousId();
      const response = await fetch(
        `/api/teachers/${teacherId}?anonymous_id=${encodeURIComponent(anonymousId)}`
      );
      const data = await response.json();

      if (response.ok) {
        setTeacher(data.data);
      }
    } catch (error) {
      console.error('Error fetching teacher:', error);
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  React.useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher, refreshKey]);

  const handleRatingSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleCommentSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading teacher profile..." />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-900">Teacher Not Found</h1>
        <p className="mt-2 text-slate-600">
          The teacher you are looking for does not exist.
        </p>
        <Link href="/teachers" className="mt-6">
          <Button>Back to Teachers</Button>
        </Link>
      </div>
    );
  }

  const maxDistribution = Math.max(...Object.values(teacher.rating_distribution));
  const yearLabel = formatYearLevels(teacher.year_levels);
  const subjectList = teacher.subjects?.map((subject) => subject.name) || [];
  const levels = teacher.levels || [];
  const departmentStyle = getDepartmentBadgeStyle(teacher.department?.color_hex || null);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/teachers"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-emerald-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teachers
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Profile Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 sm:flex-row">
                  {/* Image */}
                  <div className="relative mx-auto h-32 w-32 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 sm:mx-0">
                    {teacher.image_url ? (
                      <Image
                        src={teacher.image_url}
                        alt={teacher.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center ${getAvatarStyle(teacher.name)}`}>
                        <User className="h-16 w-16" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {teacher.name}
                    </h1>

                    {(subjectList.length > 0 || teacher.department) && (
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        {teacher.department && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${departmentStyle.className}`}
                            style={departmentStyle.style}
                          >
                            <Building2 className="h-3.5 w-3.5" />
                            {teacher.department.name}
                          </span>
                        )}
                        {subjectList.map((subject) => (
                          <span
                            key={subject}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            {subject}
                          </span>
                        ))}
                      </div>
                    )}

                    {(levels.length > 0 || yearLabel) && (
                      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        {levels.includes('SL') && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            SL
                          </span>
                        )}
                        {levels.includes('HL') && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            HL
                          </span>
                        )}
                        {yearLabel && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            Years {yearLabel}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-center gap-4 sm:justify-start">
                      <StarRatingDisplay
                        rating={teacher.average_rating}
                        count={teacher.total_ratings}
                        size="md"
                      />
                    </div>
                  </div>
                </div>

                {teacher.bio && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h2 className="text-lg font-semibold text-slate-900">About</h2>
                    <p className="mt-2 whitespace-pre-wrap text-slate-600">
                      {teacher.bio}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rating Distribution */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = teacher.rating_distribution[stars as keyof typeof teacher.rating_distribution];
                    const percentage = teacher.total_ratings > 0
                      ? (count / teacher.total_ratings) * 100
                      : 0;

                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="w-8 text-sm font-medium text-slate-600">
                          {stars}★
                        </span>
                        <div className="flex-1">
                          <div className="h-3 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-amber-400 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-12 text-right text-sm text-slate-500">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Comments ({teacher.total_comments})</CardTitle>
              </CardHeader>
              <CardContent>
                <CommentList comments={teacher.comments} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Rate Teacher */}
            <Card>
              <CardHeader>
                <CardTitle>Rate This Teacher</CardTitle>
              </CardHeader>
              <CardContent>
                <RatingForm
                  teacherId={teacher.id}
                  onSuccess={handleRatingSuccess}
                />
              </CardContent>
            </Card>

            {/* Add Comment */}
            <Card>
              <CardHeader>
                <CardTitle>Leave a Comment</CardTitle>
              </CardHeader>
              <CardContent>
                <CommentForm
                  teacherId={teacher.id}
                  onSuccess={handleCommentSuccess}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
