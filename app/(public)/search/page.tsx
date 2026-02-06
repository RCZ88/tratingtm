import { Suspense } from 'react';
import SearchPageClient from './SearchPageClient';

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-6 h-12 w-full max-w-2xl animate-pulse rounded bg-slate-200" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchPageClient />
    </Suspense>
  );
}
