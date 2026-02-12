'use client';

import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import { MessageSquare, Star, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ActivityItem = {
  id: string;
  type: 'rating' | 'comment' | 'reply';
  teacher_id: string;
  teacher_name: string | null;
  created_at: string;
};

interface ActivityFeedProps {
  initialItems?: ActivityItem[];
  limit?: number;
  className?: string;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  initialItems = [],
  limit = 20,
  className,
}) => {
  const [items, setItems] = React.useState<ActivityItem[]>(initialItems);
  const teacherCacheRef = React.useRef<Record<string, string>>({});

  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  React.useEffect(() => {
    const supabase = createClient();

    const ensureTeacherName = async (teacherId: string) => {
      if (teacherCacheRef.current[teacherId]) {
        return teacherCacheRef.current[teacherId];
      }

      const { data } = await supabase
        .from('teachers')
        .select('id, name')
        .eq('id', teacherId)
        .maybeSingle();

      if (data?.name) {
        teacherCacheRef.current[teacherId] = data.name;
        return data.name;
      }

      return null;
    };

    const pushItem = async (input: {
      id: string;
      type: ActivityItem['type'];
      teacher_id: string;
      created_at: string;
    }) => {
      const teacherName = await ensureTeacherName(input.teacher_id);
      const next: ActivityItem = {
        ...input,
        teacher_name: teacherName,
      };

      setItems((prev) => {
        const exists = prev.some((item) => item.id === next.id);
        if (exists) return prev;
        const updated = [next, ...prev];
        return updated.slice(0, limit);
      });
    };

    const handleInsert = async (payload: any, type: ActivityItem['type']) => {
      const record = payload?.new;
      if (!record) return;

      if (type === 'comment' || type === 'reply') {
        if (!record.is_approved || record.is_flagged) return;
      }

      await pushItem({
        id: `${type}_${record.id}`,
        type,
        teacher_id: record.teacher_id,
        created_at: record.created_at,
      });
    };

    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ratings' },
        (payload) => handleInsert(payload, 'rating')
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => handleInsert(payload, 'comment')
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: 'is_approved=eq.true' },
        (payload) => handleInsert(payload, 'comment')
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comment_replies' },
        async (payload: any) => {
          const record = payload?.new;
          if (!record) return;
          if (!record.is_approved || record.is_flagged) return;

          const { data: comment } = await supabase
            .from('comments')
            .select('teacher_id')
            .eq('id', record.comment_id)
            .maybeSingle();

          if (!comment?.teacher_id) return;

          await pushItem({
            id: `reply_${record.id}`,
            type: 'reply',
            teacher_id: comment.teacher_id,
            created_at: record.created_at,
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comment_replies', filter: 'is_approved=eq.true' },
        async (payload: any) => {
          const record = payload?.new;
          if (!record || record.is_flagged) return;

          const { data: comment } = await supabase
            .from('comments')
            .select('teacher_id')
            .eq('id', record.comment_id)
            .maybeSingle();

          if (!comment?.teacher_id) return;

          await pushItem({
            id: `reply_${record.id}`,
            type: 'reply',
            teacher_id: comment.teacher_id,
            created_at: record.created_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Live Activity
        </div>
        <span className="text-xs text-muted-foreground">Latest {limit}</span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No recent activity yet.</p>
      ) : (
        <ul className="mt-3 max-h-[24rem] divide-y divide-border overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.id} className="animate-fade-up py-3 first:pt-0">
              <div className="flex items-start gap-3 text-sm">
                <div className="mt-0.5 rounded-xl bg-muted/70 p-2 text-muted-foreground">
                  {item.type === 'comment' ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : item.type === 'reply' ? (
                    <CornerDownRight className="h-4 w-4" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-foreground">
                    {item.type === 'comment'
                      ? 'New comment on'
                      : item.type === 'reply'
                      ? 'New reply on'
                      : 'New rating for'}{' '}
                    {item.teacher_id ? (
                      <Link
                        href={`/teachers/${item.teacher_id}`}
                        className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-200 dark:hover:text-emerald-100"
                      >
                        {item.teacher_name || 'Teacher'}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">Teacher</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(item.created_at)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export { ActivityFeed };
