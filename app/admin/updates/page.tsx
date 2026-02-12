'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import { Teacher } from '@/lib/types/database';
import { Plus, Edit2, Eye, EyeOff, ExternalLink } from 'lucide-react';

interface UpdateItem {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
  updated_at: string;
  teacher_id?: string | null;
  link_url?: string | null;
  is_active: boolean;
  teacher?: { id: string; name: string | null } | null;
}

type TemplateType = 'new_teacher' | 'feature' | 'custom';

export default function AdminUpdatesPage() {
  const [updates, setUpdates] = React.useState<UpdateItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const [template, setTemplate] = React.useState<TemplateType>('custom');
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [linkUrl, setLinkUrl] = React.useState('');
  const [teacherId, setTeacherId] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = React.useState(false);

  const fetchUpdates = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/updates');
      const data = await response.json();
      if (response.ok) {
        setUpdates(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching updates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

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
          setTeachers(data.data || []);
        }
      } catch (err) {
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
    if (template !== 'new_teacher') return;
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;
    setTitle(`New teacher added: ${teacher.name}`);
    setBody(`You can now rate and comment on ${teacher.name}.`);
    if (!linkUrl) {
      setLinkUrl(`/teachers/${teacher.id}`);
    }
  }, [template, teacherId, teachers]);

  const resetForm = () => {
    setTemplate('custom');
    setTitle('');
    setBody('');
    setLinkUrl('');
    setTeacherId('');
    setIsActive(true);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        type: template,
        teacher_id: teacherId || null,
        link_url: linkUrl.trim() || null,
        is_active: isActive,
      };

      if (!payload.title || !payload.body) {
        setError('Title and content are required.');
        setIsSaving(false);
        return;
      }

      const response = await fetch(
        editingId ? `/api/admin/updates/${editingId}` : '/api/admin/updates',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save update');
      }

      setMessage(editingId ? 'Update saved.' : 'Update posted.');
      resetForm();
      fetchUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (item: UpdateItem) => {
    setTemplate((item.type as TemplateType) || 'custom');
    setTitle(item.title);
    setBody(item.body);
    setLinkUrl(item.link_url || '');
    setTeacherId(item.teacher_id || '');
    setIsActive(item.is_active);
    setEditingId(item.id);
  };

  const toggleActive = async (item: UpdateItem) => {
    try {
      const response = await fetch(`/api/admin/updates/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (response.ok) {
        fetchUpdates();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Public Updates</h1>
        <p className="text-muted-foreground">
          Post announcements that show on the public banner and changelog.
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Update' : 'Create Update'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Template</label>
            <div className="flex flex-wrap gap-2">
              {(['new_teacher', 'feature', 'custom'] as TemplateType[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTemplate(option)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    template === option
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {option === 'new_teacher'
                    ? 'New Teacher'
                    : option === 'feature'
                    ? 'New Feature'
                    : 'Custom'}
                </button>
              ))}
            </div>
          </div>

          {template === 'new_teacher' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Teacher</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <option value="">Select teacher</option>
                {isLoadingTeachers && <option>Loading...</option>}
                {!isLoadingTeachers && teachers.length === 0 && <option>No teachers found</option>}
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Title"
            placeholder="Update title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            label="Content"
            placeholder="Share what changed"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
          />

          <Input
            label="Optional Link"
            placeholder="/teachers/123 or https://..."
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            helperText="If empty, teacher updates will link automatically"
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="is_active" className="text-sm text-foreground">
              Active (visible in banner)
            </label>
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}
          {message && <p className="text-sm text-emerald-600 dark:text-emerald-300">{message}</p>}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSubmit} isLoading={isSaving} leftIcon={<Plus className="h-4 w-4" />}>
              {editingId ? 'Save Update' : 'Post Update'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No updates yet.</p>
          ) : (
            <div className="space-y-4">
              {updates.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(item.created_at)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                      {item.link_url && (
                        <Link href={item.link_url} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-200">
                          Open link
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Edit2 className="h-4 w-4" />}
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={item.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        onClick={() => toggleActive(item)}
                      >
                        {item.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}








