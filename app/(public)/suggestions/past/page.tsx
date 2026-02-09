'use client';

import * as React from 'react';
import Link from 'next/link';
import { SuggestionList } from '@/components/public/SuggestionList';

const tabs = [
  { id: 'completed', label: 'Completed' },
  { id: 'declined', label: 'Declined' },
] as const;

type PastTab = (typeof tabs)[number]['id'];

export default function PastSuggestionsPage() {
  const [activeTab, setActiveTab] = React.useState<PastTab>('completed');

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Past Suggestions</h1>
            <p className="text-slate-600">
              See suggestions that have been completed or declined.
            </p>
          </div>
          <Link
            href="/suggestions"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-300"
          >
            Back to suggestions
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
    </div>
  );
}
