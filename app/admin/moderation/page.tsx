'use client';

import * as React from 'react';
import { ModerationQueue } from '@/components/admin/ModerationQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CommentsSubnav } from '@/components/admin/CommentsSubnav';
import { CommentWithTeacher } from '@/lib/types/database';
import { MessageSquare, CheckCircle } from 'lucide-react';

/**
 * Comment Moderation Page
 * 
 * Review and moderate pending comments.
 */

export default function ModerationPage() {
  const [comments, setComments] = React.useState<CommentWithTeacher[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchComments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/comments/pending');
      const data = await response.json();

      if (response.ok) {
        setComments(data.data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: true }),
      });

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error approving comment:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error rejecting comment:', error);
    }
  };

  const handleFlag = async (id: string) => {
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_flagged: true }),
      });

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error('Error flagging comment:', error);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Comment Moderation</h1>
        <p className="text-muted-foreground">
          Review and approve pending comments before they appear publicly
        </p>
      </div>

      <CommentsSubnav />

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <MessageSquare className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{comments.length}</p>
              <p className="text-sm text-muted-foreground">Pending Comments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Ready to Review</p>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <ModerationQueue
            comments={comments}
            isLoading={isLoading}
            onApprove={handleApprove}
            onReject={handleReject}
            onFlag={handleFlag}
          />
        </CardContent>
      </Card>

      {/* Guidelines */}
      <div className="mt-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 p-4">
        <h3 className="font-medium text-blue-900">Moderation Guidelines</h3>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-700">
          <li>Approve comments that are constructive and respectful</li>
          <li>Reject comments containing hate speech, personal attacks, or inappropriate content</li>
          <li>Flag comments for further review if unsure</li>
          <li>All decisions are final and cannot be undone</li>
        </ul>
      </div>
    </div>
  );
}


