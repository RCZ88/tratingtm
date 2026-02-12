'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AdminSuggestion {
  id: string;
  type: string;
  title: string | null;
  description: string;
  status: string;
  teacher_name: string | null;
  department: string | null;
  subject: string | null;
  level: string | null;
  year_level: string | null;
  created_at: string;
  upvotes: number;
  downvotes: number;
}

const STATUS_OPTIONS = ['new', 'working', 'approved', 'declined', 'completed'];
const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'general', label: 'General' },
  { value: 'teacher_add', label: 'Teacher add' },
  { value: 'teacher_modify', label: 'Teacher modify' },
];

export default function AdminCompletedSuggestionsPage() {
  const [items, setItems] = React.useState<AdminSuggestion[]>([]);
  const [typeFilter, setTypeFilter] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSuggestions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'completed');
      if (typeFilter) params.set('type', typeFilter);
      const response = await fetch(`/api/suggestions?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setItems(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter]);

  React.useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchSuggestions();
      }
    } catch (error) {
      console.error('Error updating suggestion:', error);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Completed Suggestions</h1>
        <p className="text-muted-foreground">
          A history of suggestions that have been completed.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Type</label>
              <select
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                {TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={fetchSuggestions}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner text="Loading completed suggestions..." />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted p-8 text-center text-sm text-muted-foreground">
          No completed suggestions yet.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase text-emerald-700 dark:text-emerald-200">{item.type.replace('_', ' ')}</p>
                    <h3 className="text-lg font-semibold text-foreground">
                      {item.title || 'Untitled suggestion'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-1">
                      Up {item.upvotes}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1">
                      Down {item.downvotes}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.description}
                </p>
                {(item.teacher_name || item.subject) && (
                  <p className="text-xs text-muted-foreground">
                    {item.teacher_name ? `${item.teacher_name} • ` : ''}
                    {item.department ? `${item.department} • ` : ''}
                    {item.subject ? `${item.subject}` : ''}
                    {item.level ? ` • ${item.level}` : ''}
                    {item.year_level ? ` • ${item.year_level}` : ''}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    className="rounded-lg border border-border bg-card px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={item.status}
                    onChange={(event) => updateStatus(item.id, event.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}





