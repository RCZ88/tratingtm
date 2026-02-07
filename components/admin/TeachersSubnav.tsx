'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { href: '/admin/teachers', label: 'Teachers' },
  { href: '/admin/teachers/departments', label: 'Departments' },
  { href: '/admin/teachers/subjects', label: 'Subjects' },
];

const TeachersSubnav: React.FC = () => {
  const pathname = usePathname();
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            isActive(tab.href)
              ? 'bg-emerald-100 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};

export { TeachersSubnav };
