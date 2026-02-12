'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CommentsSubnav } from '@/components/admin/CommentsSubnav';
import { Trash2 } from 'lucide-react';

type ReactionEmoji = {
  id: string;
  emoji: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
};

export default function AdminCommentReactionsPage() {
  const [rows, setRows] = React.useState<ReactionEmoji[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [newEmoji, setNewEmoji] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadRows = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/comment-reaction-emojis');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load emojis');
      setRows(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emojis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadRows();
  }, [loadRows]);

  const addEmoji = async () => {
    const emoji = newEmoji.trim();
    if (!emoji) return;
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/comment-reaction-emojis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add emoji');
      setNewEmoji('');
      setMessage('Reaction emoji added.');
      loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add emoji');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEmoji = async (row: ReactionEmoji) => {
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/comment-reaction-emojis/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !row.enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update emoji');
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, enabled: !row.enabled } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update emoji');
    }
  };

  const deleteEmoji = async (id: string) => {
    const confirmed = window.confirm('Remove this emoji from the available reactions?');
    if (!confirmed) return;
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/comment-reaction-emojis/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to remove emoji');
      setRows((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove emoji');
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <CommentsSubnav />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reactions</h1>
        <p className="text-muted-foreground">Manage which emoji reactions users can use on comments.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add reaction emoji</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Input
              label="Emoji"
              placeholder="e.g., ??"
              value={newEmoji}
              onChange={(event) => setNewEmoji(event.target.value)}
            />
            <Button onClick={addEmoji} isLoading={isSaving}>
              Add Emoji
            </Button>
          </div>
          {error && (
            <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-300">{error}</div>
          )}
          {message && (
            <div className="rounded-lg bg-emerald-500/10 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-200">{message}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available emoji reactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emoji</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enabled</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      No emojis configured yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-2xl">{row.emoji}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <button
                          onClick={() => toggleEmoji(row)}
                          className={
                            row.enabled
                              ? 'rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-200'
                              : 'rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground'
                          }
                        >
                          {row.enabled ? 'Enabled (click to disable)' : 'Disabled (click to enable)'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteEmoji(row.id)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:text-red-300"
                          title="Remove emoji"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
