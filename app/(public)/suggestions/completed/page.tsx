'use client';

import * as React from 'react';
import Link from 'next/link';
import { SuggestionList } from '@/components/public/SuggestionList';
import { Lightbulb, UserPlus, Pencil } from 'lucide-react';

const tabs: Array<{ id: string; label: string; description: string; icon: React.ReactNode }> = [
  {
    id: 'general',
    label: 'General Suggestions',
    description: 'Completed platform improvements and ideas.',
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    id: 'teacher_add',
    label: 'Teacher Additions',
    description: 'Completed teacher additions for the directory.',
    icon: <UserPlus className="h-4 w-4" />,
  },
  {
    id: 'teacher_modify',
    label: 'Teacher Updates',
    description: 'Completed changes to teacher information.',
    icon: <Pencil className="h-4 w-4" />,
  },
];

export default function CompletedSuggestionsPage() {
  const [activeTab, setActiveTab] = React.useState('general');

  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Completed Suggestions</h1>
            <p className="mt-2 text-muted-foreground">
              See the ideas and requests we have already completed.
            </p>
          </div>
          <Link
            href="/suggestions"
            className="rounded-full border border-emerald-500/30 bg-card px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200 shadow-sm hover:border-emerald-300"
          >
            Back to suggestions
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                    : 'bg-muted text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              {tabs.find((tab) => tab.id === activeTab)?.description}
            </p>
          </div>

          <div className="mt-6">
            <SuggestionList
              type={activeTab}
              status="completed"
              emptyMessage="No completed suggestions yet."
            />
          </div>
        </div>
      </div>
    </div>
  );
}






