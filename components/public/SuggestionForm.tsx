'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DEPARTMENTS, LEVELS, SUBJECTS_BY_DEPARTMENT } from '@/lib/constants/suggestions';
import type { Department, Subject } from '@/lib/types/database';

export type SuggestionType = 'general' | 'teacher_add' | 'teacher_modify';

interface SuggestionFormProps {
  type: SuggestionType;
  onSubmitted?: () => void;
}

const SuggestionForm: React.FC<SuggestionFormProps> = ({ type, onSubmitted }) => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [teacherName, setTeacherName] = React.useState('');
  const [teacherOptions, setTeacherOptions] = React.useState<string[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = React.useState(false);
  const [departmentId, setDepartmentId] = React.useState('');
  const [subjectId, setSubjectId] = React.useState('');
  const [level, setLevel] = React.useState('');
  const [yearLevel, setYearLevel] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [departments, setDepartments] = React.useState<Department[]>(
    DEPARTMENTS.map((name) => ({ id: name, name }))
  );
  const [subjectsByDepartment, setSubjectsByDepartment] = React.useState<Record<string, Subject[]>>(
    Object.fromEntries(
      Object.entries(SUBJECTS_BY_DEPARTMENT).map(([dept, subjects]) => [
        dept,
        subjects.map((name) => ({ id: name, name, department_id: dept } as Subject)),
      ])
    )
  );
  const [isLoadingDepartments, setIsLoadingDepartments] = React.useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = React.useState(false);

  React.useEffect(() => {
    setMessage(null);
  }, [type]);

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
        if (active && (data.data || []).length > 0) {
          setDepartments(data.data || []);
        }
      } catch (error) {
        if (active) {
          setDepartments((prev) =>
            prev.length === 0 ? DEPARTMENTS.map((name) => ({ id: name, name })) : prev
          );
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
    if (!departmentId) {
      setSubjectId('');
      return;
    }

    let active = true;
    const fetchSubjects = async () => {
      setIsLoadingSubjects(true);
      try {
        const params = new URLSearchParams();
        params.set('department_id', departmentId);
        const response = await fetch(`/api/subjects?${params.toString()}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load subjects');
        }
        const subjectRows = (data.data || []) as Subject[];

        if (active && subjectRows.length > 0) {
          setSubjectsByDepartment((prev) => ({
            ...prev,
            [departmentId]: subjectRows,
          }));
          const validIds = new Set(subjectRows.map((item) => item.id));
          if (!validIds.has(subjectId)) {
            setSubjectId('');
          }
        }
      } catch (error) {
        if (active) {
          setSubjectsByDepartment((prev) => ({
            ...prev,
            [departmentId]:
              prev[departmentId] ||
              (SUBJECTS_BY_DEPARTMENT[departmentId] || []).map((name) => ({
                id: name,
                name,
                department_id: departmentId,
              })),
          }));
          const fallbackIds = new Set(
            (SUBJECTS_BY_DEPARTMENT[departmentId] || []).map((name) => name)
          );
          if (!fallbackIds.has(subjectId)) {
            setSubjectId('');
          }
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
  }, [departmentId]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTeacherName('');
    setDepartmentId('');
    setSubjectId('');
    setLevel('');
    setYearLevel('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const selectedDepartment = departments.find((dept) => dept.id === departmentId);
    const subjectOptions = departmentId ? subjectsByDepartment[departmentId] || [] : [];
    const selectedSubject = subjectOptions.find((item) => item.id === subjectId);

    const payload = {
      type,
      title: title.trim() || null,
      description,
      teacher_name: teacherName.trim() || null,
      department: selectedDepartment?.name || null,
      subject: selectedSubject?.name || null,
      level: level || null,
      year_level: yearLevel.trim() || null,
    };

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit suggestion');
      }

      setMessage('Suggestion submitted. Thank you!');
      resetForm();
      onSubmitted?.();
    } catch (error) {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTeacherForm = type !== 'general';
  const isModifyForm = type === 'teacher_modify';
  const subjectOptions = departmentId ? subjectsByDepartment[departmentId] || [] : [];

  React.useEffect(() => {
    if (!isModifyForm) return;

    const fetchTeachers = async () => {
      setIsLoadingTeachers(true);
      try {
        const params = new URLSearchParams();
        params.set('limit', '200');
        params.set('sort_by', 'name');
        params.set('sort_order', 'asc');

        const response = await fetch(`/api/teachers?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          const names = (data.data || [])
            .map((teacher: { name?: string }) => teacher.name)
            .filter(Boolean) as string[];
          setTeacherOptions(Array.from(new Set(names)));
        }
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setIsLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, [isModifyForm]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Title (optional)"
        placeholder="Short summary"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <Textarea
        label={type === 'general' ? 'Suggestion' : 'Details'}
        placeholder={
          type === 'general'
            ? 'Describe the feature or improvement you want to see...'
            : 'Provide context or details for this request...'
        }
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        minLength={10}
        required
      />

      {isTeacherForm && (
        <div className="grid gap-4 md:grid-cols-2">
          {isModifyForm ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Teacher Name
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={teacherName}
                onChange={(event) => setTeacherName(event.target.value)}
                required
                disabled={isLoadingTeachers}
              >
                <option value="">
                  {isLoadingTeachers ? 'Loading teachers...' : 'Select teacher'}
                </option>
                {teacherOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Input
              label="Teacher Name"
              placeholder="e.g., Ms Angela"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              required
            />
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Department
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              required
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Subject
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              required
              disabled={!departmentId || isLoadingSubjects}
            >
              <option value="">
                {departmentId
                  ? isLoadingSubjects
                    ? 'Loading subjects...'
                    : 'Select subject'
                  : isLoadingDepartments
                  ? 'Loading departments...'
                  : 'Select department first'}
              </option>
              {subjectOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Level (optional)
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              <option value="">Not specified</option>
              {LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Year Level (optional)"
            placeholder="e.g., Grade 11"
            value={yearLevel}
            onChange={(event) => setYearLevel(event.target.value)}
          />
        </div>
      )}

      {message && (
        <p className="text-sm text-slate-600">{message}</p>
      )}

      <Button type="submit" isLoading={isSubmitting}>
        Submit Suggestion
      </Button>
    </form>
  );
};

export { SuggestionForm };
