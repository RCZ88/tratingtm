'use client';

import * as React from 'react';
import Link from 'next/link';
import { SuggestionForm, type SuggestionType } from '@/components/public/SuggestionForm';
import { SuggestionList } from '@/components/public/SuggestionList';
import { Lightbulb, UserPlus, Pencil } from 'lucide-react';

const tabs: Array<{ id: SuggestionType; label: string; description: string; icon: React.ReactNode }> = [
  {
    id: 'general',
    label: 'General Suggestions',
    description: 'Share ideas to improve the platform or add new features.',
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    id: 'teacher_add',
    label: 'Add a Teacher',
    description: 'Suggest a new teacher to add to the directory.',
    icon: <UserPlus className="h-4 w-4" />,
  },
  {
    id: 'teacher_modify',
    label: 'Modify Teacher',
    description: 'Suggest a change to a teacher subject or role.',
    icon: <Pencil className="h-4 w-4" />,
  },
];

export default function SuggestionsPage() {
  const [activeTab, setActiveTab] = React.useState<SuggestionType>('general');
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Suggestions</h1>
          <p className="mt-2 text-slate-600">
            Help us improve by sharing ideas, teacher additions, or subject updates.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-sm text-slate-600">
                {tabs.find((tab) => tab.id === activeTab)?.description}
              </p>
            </div>

            <div className="mt-6">
              <SuggestionForm
                type={activeTab}
                onSubmitted={() => setRefreshKey((k) => k + 1)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Suggestions
              </h2>
              <Link
                href="/suggestions/completed"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View completed
              </Link>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Vote on ideas you want to see implemented.
            </p>
            <div className="mt-4">
              <SuggestionList key={refreshKey} type={activeTab} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
