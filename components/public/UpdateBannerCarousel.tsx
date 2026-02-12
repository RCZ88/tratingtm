'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Bell, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';

export type PublicUpdateItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
  teacher_id?: string | null;
  link_url?: string | null;
  teacher?: { id: string; name: string | null } | null;
};

interface UpdateBannerCarouselProps {
  className?: string;
}

export const UpdateBannerCarousel: React.FC<UpdateBannerCarouselProps> = ({ className }) => {
  const [items, setItems] = React.useState<PublicUpdateItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    const fetchUpdates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/updates/active');
        const data = await response.json();
        if (active && response.ok) {
          setItems(data.data || []);
          setActiveIndex(0);
        }
      } catch (error) {
        if (active) setItems([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchUpdates();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm', className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bell className="h-4 w-4" />
          Loading updates...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const current = items[Math.min(activeIndex, items.length - 1)];
  const total = items.length;

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % total);

  const linkUrl = current.link_url || (current.teacher_id ? `/teachers/${current.teacher_id}` : null);
  const linkLabel = current.teacher?.name ? `View ${current.teacher.name}` : 'View details';

  return (
    <div className={cn('rounded-2xl border border-emerald-500/30 bg-card p-5 shadow-sm', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Latest Updates
          </div>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{current.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{current.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{formatRelativeTime(current.created_at)}</span>
            <Link href="/changelog" className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-200 hover:text-emerald-800">
              View changelog
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {linkUrl && (
            <Link
              href={linkUrl}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {linkLabel}
            </Link>
          )}
        </div>
      </div>

      {items.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 dark:text-emerald-300"
              aria-label="Previous update"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:border-emerald-300 hover:text-emerald-600 dark:text-emerald-300"
              aria-label="Next update"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {items.map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'h-2 w-2 rounded-full transition-colors',
                  index === activeIndex ? 'bg-emerald-600' : 'bg-muted'
                )}
                aria-label={`Go to update ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};






