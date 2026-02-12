'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import type { TeacherWithStats, Department, Subject } from '@/lib/types/database';
import { validate, teacherSchema, type TeacherInput } from '@/lib/utils/validation';
import { LEVELS } from '@/lib/constants/suggestions';
import { splitSubjectList, normalizeSubjectName } from '@/lib/utils/subjectParsing';

/**
 * TeacherForm Component
 * 
 * Form for creating or editing teacher profiles.
 * Includes validation and error handling.
 */

export interface TeacherFormProps {
  teacher?: TeacherWithStats;
  onSuccess?: () => void;
  className?: string;
}

interface FormState {
  name: string;
  subject_ids: string[];
  department_id: string;
  levels: Array<'SL' | 'HL'>;
  year_levels: number[];
  bio: string;
  image_url: string;
  is_active: boolean;
  manual_subjects: string;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, onSuccess, className }) => {
  const router = useRouter();
  const isEditing = !!teacher;

  const [state, setState] = React.useState<FormState>({
    name: teacher?.name || '',
    subject_ids:
      teacher?.subject_ids ||
      (teacher?.subjects ? teacher.subjects.map((subject) => subject.id) : []),
    department_id: teacher?.department_id || teacher?.department?.id || '',
    levels: (teacher?.levels as Array<'SL' | 'HL'>) || [],
    year_levels: teacher?.year_levels || [],
    bio: teacher?.bio || '',
    image_url: teacher?.image_url || '',
    is_active: teacher?.is_active ?? true,
    manual_subjects: teacher?.subjects ? teacher.subjects.map((s) => s.name).join(', ') : '',
    errors: {},
    isSubmitting: false,
  });
  const [useManualInput, setUseManualInput] = React.useState(false);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [subjectsByDepartment, setSubjectsByDepartment] = React.useState<Record<string, Subject[]>>({});
  const [isLoadingDepartments, setIsLoadingDepartments] = React.useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = React.useState(false);
  const [postUpdate, setPostUpdate] = React.useState(false);

  const handleChange = (field: keyof FormState, value: string | boolean | string[] | number[]) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: '' },
    }));
  };

  const toggleArrayValue = <T extends string | number>(field: keyof FormState, value: T) => {
    setState((prev) => {
      const current = (prev[field] as T[]) || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [field]: exists ? current.filter((v) => v !== value) : [...current, value],
        errors: { ...prev.errors, [field]: '' },
      };
    });
  };

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

  React.useEffect(() => {
    if (!state.department_id) {
      if (state.subject_ids.length > 0) {
        setState((prev) => ({ ...prev, subject_ids: [] }));
      }
      return;
    }

    let active = true;
    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        const params = new URLSearchParams();
        params.set('department_id', state.department_id);
        const response = await fetch(`/api/subjects?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load subjects');
        }

        const subjectRows = (data.data || []) as Subject[];

        if (active) {
          setSubjectsByDepartment((prev) => ({
            ...prev,
            [state.department_id]: subjectRows,
          }));
          const validIds = new Set(subjectRows.map((subject) => subject.id));
          setState((prev) => ({
            ...prev,
            subject_ids: prev.subject_ids.filter((id) => validIds.has(id)),
          }));
        }
      } catch (error) {
        if (active) {
          setSubjectsByDepartment((prev) => ({
            ...prev,
            [state.department_id]: prev[state.department_id] || [],
          }));
        }
      } finally {
        if (active) {
          setIsLoadingSubjects(false);
        }
      }
    };

    fetchSubjects();
    return () => {
      active = false;
    };
  }, [state.department_id]);

  const resolveManualSubjectIds = async (): Promise<string[]> => {
    const departmentId = state.department_id;
    if (!departmentId) return [];

    const subjectNames = splitSubjectList(state.manual_subjects).map(normalizeSubjectName);
    if (subjectNames.length === 0) return [];

    const existing = subjectsByDepartment[departmentId] || [];
    const existingMap = new Map(existing.map((subject) => [subject.name.toLowerCase(), subject.id]));

    const ids: string[] = [];
    const missing: string[] = [];

    subjectNames.forEach((name) => {
      const id = existingMap.get(name.toLowerCase());
      if (id) {
        ids.push(id);
      } else {
        missing.push(name);
      }
    });

    if (missing.length > 0) {
      const created = await Promise.all(
        missing.map(async (name) => {
          const response = await fetch('/api/admin/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, department_id: departmentId }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Failed to create subject');
          }
          return data.data as Subject;
        })
      );

      created.forEach((subject) => {
        ids.push(subject.id);
      });

      setSubjectsByDepartment((prev) => ({
        ...prev,
        [departmentId]: [...existing, ...created],
      }));
    }

    return Array.from(new Set(ids));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const subjectIds = useManualInput ? await resolveManualSubjectIds() : state.subject_ids;

    const formData: TeacherInput = {
      name: state.name,
      department_id: state.department_id || null,
      subject_ids: subjectIds.length ? subjectIds : null,
      levels: state.levels.length ? state.levels : null,
      year_levels: state.year_levels.length ? state.year_levels : null,
      bio: state.bio || null,
      image_url: state.image_url || null,
      is_active: state.is_active,
    };

    const validation = validate(teacherSchema, formData);

    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.errors.forEach((error) => {
        const field = error.split(':')[0];
        errors[field] = error.split(':')[1]?.trim() || 'Invalid value';
      });
      setState((prev) => ({ ...prev, errors }));
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const url = isEditing ? `/api/teachers/${teacher.id}` : '/api/teachers';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEditing ? 'update' : 'create'} teacher`);
      }

      if (!isEditing && postUpdate && data?.data?.id) {
        try {
          await fetch('/api/admin/updates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `New teacher added: ${data.data.name}`,
              body: `You can now rate and comment on ${data.data.name}.`,
              type: 'new_teacher',
              teacher_id: data.data.id,
              link_url: `/teachers/${data.data.id}`,
            }),
          });
        } catch (err) {
          console.error('Error creating update banner:', err);
        }
      }

      onSuccess?.();
      router.push('/admin/teachers');
      router.refresh();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        errors: {
          submit: error instanceof Error ? error.message : 'An error occurred',
        },
        isSubmitting: false,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      <Input
        label="Full Name"
        placeholder="Enter teacher's full name"
        value={state.name}
        onChange={(e) => handleChange('name', e.target.value)}
        error={state.errors.name}
        required
      />

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Edit mode</p>
          <p className="text-xs text-muted-foreground">
            {useManualInput ? 'Manual inputs' : 'Dropdown selections'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUseManualInput((prev) => !prev)}
          className={cn(
            'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
            useManualInput
              ? 'border-amber-500/30 bg-amber-100 text-amber-700 dark:text-amber-200'
              : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
          )}
        >
          {useManualInput ? 'Manual' : 'Dropdowns'}
        </button>
      </div>

      {useManualInput ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Department
            </label>
            <select
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={state.department_id}
              onChange={(e) => handleChange('department_id', e.target.value)}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {state.errors.department_id && (
              <p className="mt-1.5 text-sm text-red-500">{state.errors.department_id}</p>
            )}
          </div>
          <Input
            label="Subjects (comma separated)"
            placeholder="e.g., Physics, Chemistry"
            value={state.manual_subjects}
            onChange={(e) => handleChange('manual_subjects', e.target.value)}
            error={state.errors.subject_ids}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Department
              </label>
              <select
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={state.department_id}
                onChange={(e) => handleChange('department_id', e.target.value)}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {state.errors.department_id && (
                <p className="mt-1.5 text-sm text-red-500">{state.errors.department_id}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Subjects
            </label>
            <div className="flex flex-wrap gap-2">
              {(subjectsByDepartment[state.department_id] || []).map((subject) => (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => toggleArrayValue('subject_ids', subject.id)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    state.subject_ids.includes(subject.id)
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  {subject.name}
                </button>
              ))}
              {state.department_id && isLoadingSubjects && (
                <p className="text-sm text-muted-foreground">Loading subjects...</p>
              )}
              {state.department_id &&
                !isLoadingSubjects &&
                (subjectsByDepartment[state.department_id] || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No subjects listed for this department.</p>
                )}
              {!state.department_id && !isLoadingDepartments && (
                <p className="text-sm text-muted-foreground">Select a department to choose subjects.</p>
              )}
              {!state.department_id && isLoadingDepartments && (
                <p className="text-sm text-muted-foreground">Loading departments...</p>
              )}
            </div>
            {state.errors.subject_ids && (
              <p className="mt-1.5 text-sm text-red-500">{state.errors.subject_ids}</p>
            )}
          </div>
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Levels
          </label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => toggleArrayValue('levels', level)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  state.levels.includes(level)
                    ? level === 'HL'
                      ? 'border-red-500/30 bg-red-100 text-red-700 dark:text-red-300'
                      : 'border-blue-200 bg-blue-100 text-blue-700'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Year Levels
          </label>
          <div className="flex flex-wrap gap-2">
            {[7, 8, 9, 10, 11, 12].map((year) => (
              <button
                key={year}
                type="button"
                onClick={() => toggleArrayValue('year_levels', year)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  state.year_levels.includes(year)
                    ? 'border-border bg-muted text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
                )}
              >
                Year {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Input
        label="Image URL"
        type="url"
        placeholder="https://example.com/image.jpg"
        value={state.image_url}
        onChange={(e) => handleChange('image_url', e.target.value)}
        error={state.errors.image_url}
        helperText="Optional: URL to teacher's profile photo"
      />

      <Textarea
        label="Bio"
        placeholder="Brief description about the teacher..."
        value={state.bio}
        onChange={(e) => handleChange('bio', e.target.value)}
        error={state.errors.bio}
        maxLength={1000}
        showCharacterCount
        rows={4}
        helperText="Optional: Brief biography or teaching philosophy"
      />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is_active"
          checked={state.is_active}
          onChange={(e) => handleChange('is_active', e.target.checked)}
          className="h-4 w-4 rounded border-border text-emerald-600 dark:text-emerald-300 focus:ring-emerald-500"
        />
        <label htmlFor="is_active" className="text-sm text-foreground">
          Active (visible to public)
        </label>
      </div>

      {!isEditing && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="post_update"
            checked={postUpdate}
            onChange={(e) => setPostUpdate(e.target.checked)}
            className="h-4 w-4 rounded border-border text-emerald-600 dark:text-emerald-300 focus:ring-emerald-500"
          />
          <label htmlFor="post_update" className="text-sm text-foreground">
            Post update banner for this teacher
          </label>
        </div>
      )}

      {state.errors.submit && (
        <div className="rounded-lg bg-red-500/10 dark:bg-red-500/20 p-3 text-sm text-red-600 dark:text-red-300">
          {state.errors.submit}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          isLoading={state.isSubmitting}
          className="flex-1"
        >
          {isEditing ? 'Update Teacher' : 'Create Teacher'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/teachers')}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export { TeacherForm };
















