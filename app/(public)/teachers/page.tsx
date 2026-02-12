'use client';

import * as React from 'react';
import { TeacherGrid } from '@/components/public/TeacherGrid';
import { SearchBar } from '@/components/public/SearchBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TeacherWithStats, Department } from '@/lib/types/database';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { RatingExplainer } from '@/components/public/RatingExplainer';
import { WeeklyResetCountdown } from '@/components/public/WeeklyResetCountdown';
import { UpdateBannerCarousel } from '@/components/public/UpdateBannerCarousel';

/**
 * Teachers List Page
 * 
 * Browse all teachers with search, filter, and pagination.
 */

export default function TeachersPage() {
  const [teachers, setTeachers] = React.useState<TeacherWithStats[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [departmentId, setDepartmentId] = React.useState('');
  const [sortBy, setSortBy] = React.useState('name');
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = React.useState(false);
  const [ratingMode, setRatingMode] = React.useState<'weekly' | 'all_time'>('all_time');

  const fetchTeachers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      params.set('sort_by', sortBy);
      if (searchQuery) params.set('search', searchQuery);
      if (departmentId) params.set('department_id', departmentId);

      const response = await fetch(`/api/teachers?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTeachers(data.data);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, departmentId, sortBy]);

  React.useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  React.useEffect(() => {
    let active = true;
    const fetchDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const response = await fetch('/api/departments');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load departments');
        }
        if (active) {
          setDepartments(data.data || []);
        }
      } catch (error) {
        if (active) {
          setDepartments([]);
        }
      } finally {
        if (active) {
          setIsLoadingDepartments(false);
        }
      }
    };

    fetchDepartments();
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDepartmentId(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-card px-6 py-8 shadow-sm">
          <div className="absolute inset-0 leaf-pattern opacity-40" />
          <div className="relative">
            <h1 className="text-3xl font-bold text-foreground">Browse Teachers</h1>
            <p className="mt-2 text-muted-foreground">
              Find and rate teachers from all departments
            </p>
          </div>
        </div>        <div className="mb-6">
          <WeeklyResetCountdown />
        </div>
        <div className="mb-6">
          <UpdateBannerCarousel />
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-xl bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <SearchBar
                initialValue={searchQuery}
                onSearch={handleSearch}
                placeholder="Search by name..."
                showButton={false}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="w-40">
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={handleDepartmentChange}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Departments</option>
                  {isLoadingDepartments && (
                    <option value="" disabled>
                      Loading...
                    </option>
                  )}
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="name">Name</option>
                  <option value="created_at">Newest</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Rating View
                </label>
                <div className="inline-flex rounded-full border border-border bg-muted p-1 text-sm">
                  <button
                    type="button"
                    onClick={() => setRatingMode('weekly')}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      ratingMode === 'weekly'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                        : 'text-muted-foreground hover:bg-card'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingMode('all_time')}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      ratingMode === 'all_time'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                        : 'text-muted-foreground hover:bg-card'
                    }`}
                  >
                    All-Time
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <RatingExplainer />
        </div>

        {/* Results */}
        <TeacherGrid
          teachers={teachers}
          isLoading={isLoading}
          emptyMessage="No teachers found matching your criteria"
          ratingMode={ratingMode}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}










