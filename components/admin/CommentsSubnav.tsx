'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { href: '/admin/comments', label: 'All Comments', exact: true },
  { href: '/admin/moderation', label: 'Moderation Queue', exact: true },
  { href: '/admin/comments/words', label: 'Word Filter' },
  { href: '/admin/comments/reactions', label: 'Reactions' },
];

const CommentsSubnav: React.FC = () => {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            isActive(tab.href, tab.exact)
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};

export { CommentsSubnav };







