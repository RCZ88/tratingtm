'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SuggestionForm, type SuggestionType } from '@/components/public/SuggestionForm';
import { SuggestionList } from '@/components/public/SuggestionList';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import { normalizeReaction, THUMBS_DOWN, THUMBS_UP } from '@/lib/utils/commentReactions';
import { MessageSquare, ShieldCheck, Pin, Reply, AlertCircle } from 'lucide-react';

type ForumTab = 'forum' | 'suggestions' | 'complaints';

type ForumPost = {
  id: string;
  title: string | null;
  body: string;
  author_role: 'user' | 'admin';
  is_pinned: boolean;
  pinned_at: string | null;
  image_url: string | null;
  created_at: string;
  is_owner: boolean;
  emoji_counts: Record<string, number>;
  viewer_emojis: string[];
  reply_count: number;
};

type ForumReply = {
  id: string;
  post_id: string;
  parent_reply_id: string | null;
  body: string;
  author_role: 'user' | 'admin';
  image_url: string | null;
  created_at: string;
  is_owner: boolean;
  emoji_counts: Record<string, number>;
  viewer_emojis: string[];
};

const SUGGESTION_TYPES: SuggestionType[] = ['general', 'teacher_add', 'teacher_modify'];

async function uploadImage(file: File, anonymousId: string): Promise<{ path: string; signed_preview_url: string | null }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('anonymous_id', anonymousId);

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

function ForumPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedTab = (searchParams.get('tab') || 'forum') as ForumTab;
  const activeTab: ForumTab = ['forum', 'suggestions', 'complaints'].includes(requestedTab) ? requestedTab : 'forum';

  const anonymousId = React.useMemo(() => getAnonymousId(), []);

  const [posts, setPosts] = React.useState<ForumPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = React.useState(true);
  const [postSort, setPostSort] = React.useState<'newest' | 'top'>('newest');
  const [reactionEmojis, setReactionEmojis] = React.useState<string[]>([]);

  const [replyInputs, setReplyInputs] = React.useState<Record<string, string>>({});
  const [replyImagePath, setReplyImagePath] = React.useState<Record<string, string | null>>({});
  const [replyImagePreview, setReplyImagePreview] = React.useState<Record<string, string | null>>({});
  const [repliesByPost, setRepliesByPost] = React.useState<Record<string, ForumReply[]>>({});
  const [loadingRepliesFor, setLoadingRepliesFor] = React.useState<Record<string, boolean>>({});

  const [complaintTitle, setComplaintTitle] = React.useState('');
  const [complaintBody, setComplaintBody] = React.useState('');
  const [complaintImagePath, setComplaintImagePath] = React.useState<string | null>(null);
  const [complaintImagePreview, setComplaintImagePreview] = React.useState<string | null>(null);
  const [complaintMessage, setComplaintMessage] = React.useState<string | null>(null);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = React.useState(false);

  const [suggestionType, setSuggestionType] = React.useState<SuggestionType>('general');
  const [suggestionRefreshKey, setSuggestionRefreshKey] = React.useState(0);

  const suggestionView = searchParams.get('view');
  const suggestionStatus = searchParams.get('status');
  const resolvedPastStatus = suggestionStatus === 'declined' ? 'declined' : 'completed';

  const setTab = (tab: ForumTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    if (tab !== 'suggestions') {
      params.delete('view');
      params.delete('status');
    }
    router.replace(`/forum?${params.toString()}`);
  };

  const setSuggestionPastStatus = (status: 'completed' | 'declined') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'suggestions');
    params.set('view', 'past');
    params.set('status', status);
    router.replace(`/forum?${params.toString()}`);
  };

  const fetchPosts = React.useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const params = new URLSearchParams();
      params.set('anonymous_id', anonymousId);
      params.set('sort', postSort);
      params.set('limit', '40');
      const response = await fetch(`/api/forum/posts?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setPosts(data.data || []);
        setReactionEmojis(data.meta?.available_reaction_emojis || []);
      }
    } catch (error) {
      console.error('Error loading forum posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [anonymousId, postSort]);

  React.useEffect(() => {
    if (activeTab === 'forum') {
      fetchPosts();
    }
  }, [activeTab, fetchPosts]);

  const loadReplies = async (postId: string) => {
    setLoadingRepliesFor((prev) => ({ ...prev, [postId]: true }));
    try {
      const params = new URLSearchParams();
      params.set('post_id', postId);
      params.set('anonymous_id', anonymousId);
      const response = await fetch(`/api/forum/replies?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setRepliesByPost((prev) => ({ ...prev, [postId]: data.data || [] }));
      }
    } catch (error) {
      console.error('Error loading replies:', error);
    } finally {
      setLoadingRepliesFor((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const reactToItem = async (targetType: 'post' | 'reply', targetId: string, emoji: string) => {
    try {
      const response = await fetch('/api/forum/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          anonymous_id: anonymousId,
          emoji: normalizeReaction(emoji),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to react');
      }

      if (targetType === 'post') {
        await fetchPosts();
      } else {
        const postId = Object.keys(repliesByPost).find((id) => (repliesByPost[id] || []).some((r) => r.id === targetId));
        if (postId) await loadReplies(postId);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to react');
    }
  };

  const submitReply = async (postId: string, parentReplyId: string | null = null) => {
    const content = (replyInputs[postId] || '').trim();
    if (!content) return;

    try {
      const response = await fetch('/api/forum/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          parent_reply_id: parentReplyId,
          body: content,
          anonymous_id: anonymousId,
          image_path: replyImagePath[postId] || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit reply');
      }

      setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
      setReplyImagePath((prev) => ({ ...prev, [postId]: null }));
      setReplyImagePreview((prev) => ({ ...prev, [postId]: null }));
      await loadReplies(postId);
      alert('Reply submitted for moderation.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit reply');
    }
  };

  const handleReplyImageSelect = async (postId: string, file: File | null) => {
    if (!file) return;
    try {
      const uploaded = await uploadImage(file, anonymousId);
      setReplyImagePath((prev) => ({ ...prev, [postId]: uploaded.path }));
      setReplyImagePreview((prev) => ({ ...prev, [postId]: uploaded.signed_preview_url }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  const editPost = async (post: ForumPost) => {
    const nextBody = window.prompt('Edit post body', post.body);
    if (nextBody === null) return;
    try {
      const response = await fetch(`/api/forum/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: nextBody, title: post.title, anonymous_id: anonymousId, image_path: null }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to edit post');
      await fetchPosts();
      alert('Post updated and sent for moderation.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to edit post');
    }
  };

  const deletePost = async (postId: string) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      const response = await fetch(`/api/forum/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymous_id: anonymousId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete post');
      await fetchPosts();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete post');
    }
  };

  const editReply = async (postId: string, reply: ForumReply) => {
    const nextBody = window.prompt('Edit reply', reply.body);
    if (nextBody === null) return;
    try {
      const response = await fetch(`/api/forum/replies/${reply.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: nextBody, anonymous_id: anonymousId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to edit reply');
      await loadReplies(postId);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to edit reply');
    }
  };

  const deleteReply = async (postId: string, replyId: string) => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      const response = await fetch(`/api/forum/replies/${replyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymous_id: anonymousId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete reply');
      await loadReplies(postId);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete reply');
    }
  };

  const submitComplaint = async () => {
    setIsSubmittingComplaint(true);
    setComplaintMessage(null);
    try {
      const response = await fetch('/api/forum/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: complaintTitle,
          description: complaintBody,
          anonymous_id: anonymousId,
          image_path: complaintImagePath,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit complaint');
      }

      setComplaintTitle('');
      setComplaintBody('');
      setComplaintImagePath(null);
      setComplaintImagePreview(null);
      setComplaintMessage('Complaint submitted. Admins can review it privately.');
    } catch (error) {
      setComplaintMessage(error instanceof Error ? error.message : 'Failed to submit complaint');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const uploadComplaintImage = async (file: File | null) => {
    if (!file) return;
    try {
      const uploaded = await uploadImage(file, anonymousId);
      setComplaintImagePath(uploaded.path);
      setComplaintImagePreview(uploaded.signed_preview_url);
    } catch (error) {
      setComplaintMessage(error instanceof Error ? error.message : 'Failed to upload image');
    }
  };

  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Forum</h1>
          <p className="mt-2 text-muted-foreground">Discuss ideas, submit suggestions, and share private complaints.</p>
        </div>

        <Card className="mb-6 border-amber-500/30 bg-amber-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <ShieldCheck className="h-5 w-5" />
              Forum Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900 dark:text-amber-200">
            <ul className="list-disc space-y-1 pl-5">
              <li>Be respectful and constructive. Personal attacks are not allowed.</li>
              <li>No private/sensitive information. Posts and replies are moderated before going live.</li>
              <li>Complaints are private and visible only to admins.</li>
            </ul>
          </CardContent>
        </Card>

        <div className="mb-6 flex flex-wrap gap-2">
          {(['forum', 'suggestions', 'complaints'] as ForumTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'forum' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Forum Feed
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => router.push('/forum/compose')}>
                      Compose Post
                    </Button>
                    <div className="inline-flex rounded-full border border-border bg-muted p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setPostSort('newest')}
                        className={`rounded-full px-3 py-1 ${postSort === 'newest' ? 'bg-card text-foreground' : 'text-muted-foreground'}`}
                      >
                        Newest
                      </button>
                      <button
                        type="button"
                        onClick={() => setPostSort('top')}
                        className={`rounded-full px-3 py-1 ${postSort === 'top' ? 'bg-card text-foreground' : 'text-muted-foreground'}`}
                      >
                        Top
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingPosts ? (
                  <LoadingSpinner text="Loading forum posts..." />
                ) : posts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No approved forum posts yet.</p>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => {
                      const postReplies = repliesByPost[post.id] || [];
                      return (
                        <div key={post.id} className="rounded-xl border border-border bg-card p-4">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {post.author_role === 'admin' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-sky-700 dark:text-sky-300">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Admin
                              </span>
                            )}
                            {post.is_pinned && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 dark:text-amber-200">
                                <Pin className="h-3.5 w-3.5" />
                                Pinned
                              </span>
                            )}
                            <span>{formatRelativeTime(post.created_at)}</span>
                          </div>

                          {post.title && <h3 className="mt-2 text-base font-semibold text-foreground">{post.title}</h3>}
                          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{post.body}</p>

                          {post.image_url && (
                            <div className="mt-3">
                              <img src={post.image_url} alt="Forum post image" className="max-h-80 rounded-md border border-border object-cover" />
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {[THUMBS_UP, THUMBS_DOWN, ...reactionEmojis].filter((value, index, arr) => arr.indexOf(value) === index).map((emoji) => (
                              <button
                                key={`${post.id}-${emoji}`}
                                type="button"
                                onClick={() => reactToItem('post', post.id, emoji)}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                                  post.viewer_emojis.includes(emoji)
                                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                                    : 'border-border bg-muted text-muted-foreground hover:bg-card'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{post.emoji_counts?.[emoji] || 0}</span>
                              </button>
                            ))}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => loadReplies(post.id)} leftIcon={<Reply className="h-4 w-4" />}>
                              Replies ({post.reply_count})
                            </Button>
                            {post.is_owner && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => editPost(post)}>Edit</Button>
                                <Button size="sm" variant="danger" onClick={() => deletePost(post.id)}>Delete</Button>
                              </>
                            )}
                          </div>

                          <div className="mt-4 rounded-md border border-border bg-muted p-3">
                            <Textarea
                              label="Reply"
                              rows={2}
                              value={replyInputs[post.id] || ''}
                              onChange={(e) => setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Write a reply..."
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-3">
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => handleReplyImageSelect(post.id, e.target.files?.[0] || null)}
                              />
                              <Button size="sm" onClick={() => submitReply(post.id)}>
                                Reply (Moderated)
                              </Button>
                            </div>
                            {replyImagePreview[post.id] && (
                              <div className="mt-2">
                                <img src={replyImagePreview[post.id] || ''} alt="Reply image preview" className="h-36 rounded border border-border object-cover" />
                              </div>
                            )}
                          </div>

                          <div className="mt-3 space-y-3">
                            {loadingRepliesFor[post.id] ? (
                              <p className="text-xs text-muted-foreground">Loading replies...</p>
                            ) : postReplies.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No approved replies yet.</p>
                            ) : (
                              postReplies.map((reply) => (
                                <div key={reply.id} className="rounded-md border border-border bg-muted p-3">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {reply.author_role === 'admin' && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-sky-700 dark:text-sky-300">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Admin
                                      </span>
                                    )}
                                    <span>{formatRelativeTime(reply.created_at)}</span>
                                  </div>
                                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{reply.body}</p>
                                  {reply.image_url && (
                                    <div className="mt-2">
                                      <img src={reply.image_url} alt="Reply image" className="max-h-64 rounded border border-border object-cover" />
                                    </div>
                                  )}
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {[THUMBS_UP, THUMBS_DOWN, ...reactionEmojis].filter((value, index, arr) => arr.indexOf(value) === index).map((emoji) => (
                                      <button
                                        key={`${reply.id}-${emoji}`}
                                        type="button"
                                        onClick={() => reactToItem('reply', reply.id, emoji)}
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                                          reply.viewer_emojis.includes(emoji)
                                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                                        }`}
                                      >
                                        <span>{emoji}</span>
                                        <span>{reply.emoji_counts?.[emoji] || 0}</span>
                                      </button>
                                    ))}
                                    {reply.is_owner && (
                                      <>
                                        <Button size="sm" variant="outline" onClick={() => editReply(post.id, reply)}>Edit</Button>
                                        <Button size="sm" variant="danger" onClick={() => deleteReply(post.id, reply.id)}>Delete</Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Suggestion</CardTitle>
              </CardHeader>
              <CardContent>
                {suggestionView === 'past' ? (
                  <div className="rounded-lg border border-border bg-muted p-4">
                    <p className="text-sm text-muted-foreground">Viewing historical suggestions.</p>
                    <div className="mt-3 inline-flex rounded-full border border-border bg-card p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setSuggestionPastStatus('completed')}
                        className={`rounded-full px-3 py-1 ${resolvedPastStatus === 'completed' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200' : 'text-muted-foreground'}`}
                      >
                        Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuggestionPastStatus('declined')}
                        className={`rounded-full px-3 py-1 ${resolvedPastStatus === 'declined' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200' : 'text-muted-foreground'}`}
                      >
                        Declined
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {SUGGESTION_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSuggestionType(type)}
                          className={`rounded-full px-4 py-2 text-sm font-medium ${
                            suggestionType === type
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {type === 'general' ? 'General' : type === 'teacher_add' ? 'Add Teacher' : 'Modify Teacher'}
                        </button>
                      ))}
                    </div>
                    <SuggestionForm type={suggestionType} onSubmitted={() => setSuggestionRefreshKey((k) => k + 1)} />
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Suggestions Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <SuggestionList
                  key={`${suggestionRefreshKey}-${suggestionType}-${suggestionStatus || ''}-${suggestionView || ''}`}
                  type={suggestionView === 'past' ? undefined : suggestionType}
                  status={suggestionView === 'past' ? resolvedPastStatus : suggestionStatus || undefined}
                  showVoting={suggestionView !== 'past'}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'complaints' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Private Complaints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Complaints are anonymous and visible only to admins.
              </p>
              <Input label="Title (optional)" value={complaintTitle} onChange={(e) => setComplaintTitle(e.target.value)} placeholder="Short complaint title" />
              <Textarea
                label="Complaint"
                value={complaintBody}
                onChange={(e) => setComplaintBody(e.target.value)}
                placeholder="Describe the issue in detail"
                rows={5}
              />
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Attach Image (optional)</label>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => uploadComplaintImage(e.target.files?.[0] || null)} />
                {complaintImagePreview && (
                  <img src={complaintImagePreview} alt="Complaint preview" className="h-44 rounded-md border border-border object-cover" />
                )}
              </div>
              {complaintMessage && <p className="text-sm text-muted-foreground">{complaintMessage}</p>}
              <Button onClick={submitComplaint} isLoading={isSubmittingComplaint}>Submit Complaint</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ForumPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <LoadingSpinner text="Loading forum..." />
          </div>
        </div>
      }
    >
      <ForumPageClient />
    </Suspense>
  );
}
