'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Palette, Pencil, Trash2, X, Check } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  color_hex?: string;
  created_at?: string;
}

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [name, setName] = React.useState('');
  const [colorHex, setColorHex] = React.useState('#16a34a');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [editingColor, setEditingColor] = React.useState('#16a34a');

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
        body: JSON.stringify({ name: trimmed, color_hex: colorHex }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add department');
      }
      setName('');
      setColorHex('#16a34a');
      fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add department');
    } finally {
      setIsSaving(false);
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

  const startEdit = (dept: Department) => {
    setEditingId(dept.id);
    setEditingName(dept.name);
    setEditingColor(dept.color_hex || '#16a34a');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingColor('#16a34a');
  };

  const handleUpdate = async (departmentId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/departments/${departmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, color_hex: editingColor }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update department');
      }
      setSuccess('Department updated');
      cancelEdit();
      fetchDepartments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update department');
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
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
            <Input
              label="New Department"
              placeholder="e.g., Mathematics"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tag Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(event) => setColorHex(event.target.value)}
                  className="h-10 w-10 cursor-pointer rounded border border-slate-300 bg-white p-1"
                  aria-label="Department color"
                />
                <Input
                  value={colorHex}
                  onChange={(event) => setColorHex(event.target.value)}
                  className="w-28"
                />
              </div>
            </div>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tag Color
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No departments yet.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {editingId === dept.id ? (
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                          />
                        ) : (
                          dept.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {editingId === dept.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editingColor}
                              onChange={(event) => setEditingColor(event.target.value)}
                              className="h-9 w-9 cursor-pointer rounded border border-slate-300 bg-white p-1"
                              aria-label="Edit department color"
                            />
                            <Input
                              value={editingColor}
                              onChange={(event) => setEditingColor(event.target.value)}
                              className="w-28"
                            />
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full border"
                              style={{ backgroundColor: dept.color_hex || '#16a34a' }}
                            >
                              <Palette className="h-3.5 w-3.5 text-white" />
                            </span>
                            <span>{dept.color_hex || '#16a34a'}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingId === dept.id ? (
                            <>
                              <button
                                onClick={() => handleUpdate(dept.id)}
                                className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50"
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => startEdit(dept)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(dept.id)}
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

      <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
        Deleting a department will also remove its subjects from the dropdowns.
      </div>
    </div>
  );
}
