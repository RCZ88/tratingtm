'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { CommentsSubnav } from '@/components/admin/CommentsSubnav';
import { CommentWithTeacher, Department } from '@/lib/types/database';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import {
  Trash2,
  EyeOff,
  Eye,
  CheckCircle,
  MessageSquare,
  Search,
  Filter,
  CornerDownRight,
} from 'lucide-react';

type StatusFilter = 'all' | 'approved' | 'pending' | 'hidden';

type TeacherOption = {
  id: string;
  name: string;
  department_id: string | null;
};

type ReplyItem = {
  id: string;
  comment_id: string;
  parent_reply_id: string | null;
  reply_text: string;
  anonymous_id: string;
  is_approved: boolean;
  is_flagged: boolean;
  created_at: string;
};

const MAX_TEACHER_SELECTION = 5;

export default function AdminCommentsPage() {
  const [comments, setComments] = React.useState<CommentWithTeacher[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [search, setSearch] = React.useState('');
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [commentToDelete, setCommentToDelete] = React.useState<CommentWithTeacher | null>(null);

  const [showTeacherFilter, setShowTeacherFilter] = React.useState(false);
  const [teacherSearch, setTeacherSearch] = React.useState('');
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [teachers, setTeachers] = React.useState<TeacherOption[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = React.useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = React.useState<string[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = React.useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = React.useState(false);
  const [filterMessage, setFilterMessage] = React.useState<string | null>(null);

  const [expandedReplies, setExpandedReplies] = React.useState<Set<string>>(new Set());
  const [repliesByComment, setRepliesByComment] = React.useState<Record<string, ReplyItem[]>>({});
  const [loadingRepliesByComment, setLoadingRepliesByComment] = React.useState<Record<string, boolean>>({});

  const fetchComments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', status);
      if (search.trim()) params.set('q', search.trim());
      if (selectedTeacherIds.length > 0) params.set('teacher_ids', selectedTeacherIds.join(','));
      if (selectedDepartmentIds.length > 0) params.set('department_ids', selectedDepartmentIds.join(','));

      const response = await fetch(`/api/admin/comments?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setComments(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [status, search, selectedTeacherIds, selectedDepartmentIds]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  React.useEffect(() => {
    let active = true;
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const response = await fetch('/api/departments');
        const data = await response.json();
        if (active && response.ok) {
          setDepartments(data.data || []);
        }
      } catch {
        if (active) setDepartments([]);
      } finally {
        if (active) setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    const fetchTeachers = async () => {
      setIsLoadingTeachers(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', '1000');
        params.set('sort_by', 'name');
        params.set('sort_order', 'asc');
        params.set('include_inactive', 'true');
        const response = await fetch(`/api/teachers?${params.toString()}`);
        const data = await response.json();
        if (active && response.ok) {
          const teacherList = (data.data || []).map((teacher: any) => ({
            id: teacher.id,
            name: teacher.name,
            department_id: teacher.department_id || null,
          }));
          setTeachers(teacherList);
        }
      } catch {
        if (active) setTeachers([]);
      } finally {
        if (active) setIsLoadingTeachers(false);
      }
    };

    fetchTeachers();
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (selectedDepartmentIds.length === 0) return;
    setSelectedTeacherIds((prev) =>
      prev.filter((teacherId) => {
        const teacher = teachers.find((row) => row.id === teacherId);
        if (!teacher) return false;
        return teacher.department_id && selectedDepartmentIds.includes(teacher.department_id);
      })
    );
  }, [selectedDepartmentIds, teachers]);

  const updateComment = async (id: string, payload: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!commentToDelete) return;
    try {
      const response = await fetch(`/api/comments/${commentToDelete.id}`, { method: 'DELETE' });
      if (response.ok) {
        setDeleteModalOpen(false);
        setCommentToDelete(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const toggleTeacher = (id: string) => {
    setFilterMessage(null);
    setSelectedTeacherIds((prev) => {
      if (prev.includes(id)) return prev.filter((teacherId) => teacherId !== id);
      if (prev.length >= MAX_TEACHER_SELECTION) {
        setFilterMessage(`Select up to ${MAX_TEACHER_SELECTION} teachers.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleDepartment = (id: string) => {
    setSelectedDepartmentIds((prev) => (prev.includes(id) ? prev.filter((deptId) => deptId !== id) : [...prev, id]));
  };

  const clearFilters = () => {
    setSelectedTeacherIds([]);
    setSelectedDepartmentIds([]);
    setTeacherSearch('');
    setFilterMessage(null);
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch = teacher.name.toLowerCase().includes(teacherSearch.trim().toLowerCase());
    const matchesDepartment =
      selectedDepartmentIds.length === 0 ||
      (teacher.department_id && selectedDepartmentIds.includes(teacher.department_id));
    return matchesSearch && matchesDepartment;
  });

  const fetchRepliesForComment = async (commentId: string) => {
    setLoadingRepliesByComment((prev) => ({ ...prev, [commentId]: true }));
    try {
      const response = await fetch(`/api/admin/comment-replies?comment_id=${commentId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load replies');
      }
      setRepliesByComment((prev) => ({ ...prev, [commentId]: data.data || [] }));
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoadingRepliesByComment((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const toggleReplies = async (commentId: string) => {
    const isOpen = expandedReplies.has(commentId);
    if (isOpen) {
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      return;
    }

    setExpandedReplies((prev) => new Set(prev).add(commentId));
    await fetchRepliesForComment(commentId);
  };

  const updateReply = async (replyId: string, commentId: string, payload: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/admin/comment-replies/${replyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        fetchRepliesForComment(commentId);
      }
    } catch (error) {
      console.error('Error updating reply:', error);
    }
  };

  const deleteReply = async (replyId: string, commentId: string) => {
    try {
      const response = await fetch(`/api/admin/comment-replies/${replyId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchRepliesForComment(commentId);
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">All Comments</h1>
        <p className="text-slate-600">Review, hide, or delete comments and replies</p>
      </div>

      <CommentsSubnav />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <div className="flex-1">
              <Input
                placeholder="Search comments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setShowTeacherFilter((prev) => !prev)} leftIcon={<Filter className="h-4 w-4" />}>
                Filter teachers
              </Button>
              <Button variant="outline" onClick={fetchComments}>Refresh</Button>
            </div>
          </div>

          {(selectedTeacherIds.length > 0 || selectedDepartmentIds.length > 0) && (
            <div className="text-xs text-slate-500">
              Filters applied: {selectedTeacherIds.length} teacher{selectedTeacherIds.length !== 1 ? 's' : ''}, {selectedDepartmentIds.length} department{selectedDepartmentIds.length !== 1 ? 's' : ''}.
            </div>
          )}

          {showTeacherFilter && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="w-full lg:w-1/3">
                  <h3 className="text-sm font-semibold text-slate-700">Departments</h3>
                  <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                    {isLoadingDepartments ? (
                      <p className="text-sm text-slate-500">Loading departments...</p>
                    ) : departments.length === 0 ? (
                      <p className="text-sm text-slate-500">No departments found.</p>
                    ) : (
                      <div className="space-y-2">
                        {departments.map((dept) => (
                          <label key={dept.id} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={selectedDepartmentIds.includes(dept.id)} onChange={() => toggleDepartment(dept.id)} />
                            <span>{dept.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full lg:w-2/3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">Teachers</h3>
                    <span className="text-xs text-slate-500">{selectedTeacherIds.length}/{MAX_TEACHER_SELECTION} selected</span>
                  </div>
                  <div className="mt-2">
                    <Input
                      placeholder="Search teachers..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      leftIcon={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <div className="mt-3 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white p-3">
                    {isLoadingTeachers ? (
                      <p className="text-sm text-slate-500">Loading teachers...</p>
                    ) : filteredTeachers.length === 0 ? (
                      <p className="text-sm text-slate-500">No teachers match your filters.</p>
                    ) : (
                      <div className="space-y-2">
                        {filteredTeachers.map((teacher) => (
                          <label key={teacher.id} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={selectedTeacherIds.includes(teacher.id)} onChange={() => toggleTeacher(teacher.id)} />
                            <span>{teacher.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  {filterMessage && <p className="mt-2 text-xs text-amber-600">{filterMessage}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : comments.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-8 text-center text-slate-500">No comments found</div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const statusLabel = comment.is_flagged ? 'Hidden' : comment.is_approved ? 'Approved' : 'Pending';
                const commentReplies = repliesByComment[comment.id] || [];
                const isRepliesOpen = expandedReplies.has(comment.id);
                const isRepliesLoading = loadingRepliesByComment[comment.id] === true;
                const replyTextMap: Record<string, string> = {};
                commentReplies.forEach((reply) => {
                  replyTextMap[reply.id] = reply.reply_text;
                });

                return (
                  <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">
                          {comment.teacher?.name ? (
                            <Link href={`/teachers/${comment.teacher.id}`} className="font-medium text-slate-700 hover:text-emerald-700">
                              {comment.teacher.name}
                            </Link>
                          ) : (
                            'Unknown teacher'
                          )}{' '}
                          - {formatRelativeTime(comment.created_at)}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{comment.comment_text}</p>
                      </div>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{statusLabel}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {!comment.is_approved && !comment.is_flagged && (
                        <Button size="sm" variant="secondary" leftIcon={<CheckCircle className="h-4 w-4" />} onClick={() => updateComment(comment.id, { is_approved: true })}>
                          Approve
                        </Button>
                      )}

                      {!comment.is_flagged ? (
                        <Button size="sm" variant="outline" leftIcon={<EyeOff className="h-4 w-4" />} onClick={() => updateComment(comment.id, { is_flagged: true })}>
                          Hide
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />} onClick={() => updateComment(comment.id, { is_flagged: false })}>
                          Unhide
                        </Button>
                      )}

                      <Button size="sm" variant="outline" leftIcon={<CornerDownRight className="h-4 w-4" />} onClick={() => toggleReplies(comment.id)}>
                        {isRepliesOpen ? 'Hide Replies' : 'View Replies'}
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        onClick={() => {
                          setCommentToDelete(comment);
                          setDeleteModalOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>

                    {isRepliesOpen && (
                      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Replies ({commentReplies.length})
                        </p>

                        {isRepliesLoading ? (
                          <p className="text-sm text-slate-500">Loading replies...</p>
                        ) : commentReplies.length === 0 ? (
                          <p className="text-sm text-slate-500">No replies yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {commentReplies.map((reply) => {
                              const replyStatus = reply.is_flagged ? 'Hidden' : reply.is_approved ? 'Approved' : 'Pending';
                              const parentPreview = reply.parent_reply_id ? replyTextMap[reply.parent_reply_id] : null;
                              return (
                                <div key={reply.id} className="rounded-md border border-slate-200 bg-white p-3">
                                  <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>Anonymous - {formatRelativeTime(reply.created_at)}</span>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{replyStatus}</span>
                                  </div>
                                  {parentPreview && (
                                    <p className="mt-2 text-xs text-slate-500">Replying to: {parentPreview.slice(0, 120)}</p>
                                  )}
                                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{reply.reply_text}</p>

                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {!reply.is_approved && !reply.is_flagged && (
                                      <Button size="sm" variant="secondary" onClick={() => updateReply(reply.id, comment.id, { is_approved: true })}>
                                        Approve
                                      </Button>
                                    )}

                                    {!reply.is_flagged ? (
                                      <Button size="sm" variant="outline" onClick={() => updateReply(reply.id, comment.id, { is_flagged: true })}>
                                        Hide
                                      </Button>
                                    ) : (
                                      <Button size="sm" variant="outline" onClick={() => updateReply(reply.id, comment.id, { is_flagged: false })}>
                                        Unhide
                                      </Button>
                                    )}

                                    <Button size="sm" variant="danger" onClick={() => deleteReply(reply.id, comment.id)}>
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCommentToDelete(null);
        }}
        title="Delete Comment"
        size="sm"
      >
        <div className="text-center">
          <p className="text-slate-600">Are you sure you want to delete this comment? This action cannot be undone.</p>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setDeleteModalOpen(false);
                setCommentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
