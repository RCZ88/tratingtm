'use client';

import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime } from '@/lib/utils/dateHelpers';
import { MessageSquare, Star } from 'lucide-react';

export type ActivityItem = {
  id: string;
  type: 'rating' | 'comment';
  teacher_id: string;
  teacher_name: string | null;
  created_at: string;
};

interface ActivityFeedProps {
  initialItems?: ActivityItem[];
  limit?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  initialItems = [],
  limit = 20,
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

    const handleInsert = async (payload: any, type: ActivityItem['type']) => {
      const record = payload?.new;
      if (!record) return;
      if (type === 'comment' && !record.is_approved) return;

      const teacherId = record.teacher_id as string;
      const teacherName = await ensureTeacherName(teacherId);

      const next: ActivityItem = {
        id: `${type}_${record.id}`,
        type,
        teacher_id: teacherId,
        teacher_name: teacherName,
        created_at: record.created_at,
      };

      setItems((prev) => {
        const exists = prev.some((item) => item.id === next.id);
        if (exists) return prev;
        const updated = [next, ...prev];
        return updated.slice(0, limit);
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
      )      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'comments', filter: 'is_approved=eq.true' },
        (payload) => handleInsert(payload, 'comment')
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live Activity
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No recent activity yet.</p>
      ) : (
        <ul className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-slate-100 p-2 text-slate-600">
                  {item.type === 'comment' ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : (
                    <Star className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <p className="text-slate-700">
                    {item.type === 'comment' ? 'New comment on' : 'New rating for'}{' '}
                    {item.teacher_id ? (
                      <Link
                        href={`/teachers/${item.teacher_id}`}
                        className="font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        {item.teacher_name || 'Teacher'}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-700">Teacher</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{formatRelativeTime(item.created_at)}</p>
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


