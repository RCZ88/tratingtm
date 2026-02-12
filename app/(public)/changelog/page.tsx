'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';

interface UpdateItem {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
  teacher_id?: string | null;
  link_url?: string | null;
  teacher?: { id: string; name: string | null } | null;
}

export default function ChangelogPage() {
  const [items, setItems] = React.useState<UpdateItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const loadUpdates = React.useCallback(async (pageToLoad: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', pageToLoad.toString());
      params.set('limit', '20');
      const response = await fetch(`/api/updates/changelog?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        const nextItems = data.data || [];
        setItems((prev) => (pageToLoad === 1 ? nextItems : [...prev, ...nextItems]));
        setHasMore(nextItems.length === 20);
      }
    } catch (error) {
      setItems((prev) => prev);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadUpdates(1);
  }, [loadUpdates]);

  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Changelog</h1>
          <p className="mt-2 text-muted-foreground">Past updates and announcements</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Updates</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && items.length === 0 ? (
              <div className="py-10">
                <LoadingSpinner size="md" text="Loading updates..." />
              </div>
            ) : items.length === 0 ? (
              <p className="text-center text-muted-foreground">No updates yet.</p>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const linkUrl = item.link_url || (item.teacher_id ? `/teachers/${item.teacher_id}` : null);
                  return (
                    <div key={item.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                          <span className="text-xs text-muted-foreground">{formatRelativeTime(item.created_at)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.body}</p>
                        {linkUrl && (
                          <Link href={linkUrl} className="text-sm font-medium text-emerald-700 dark:text-emerald-200 hover:text-emerald-800">
                            View details
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasMore && !isLoading && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    loadUpdates(next);
                  }}
                >
                  Load more
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





