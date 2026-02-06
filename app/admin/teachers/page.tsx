'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { Teacher } from '@/lib/types/database';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Upload,
  FileJson
} from 'lucide-react';

/**
 * Teacher Management Page
 * 
 * List all teachers with search, filter, and CRUD actions.
 */

export default function AdminTeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [teacherToDelete, setTeacherToDelete] = React.useState<Teacher | null>(null);

  const fetchTeachers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      params.set('include_inactive', 'true');
      if (searchQuery) params.set('search', searchQuery);

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
  }, [page, searchQuery]);

  React.useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleDelete = async () => {
    if (!teacherToDelete) return;

    try {
      const response = await fetch(`/api/teachers/${teacherToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteModalOpen(false);
        setTeacherToDelete(null);
        fetchTeachers();
      }
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const toggleActive = async (teacher: Teacher) => {
    try {
      const response = await fetch(`/api/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !teacher.is_active }),
      });

      if (response.ok) {
        fetchTeachers();
      }
    } catch (error) {
      console.error('Error toggling teacher status:', error);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
          <p className="text-slate-600">Manage teacher profiles</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/teachers/json">
            <Button variant="outline" leftIcon={<FileJson className="h-4 w-4" />}>
              Edit JSON
            </Button>
          </Link>
          <Link href="/admin/teachers/import">
            <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />}>
              Import JSON
            </Button>
          </Link>
          <Link href="/admin/teachers/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>
              Add Teacher
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* Teachers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No teachers found
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{teacher.name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {teacher.subject || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {teacher.department || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            teacher.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {teacher.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleActive(teacher)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title={teacher.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {teacher.is_active ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                          <Link href={`/admin/teachers/${teacher.id}/edit`}>
                            <button
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => {
                              setTeacherToDelete(teacher);
                              setDeleteModalOpen(true);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
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

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTeacherToDelete(null);
        }}
        title="Delete Teacher"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <p className="mt-4 text-slate-600">
            Are you sure you want to delete <strong>{teacherToDelete?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setDeleteModalOpen(false);
                setTeacherToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
