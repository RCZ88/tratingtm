'use client';

import * as React from 'react';
import Link from 'next/link';
import { SuggestionList } from '@/components/public/SuggestionList';

const tabs = [
  { id: 'completed', label: 'Completed' },
  { id: 'declined', label: 'Declined' },
] as const;

type PastTab = (typeof tabs)[number]['id'];

export default function AdminPastSuggestionsPage() {
  const [activeTab, setActiveTab] = React.useState<PastTab>('completed');

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Past Suggestions</h1>
          <p className="text-muted-foreground">
            Review suggestions that have been completed or declined.
          </p>
        </div>
        <Link
          href="/admin/suggestions"
          className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:border-border"
        >
          Back to suggestions
        </Link>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                  : 'bg-muted text-muted-foreground hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <SuggestionList
        status={activeTab}
        showVoting={false}
        emptyMessage={
          activeTab === 'completed'
            ? 'No completed suggestions yet.'
            : 'No declined suggestions yet.'
        }
      />
    </div>
  );
}






