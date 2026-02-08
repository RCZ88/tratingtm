'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Pencil, Trash2, X, Check } from 'lucide-react';

interface Department {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  department_id: string;
  department?: string | null;
}

export default function AdminSubjectsPage() {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [departmentId, setDepartmentId] = React.useState('');
  const [name, setName] = React.useState('');
  const [filterDepartment, setFilterDepartment] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [editingDepartmentId, setEditingDepartmentId] = React.useState('');

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [deptResponse, subjectResponse] = await Promise.all([
        fetch('/api/admin/departments'),
        fetch('/api/admin/subjects'),
      ]);

      const deptData = await deptResponse.json();
      const subjectData = await subjectResponse.json();

      if (!deptResponse.ok) {
        throw new Error(deptData.error || 'Failed to load departments');
      }
      if (!subjectResponse.ok) {
        throw new Error(subjectData.error || 'Failed to load subjects');
      }

      setDepartments(deptData.data || []);
      setSubjects(subjectData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed || !departmentId) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, department_id: departmentId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add subject');
      }
      setName('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subject');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (subjectId: string) => {
    const confirmed = window.confirm('Delete this subject?');
    if (!confirmed) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete subject');
      }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subject');
    }
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setEditingName(subject.name);
    setEditingDepartmentId(subject.department_id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingDepartmentId('');
  };

  const handleUpdate = async (subjectId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed || !editingDepartmentId) return;
    setError(null);
    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, department_id: editingDepartmentId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subject');
      }
      cancelEdit();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subject');
    }
  };

  const filteredSubjects = filterDepartment
    ? subjects.filter((subject) => subject.department_id === filterDepartment)
    : subjects;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-600">
            Manage subject options used across teacher forms and suggestions.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Department
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="New Subject"
              placeholder="e.g., Physics"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button onClick={handleAdd} isLoading={isSaving}>
              Add Subject
            </Button>
          </div>
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">Filter by department</label>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={filterDepartment}
          onChange={(event) => setFilterDepartment(event.target.value)}
        >
          <option value="">All departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Subject
                  </th>
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
                    <td colSpan={3} className="py-8 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No subjects found.
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {editingId === subject.id ? (
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                          />
                        ) : (
                          subject.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {editingId === subject.id ? (
                          <select
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={editingDepartmentId}
                            onChange={(event) => setEditingDepartmentId(event.target.value)}
                          >
                            <option value="">Select department</option>
                            {departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          subject.department || '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {editingId === subject.id ? (
                            <>
                              <button
                                onClick={() => handleUpdate(subject.id)}
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
                              onClick={() => startEdit(subject)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(subject.id)}
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
    </div>
  );
}
