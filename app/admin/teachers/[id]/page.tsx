'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { StarRatingDisplay } from '@/components/ui/StarRating';
import { CommentList } from '@/components/public/CommentList';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ArrowLeft, User, BookOpen, Building2, BarChart3, ShieldCheck, Trash2, EyeOff, Eye, CheckCircle } from 'lucide-react';
import { formatYearLevels, getAvatarStyle, getDepartmentBadgeStyle } from '@/lib/utils/teacherDisplay';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';

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
  weekly_rating_count?: number;
  weekly_average_rating?: number | null;
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

type AdminComment = {
  id: string;
  comment_text: string;
  created_at: string;
  is_approved: boolean;
  is_flagged: boolean;
};

type AdminRating = {
  id: string;
  stars: number;
  anonymous_id: string;
  created_at: string;
  week_start?: string;
};

type CommentStatus = 'all' | 'approved' | 'pending' | 'hidden';

type RatingTab = 'all_time' | 'weekly';

type RatingsTable = 'ratings' | 'weekly_ratings';

const maskAnonymousId = (value: string) => {
  if (!value) return 'anon';
  if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-2)}`;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

export default function AdminTeacherDetailPage() {
  const params = useParams();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = React.useState<TeacherData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [ratingMode, setRatingMode] = React.useState<'weekly' | 'all_time'>('all_time');

  const [commentStatus, setCommentStatus] = React.useState<CommentStatus>('all');
  const [adminComments, setAdminComments] = React.useState<AdminComment[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState(false);

  const [ratingTab, setRatingTab] = React.useState<RatingTab>('all_time');
  const [ratingsAllTime, setRatingsAllTime] = React.useState<AdminRating[]>([]);
  const [ratingsWeekly, setRatingsWeekly] = React.useState<AdminRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = React.useState(false);
  const [ratingEdits, setRatingEdits] = React.useState<Record<string, number>>({});
  const [ratingActionId, setRatingActionId] = React.useState<string | null>(null);

  const loadTeacher = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/teachers/${teacherId}`);
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

  const loadComments = React.useCallback(async () => {
    setCommentsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('teacher_id', teacherId);
      params.set('status', commentStatus);
      const response = await fetch(`/api/admin/comments?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setAdminComments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching admin comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  }, [teacherId, commentStatus]);

  const loadRatings = React.useCallback(async (table: RatingsTable) => {
    setRatingsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('teacher_id', teacherId);
      params.set('table', table);
      const response = await fetch(`/api/admin/ratings?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        if (table === 'ratings') {
          setRatingsAllTime(data.data || []);
        } else {
          setRatingsWeekly(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setRatingsLoading(false);
    }
  }, [teacherId]);

  React.useEffect(() => {
    loadTeacher();
  }, [loadTeacher]);

  React.useEffect(() => {
    loadComments();
  }, [loadComments]);

  React.useEffect(() => {
    loadRatings('ratings');
    loadRatings('weekly_ratings');
  }, [loadRatings]);

  const updateComment = async (id: string, payload: Record<string, unknown>) => {
    await fetch(`/api/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await loadComments();
    await loadTeacher();
  };

  const deleteComment = async (id: string) => {
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    await loadComments();
    await loadTeacher();
  };

  const updateRating = async (ratingId: string, table: RatingsTable) => {
    const nextStars = ratingEdits[ratingId];
    if (!nextStars) return;
    setRatingActionId(ratingId);
    try {
      const response = await fetch(`/api/admin/ratings/${ratingId}?table=${table}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars: nextStars }),
      });
      if (response.ok) {
        await loadRatings(table);
        await loadTeacher();
      }
    } finally {
      setRatingActionId(null);
    }
  };

  const deleteRating = async (ratingId: string, table: RatingsTable) => {
    setRatingActionId(ratingId);
    try {
      const response = await fetch(`/api/admin/ratings/${ratingId}?table=${table}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadRatings(table);
        await loadTeacher();
      }
    } finally {
      setRatingActionId(null);
    }
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
        <p className="mt-2 text-slate-600">The teacher you are looking for does not exist.</p>
        <Link href="/admin/teachers" className="mt-6">
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

  const ratingsForTab = ratingTab === 'all_time' ? ratingsAllTime : ratingsWeekly;
  const ratingTable = ratingTab === 'all_time' ? 'ratings' : 'weekly_ratings';

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/teachers"
            className="inline-flex items-center text-sm text-slate-600 hover:text-emerald-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teachers
          </Link>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Admin Mode
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="relative mx-auto h-32 w-32 flex-shrink-0 overflow-hidden rounded-full bg-slate-100 sm:mx-0">
                    {teacher.image_url ? (
                      <Image src={teacher.image_url} alt={teacher.name} fill className="object-cover" />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center ${getAvatarStyle(teacher.name)}`}>
                        <User className="h-16 w-16" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-slate-900">{teacher.name}</h1>

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
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">SL</span>
                        )}
                        {levels.includes('HL') && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">HL</span>
                        )}
                        {yearLabel && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            Years {yearLabel}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 grid gap-3 sm:max-w-md">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rating View</p>
                        <div className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm">
                          <button
                            type="button"
                            onClick={() => setRatingMode('weekly')}
                            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                              ratingMode === 'weekly'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-slate-600 hover:bg-white'
                            }`}
                          >
                            Weekly
                          </button>
                          <button
                            type="button"
                            onClick={() => setRatingMode('all_time')}
                            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                              ratingMode === 'all_time'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'text-slate-600 hover:bg-white'
                            }`}
                          >
                            All-Time
                          </button>
                        </div>
                      </div>

                      {ratingMode === 'weekly' ? (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Weekly (Unique)</p>
                          {teacher.weekly_average_rating !== null && teacher.weekly_average_rating !== undefined ? (
                            <StarRatingDisplay
                              rating={teacher.weekly_average_rating}
                              count={teacher.weekly_rating_count || 0}
                              size="md"
                            />
                          ) : (
                            <p className="text-sm text-slate-500">Not enough data yet</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">All-Time (Total)</p>
                          <StarRatingDisplay rating={teacher.average_rating} count={teacher.total_ratings} size="md" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {teacher.bio && (
                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <h2 className="text-lg font-semibold text-slate-900">About</h2>
                    <p className="mt-2 whitespace-pre-wrap text-slate-600">{teacher.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
                        <span className="w-8 text-sm font-medium text-slate-600">{stars}*</span>
                        <div className="flex-1">
                          <div className="h-3 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-amber-400 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-12 text-right text-sm text-slate-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Comments ({teacher.total_comments})</CardTitle>
              </CardHeader>
              <CardContent>
                <CommentList comments={teacher.comments} teacherId={teacher.id} totalCount={teacher.total_comments} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Comment Moderation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <select
                    value={commentStatus}
                    onChange={(e) => setCommentStatus(e.target.value as CommentStatus)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="all">All</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="hidden">Hidden</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={loadComments}>
                    Refresh
                  </Button>
                </div>

                {commentsLoading ? (
                  <LoadingSpinner />
                ) : adminComments.length === 0 ? (
                  <p className="text-sm text-slate-500">No comments for this filter.</p>
                ) : (
                  <div className="space-y-3">
                    {adminComments.map((comment) => {
                      const statusLabel = comment.is_flagged ? 'Hidden' : comment.is_approved ? 'Approved' : 'Pending';
                      return (
                        <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{statusLabel}</span>
                            <span>{formatRelativeTime(comment.created_at)}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{comment.comment_text}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {!comment.is_approved && !comment.is_flagged && (
                              <Button size="sm" onClick={() => updateComment(comment.id, { is_approved: true, is_flagged: false })}>
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                            )}
                            {comment.is_flagged ? (
                              <Button size="sm" variant="outline" onClick={() => updateComment(comment.id, { is_flagged: false })}>
                                <Eye className="mr-1 h-4 w-4" />
                                Unhide
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => updateComment(comment.id, { is_flagged: true })}>
                                <EyeOff className="mr-1 h-4 w-4" />
                                Hide
                              </Button>
                            )}
                            <Button size="sm" variant="danger" onClick={() => deleteComment(comment.id)}>
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rating Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setRatingTab('all_time')}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      ratingTab === 'all_time'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    All-time ratings
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingTab('weekly')}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      ratingTab === 'weekly'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-slate-600 hover:bg-white'
                    }`}
                  >
                    Weekly ratings
                  </button>
                </div>

                {ratingsLoading ? (
                  <LoadingSpinner />
                ) : ratingsForTab.length === 0 ? (
                  <p className="text-sm text-slate-500">No ratings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {ratingsForTab.map((rating) => {
                      const currentStars = ratingEdits[rating.id] || rating.stars;
                      return (
                        <div key={rating.id} className="rounded-lg border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{maskAnonymousId(rating.anonymous_id)}</span>
                            <span>{formatRelativeTime(rating.created_at)}</span>
                          </div>
                          {rating.week_start && (
                            <p className="mt-1 text-xs text-slate-500">Week of {rating.week_start}</p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <select
                              value={currentStars}
                              onChange={(e) =>
                                setRatingEdits((prev) => ({ ...prev, [rating.id]: Number(e.target.value) }))
                              }
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                            >
                              {[1, 2, 3, 4, 5].map((value) => (
                                <option key={value} value={value}>
                                  {value}
                                </option>
                              ))}
                            </select>
                            <Button
                              size="sm"
                              onClick={() => updateRating(rating.id, ratingTable)}
                              isLoading={ratingActionId === rating.id}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deleteRating(rating.id, ratingTable)}
                              isLoading={ratingActionId === rating.id}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}