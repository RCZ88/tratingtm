'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  created_at?: string;
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [name, setName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const fetchDepartments = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/admin/departments');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load departments');
      }
      setDepartments(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add department');
      }
      setName('');
      fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add department');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/admin/departments/sync', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync departments');
      }
      setSuccess(
        data.message || `Synced ${data?.data?.departments || 0} departments.`
      );
      fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync departments');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (departmentId: string) => {
    const confirmed = window.confirm('Delete this department? This will also remove its subjects.');
    if (!confirmed) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/departments/${departmentId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete department');
      }
      fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Departments</h1>
          <p className="text-slate-600">
            Manage department options used across teacher forms and suggestions.
          </p>
        </div>
        <Button variant="outline" onClick={handleSync} isLoading={isSyncing}>
          Sync From Teachers
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <Input
              label="New Department"
              placeholder="e.g., Mathematics"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button onClick={handleAdd} isLoading={isSaving}>
              Add Department
            </Button>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Department
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-slate-500">
                      No departments yet.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {dept.name}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(dept.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        <AlertTriangle className="h-5 w-5" />
        <p>
          Deleting a department will also remove its subjects from the dropdowns.
          It does not change existing teacher records. Use sync to pull departments
          from existing teachers if the list is empty.
        </p>
      </div>
    </div>
  );
}
