'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CommentsSubnav } from '@/components/admin/CommentsSubnav';
import { Trash2, AlertTriangle } from 'lucide-react';

interface BannedWord {
  id: string;
  word: string;
  enabled: boolean | null;
  created_at: string;
}

export default function AdminBannedWordsPage() {
  const [words, setWords] = React.useState<BannedWord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isPurging, setIsPurging] = React.useState(false);
  const [isCopying, setIsCopying] = React.useState(false);
  const [copyScope, setCopyScope] = React.useState<'all' | 'enabled' | 'disabled'>('all');
  const [copyFormat, setCopyFormat] = React.useState<'newline' | 'comma' | 'json'>('newline');
  const [newWord, setNewWord] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchWords = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/banned-words');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load banned words');
      }
      setWords(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load banned words');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const handleAdd = async () => {
    const trimmed = newWord.trim();
    if (!trimmed) return;
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/banned-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add word');
      }
      setNewWord('');
      fetchWords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add word');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (word: BannedWord) => {
    try {
      const response = await fetch(/api/admin/banned-words/, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !word.enabled }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update word');
      }
      setWords((prev) =>
        prev.map((item) => (item.id === word.id ? { ...item, enabled: !word.enabled } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update word');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this banned word?');
    if (!confirmed) return;
    try {
      const response = await fetch(/api/admin/banned-words/, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete word');
      }
      fetchWords();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete word');
    }
  };

  const handleCopy = async () => {
    setIsCopying(true);
    setError(null);
    setMessage(null);
    try {
      const filtered = words.filter((word) => {
        if (copyScope === 'enabled') return word.enabled === true;
        if (copyScope === 'disabled') return word.enabled !== true;
        return true;
      });

      const list = filtered.map((word) => word.word.trim()).filter(Boolean);
      let payload = list.join('\n');
      if (copyFormat === 'comma') payload = list.join(', ');
      if (copyFormat === 'json') payload = JSON.stringify(list);

      await navigator.clipboard.writeText(payload);
      setMessage(Copied  word to clipboard.);
    } catch (err) {
      setError('Failed to copy banned words.');
    } finally {
      setIsCopying(false);
    }
  };

  const handlePurge = async () => {
    const confirmed = window.confirm(
      'Delete all comments containing banned words? This cannot be undone.'
    );
    if (!confirmed) return;

    setIsPurging(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/comments/purge', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to purge comments');
      }
      setMessage(${data.deleted || 0} comments deleted.);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to purge comments');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <CommentsSubnav />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Word Filter</h1>
        <p className="text-slate-600">
          Manage banned words and purge existing comments that contain them.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add a banned word</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Input
              label="Word or phrase"
              placeholder="e.g., inappropriate term"
              value={newWord}
              onChange={(event) => setNewWord(event.target.value)}
            />
            <Button onClick={handleAdd} isLoading={isSaving}>
              Add Word
            </Button>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Banned words list</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="copy-scope">
              Copy scope
            </label>
            <select
              id="copy-scope"
              value={copyScope}
              onChange={(event) => setCopyScope(event.target.value as typeof copyScope)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="all">Copy all</option>
              <option value="enabled">Copy enabled</option>
              <option value="disabled">Copy disabled</option>
            </select>
            <label className="sr-only" htmlFor="copy-format">
              Copy format
            </label>
            <select
              id="copy-format"
              value={copyFormat}
              onChange={(event) => setCopyFormat(event.target.value as typeof copyFormat)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="newline">Format: newline</option>
              <option value="comma">Format: comma</option>
              <option value="json">Format: JSON</option>
            </select>
            <Button variant="outline" onClick={handleCopy} isLoading={isCopying}>
              Copy list
            </Button>
            <Button variant="danger" onClick={handlePurge} isLoading={isPurging}>
              Purge Comments
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Word
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Enabled
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : words.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No banned words yet.
                    </td>
                  </tr>
                ) : (
                  words.map((word) => (
                    <tr key={word.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {word.word}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <button
                          onClick={() => handleToggle(word)}
                          className={
                            word.enabled
                              ? 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'
                              : 'rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500'
                          }
                        >
                          {word.enabled ? 'Enabled (click to disable)' : 'Disabled (click to enable)'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(word.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
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

      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        <AlertTriangle className="h-5 w-5" />
        <p>
          Purge will permanently delete comments containing banned words. Use with care.
        </p>
      </div>
    </div>
  );
}

