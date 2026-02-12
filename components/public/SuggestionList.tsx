'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { ThumbsUp, ThumbsDown, CheckCircle, Clock, XCircle, Wrench } from 'lucide-react';

export interface SuggestionItem {
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
  viewer_vote: 'up' | 'down' | null;
}

interface SuggestionListProps {
  type?: string;
  status?: string;
  emptyMessage?: string;
  className?: string;
  showVoting?: boolean;
}

const statusStyles: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  new: {
    label: 'New',
    icon: <Clock className="h-3.5 w-3.5" />,
    className: 'bg-muted text-foreground',
  },
  working: {
    label: 'Working',
    icon: <Wrench className="h-3.5 w-3.5" />,
    className: 'bg-amber-100 text-amber-700 dark:text-amber-200',
  },
  approved: {
    label: 'Approved',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200',
  },
  declined: {
    label: 'Declined',
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'bg-red-100 text-red-700 dark:text-red-300',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200',
  },
};

const SuggestionList: React.FC<SuggestionListProps> = ({  type,  status,  emptyMessage,  className,  showVoting = true,}) => {
  const [items, setItems] = React.useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSuggestions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const anonymousId = getAnonymousId();
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      params.set('anonymous_id', anonymousId);

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
  }, [type, status]);

  React.useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleVote = async (suggestionId: string, vote: 'up' | 'down') => {
    const previous = items;
    setItems((current) =>
      current.map((item) => {
        if (item.id !== suggestionId) return item;
        const currentVote = item.viewer_vote;
        const nextVote = currentVote === vote ? null : vote;
        let upvotes = item.upvotes;
        let downvotes = item.downvotes;

        if (currentVote === 'up') upvotes -= 1;
        if (currentVote === 'down') downvotes -= 1;
        if (nextVote === 'up') upvotes += 1;
        if (nextVote === 'down') downvotes += 1;

        return {
          ...item,
          viewer_vote: nextVote,
          upvotes: Math.max(0, upvotes),
          downvotes: Math.max(0, downvotes),
        };
      })
    );

    try {
      const anonymousId = getAnonymousId();
      const response = await fetch('/api/suggestions/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_id: suggestionId,
          anonymous_id: anonymousId,
          vote: items.find((item) => item.id === suggestionId)?.viewer_vote === vote ? null : vote,
        }),
      });

      if (!response.ok) {
        throw new Error('Vote failed');
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      setItems(previous);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading suggestions...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted p-6 text-center text-sm text-muted-foreground">
        {emptyMessage || 'No suggestions yet. Be the first to share one.'}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item) => {
        const statusMeta = statusStyles[item.status] || statusStyles.new;
        return (
          <div key={item.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {item.title || 'Untitled suggestion'}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                  {item.description}
                </p>
                {(item.teacher_name || item.subject) && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {item.teacher_name ? `${item.teacher_name} â€¢ ` : ''}
                    {item.department ? `${item.department} â€¢ ` : ''}
                    {item.subject ? `${item.subject}` : ''}
                    {item.level ? ` â€¢ ${item.level}` : ''}
                    {item.year_level ? ` â€¢ ${item.year_level}` : ''}
                  </p>
                )}
              </div>
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', statusMeta.className)}>
                {statusMeta.icon}
                {statusMeta.label}
              </span>
            </div>
            {showVoting && (
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => handleVote(item.id, 'up')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors',
                    item.viewer_vote === 'up'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  )}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {item.upvotes}
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(item.id, 'down')}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors',
                    item.viewer_vote === 'down'
                      ? 'bg-red-100 text-red-700 dark:text-red-300'
                      : 'bg-muted text-muted-foreground hover:bg-muted'
                  )}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                  {item.downvotes}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export { SuggestionList };










