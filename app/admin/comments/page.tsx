'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { CommentWithTeacher } from '@/lib/types/database';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import {
  Trash2,
  EyeOff,
  Eye,
  CheckCircle,
  MessageSquare,
  Search,
} from 'lucide-react';

type StatusFilter = 'all' | 'approved' | 'pending' | 'hidden';

export default function AdminCommentsPage() {
  const [comments, setComments] = React.useState<CommentWithTeacher[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [status, setStatus] = React.useState<StatusFilter>('all');
  const [search, setSearch] = React.useState('');
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [commentToDelete, setCommentToDelete] = React.useState<CommentWithTeacher | null>(null);

  const fetchComments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', status);
      if (search.trim()) params.set('q', search.trim());

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
  }, [status, search]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

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
      const response = await fetch(`/api/comments/${commentToDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDeleteModalOpen(false);
        setCommentToDelete(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">All Comments</h1>
        <p className="text-slate-600">Review, hide, or delete comments</p>
      </div>

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
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
          <Button variant="outline" onClick={fetchComments}>
            Refresh
          </Button>
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
            <div className="rounded-lg bg-slate-50 p-8 text-center text-slate-500">
              No comments found
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const statusLabel = comment.is_flagged
                  ? 'Hidden'
                  : comment.is_approved
                  ? 'Approved'
                  : 'Pending';

                return (
                  <div
                    key={comment.id}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">
                          {comment.teacher?.name ? (
                            <Link
                              href={`/teachers/${comment.teacher.id}`}
                              className="font-medium text-slate-700 hover:text-emerald-700"
                            >
                              {comment.teacher.name}
                            </Link>
                          ) : (
                            'Unknown teacher'
                          )}{' '}
                          • {formatRelativeTime(comment.created_at)}
                        </p>
                        <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                          {comment.comment_text}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {statusLabel}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {!comment.is_approved && !comment.is_flagged && (
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<CheckCircle className="h-4 w-4" />}
                          onClick={() => updateComment(comment.id, { is_approved: true })}
                        >
                          Approve
                        </Button>
                      )}

                      {!comment.is_flagged ? (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<EyeOff className="h-4 w-4" />}
                          onClick={() => updateComment(comment.id, { is_flagged: true })}
                        >
                          Hide
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Eye className="h-4 w-4" />}
                          onClick={() => updateComment(comment.id, { is_flagged: false })}
                        >
                          Unhide
                        </Button>
                      )}

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
          <p className="text-slate-600">
            Are you sure you want to delete this comment? This action cannot be undone.
          </p>
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
