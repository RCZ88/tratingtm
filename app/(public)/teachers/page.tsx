'use client';

import * as React from 'react';
import { TeacherGrid } from '@/components/public/TeacherGrid';
import { SearchBar } from '@/components/public/SearchBar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TeacherWithStats, Department } from '@/lib/types/database';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-white px-6 py-8 shadow-sm">
          <div className="absolute inset-0 leaf-pattern opacity-40" />
          <div className="relative">
            <h1 className="text-3xl font-bold text-slate-900">Browse Teachers</h1>
            <p className="mt-2 text-slate-600">
              Find and rate teachers from all departments
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <SearchBar
                initialValue={searchQuery}
                onSearch={handleSearch}
                placeholder="Search by name..."
                showButton={false}
              />
            </div>
            <div className="flex gap-4">
              <div className="w-40">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Department
                </label>
                <select
                  value={department}
                  onChange={handleDepartmentChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="name">Name</option>
                  <option value="created_at">Newest</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <TeacherGrid
          teachers={teachers}
          isLoading={isLoading}
          emptyMessage="No teachers found matching your criteria"
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
            <span className="text-sm text-slate-600">
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
