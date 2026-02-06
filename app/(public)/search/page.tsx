'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { TeacherGrid } from '@/components/public/TeacherGrid';
import { SearchBar } from '@/components/public/SearchBar';
import { Button } from '@/components/ui/Button';
import { TeacherWithStats } from '@/lib/types/database';
import { Search, Users, BookOpen } from 'lucide-react';

/**
 * Search Page
 * 
 * Search results page with filters and sorting.
 */

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = React.useState(initialQuery);
  const [teachers, setTeachers] = React.useState<TeacherWithStats[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  const performSearch = React.useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTeachers([]);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      params.set('search', searchQuery);
      params.set('limit', '50');

      const response = await fetch(`/api/teachers?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTeachers(data.data);
      }
    } catch (error) {
      console.error('Error searching teachers:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    performSearch(newQuery);

    // Update URL
    const url = newQuery
      ? `/search?q=${encodeURIComponent(newQuery)}`
      : '/search';
    window.history.pushState({}, '', url);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Search Teachers</h1>
          <p className="mt-2 text-slate-600">
            Find teachers by name, subject, or department
          </p>
        </div>

        {/* Search Bar */}
        <div className="mx-auto mb-10 max-w-2xl">
          <SearchBar
            initialValue={query}
            onSearch={handleSearch}
            placeholder="Search teachers..."
            size="lg"
            autoFocus
          />
        </div>

        {/* Results */}
        {hasSearched && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {isLoading ? (
                  'Searching...'
                ) : (
                  <>
                    {teachers.length} result{teachers.length !== 1 ? 's' : ''} for "{query}"
                  </>
                )}
              </h2>
            </div>

            <TeacherGrid
              teachers={teachers}
              isLoading={isLoading}
              emptyMessage={`No teachers found matching "${query}"`}
            />
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
              <Search className="h-10 w-10 text-indigo-600" />
            </div>
            <h2 className="mt-6 text-xl font-semibold text-slate-900">
              Start Searching
            </h2>
            <p className="mx-auto mt-2 max-w-md text-slate-600">
              Enter a teacher&apos;s name, subject, or department above to find them in our directory.
            </p>

            {/* Quick Categories */}
            <div className="mt-10">
              <p className="mb-4 text-sm font-medium text-slate-500">
                Or browse by category:
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Mathematics', 'Science', 'English', 'History', 'Arts'].map(
                  (subject) => (
                    <button
                      key={subject}
                      onClick={() => handleSearch(subject)}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-500 hover:text-indigo-600"
                    >
                      {subject}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
