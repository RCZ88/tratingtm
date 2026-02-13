'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';

type AdminTab = 'moderation' | 'complaints' | 'announcements';

type ForumPost = {
  id: string;
  title: string | null;
  body: string;
  author_role: 'user' | 'admin';
  is_approved: boolean;
  is_flagged: boolean;
  is_pinned: boolean;
  created_at: string;
};

type ForumReply = {
  id: string;
  post_id: string;
  body: string;
  author_role: 'user' | 'admin';
  is_approved: boolean;
  is_flagged: boolean;
  created_at: string;
};

type Complaint = {
  id: string;
  title: string | null;
  description: string;
  status: 'new' | 'on_hold' | 'resolved' | 'declined';
  admin_notes: string | null;
  created_at: string;
};

async function uploadImage(file: File): Promise<{ path: string; signed_preview_url: string | null }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('anonymous_id', 'admin');

  const response = await fetch('/api/forum/uploads', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload image');
  }
  return data.data;
}

export default function AdminForumPage() {
  const [tab, setTab] = React.useState<AdminTab>('moderation');

  const [posts, setPosts] = React.useState<ForumPost[]>([]);
  const [replies, setReplies] = React.useState<ForumReply[]>([]);
  const [isLoadingModeration, setIsLoadingModeration] = React.useState(true);

  const [complaints, setComplaints] = React.useState<Complaint[]>([]);
  const [isLoadingComplaints, setIsLoadingComplaints] = React.useState(true);
  const [complaintNotes, setComplaintNotes] = React.useState<Record<string, string>>({});

  const [announcementTitle, setAnnouncementTitle] = React.useState('');
  const [announcementBody, setAnnouncementBody] = React.useState('');
  const [announcementPinned, setAnnouncementPinned] = React.useState(false);
  const [announcementImagePath, setAnnouncementImagePath] = React.useState<string | null>(null);
  const [announcementImagePreview, setAnnouncementImagePreview] = React.useState<string | null>(null);
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = React.useState(false);

  const fetchModeration = React.useCallback(async () => {
    setIsLoadingModeration(true);
    try {
      const [postsRes, repliesRes] = await Promise.all([
        fetch('/api/admin/forum/posts?status=all'),
        fetch('/api/admin/forum/replies?status=all'),
      ]);

      const postsData = await postsRes.json();
      const repliesData = await repliesRes.json();

      if (postsRes.ok) setPosts(postsData.data || []);
      if (repliesRes.ok) setReplies(repliesData.data || []);
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setIsLoadingModeration(false);
    }
  }, []);

  const fetchComplaints = React.useCallback(async () => {
    setIsLoadingComplaints(true);
    try {
      const response = await fetch('/api/admin/complaints');
      const data = await response.json();
      if (response.ok) {
        const rows = data.data || [];
        setComplaints(rows);
        setComplaintNotes(
          Object.fromEntries(rows.map((row: Complaint) => [row.id, row.admin_notes || '']))
        );
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setIsLoadingComplaints(false);
    }
  }, []);

  React.useEffect(() => {
    fetchModeration();
    fetchComplaints();
  }, [fetchModeration, fetchComplaints]);

  const updatePost = async (id: string, payload: Record<string, unknown>) => {
    await fetch(`/api/admin/forum/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchModeration();
  };

  const deletePost = async (id: string) => {
    await fetch(`/api/admin/forum/posts/${id}`, { method: 'DELETE' });
    await fetchModeration();
  };

  const updateReply = async (id: string, payload: Record<string, unknown>) => {
    await fetch(`/api/admin/forum/replies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchModeration();
  };

  const deleteReply = async (id: string) => {
    await fetch(`/api/admin/forum/replies/${id}`, { method: 'DELETE' });
    await fetchModeration();
  };

  const updateComplaint = async (id: string, payload: Record<string, unknown>) => {
    await fetch(`/api/admin/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    await fetchComplaints();
  };

  const submitAnnouncement = async () => {
    setIsSubmittingAnnouncement(true);
    try {
      const response = await fetch('/api/admin/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle,
          body: announcementBody,
          is_pinned: announcementPinned,
          image_path: announcementImagePath,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to post announcement');

      setAnnouncementTitle('');
      setAnnouncementBody('');
      setAnnouncementPinned(false);
      setAnnouncementImagePath(null);
      setAnnouncementImagePreview(null);
      await fetchModeration();
      setTab('moderation');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to post announcement');
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  const handleAnnouncementImage = async (file: File | null) => {
    if (!file) return;
    try {
      const uploaded = await uploadImage(file);
      setAnnouncementImagePath(uploaded.path);
      setAnnouncementImagePreview(uploaded.signed_preview_url);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Forum Admin</h1>
        <p className="text-muted-foreground">Moderate forum content, review complaints, and post announcements.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['moderation', 'complaints', 'announcements'] as AdminTab[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              tab === value
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                : 'bg-card text-muted-foreground'
            }`}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'moderation' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Forum Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingModeration ? (
                <LoadingSpinner text="Loading forum moderation..." />
              ) : posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No forum posts yet.</p>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(post.created_at)}</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{post.title || 'Untitled post'}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{post.body}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!post.is_approved && !post.is_flagged && (
                          <Button size="sm" onClick={() => updatePost(post.id, { is_approved: true, is_flagged: false })}>Approve</Button>
                        )}
                        {!post.is_flagged ? (
                          <Button size="sm" variant="outline" onClick={() => updatePost(post.id, { is_flagged: true })}>Hide</Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => updatePost(post.id, { is_flagged: false })}>Unhide</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => updatePost(post.id, { is_pinned: !post.is_pinned })}>
                          {post.is_pinned ? 'Unpin' : 'Pin'}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => deletePost(post.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Forum Replies</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingModeration ? (
                <LoadingSpinner />
              ) : replies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No replies yet.</p>
              ) : (
                <div className="space-y-3">
                  {replies.map((reply) => (
                    <div key={reply.id} className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(reply.created_at)}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{reply.body}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!reply.is_approved && !reply.is_flagged && (
                          <Button size="sm" onClick={() => updateReply(reply.id, { is_approved: true, is_flagged: false })}>Approve</Button>
                        )}
                        {!reply.is_flagged ? (
                          <Button size="sm" variant="outline" onClick={() => updateReply(reply.id, { is_flagged: true })}>Hide</Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => updateReply(reply.id, { is_flagged: false })}>Unhide</Button>
                        )}
                        <Button size="sm" variant="danger" onClick={() => deleteReply(reply.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'complaints' && (
        <Card>
          <CardHeader>
            <CardTitle>Complaints Inbox</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingComplaints ? (
              <LoadingSpinner text="Loading complaints..." />
            ) : complaints.length === 0 ? (
              <p className="text-sm text-muted-foreground">No complaints yet.</p>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="rounded-lg border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(complaint.created_at)}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{complaint.title || 'Untitled complaint'}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{complaint.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <select
                        value={complaint.status}
                        onChange={(e) => updateComplaint(complaint.id, { status: e.target.value })}
                        className="rounded-md border border-border bg-card px-2 py-1 text-xs"
                      >
                        <option value="new">new</option>
                        <option value="on_hold">on_hold</option>
                        <option value="resolved">resolved</option>
                        <option value="declined">declined</option>
                      </select>
                    </div>
                    <div className="mt-3">
                      <Textarea
                        label="Admin Notes"
                        rows={3}
                        value={complaintNotes[complaint.id] || ''}
                        onChange={(e) =>
                          setComplaintNotes((prev) => ({ ...prev, [complaint.id]: e.target.value }))
                        }
                      />
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateComplaint(complaint.id, {
                              admin_notes: complaintNotes[complaint.id] || '',
                            })
                          }
                        >
                          Save Notes
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'announcements' && (
        <Card>
          <CardHeader>
            <CardTitle>Create Admin Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Title (optional)" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} />
            <Textarea label="Body" rows={5} value={announcementBody} onChange={(e) => setAnnouncementBody(e.target.value)} />
            <div className="flex items-center gap-2">
              <input id="pin_post" type="checkbox" checked={announcementPinned} onChange={(e) => setAnnouncementPinned(e.target.checked)} />
              <label htmlFor="pin_post" className="text-sm text-foreground">Pin this post</label>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Attach Image (optional)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleAnnouncementImage(e.target.files?.[0] || null)} />
              {announcementImagePreview && (
                <img src={announcementImagePreview} alt="Announcement preview" className="h-36 rounded border border-border object-cover" />
              )}
            </div>
            <Button onClick={submitAnnouncement} isLoading={isSubmittingAnnouncement}>Publish Announcement</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
