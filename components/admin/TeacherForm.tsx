'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Teacher } from '@/lib/types/database';
import { validate, teacherSchema, type TeacherInput } from '@/lib/utils/validation';

/**
 * TeacherForm Component
 * 
 * Form for creating or editing teacher profiles.
 * Includes validation and error handling.
 */

export interface TeacherFormProps {
  teacher?: Teacher;
  onSuccess?: () => void;
  className?: string;
}

interface FormState {
  name: string;
  subject: string;
  department: string;
  bio: string;
  image_url: string;
  is_active: boolean;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ teacher, onSuccess, className }) => {
  const router = useRouter();
  const isEditing = !!teacher;

  const [state, setState] = React.useState<FormState>({
    name: teacher?.name || '',
    subject: teacher?.subject || '',
    department: teacher?.department || '',
    bio: teacher?.bio || '',
    image_url: teacher?.image_url || '',
    is_active: teacher?.is_active ?? true,
    errors: {},
    isSubmitting: false,
  });

  const handleChange = (field: keyof FormState, value: string | boolean) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: '' },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const formData: TeacherInput = {
      name: state.name,
      subject: state.subject || null,
      department: state.department || null,
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

      <div className="grid gap-6 md:grid-cols-2">
        <Input
          label="Subject"
          placeholder="e.g., Mathematics"
          value={state.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          error={state.errors.subject}
        />

        <Input
          label="Department"
          placeholder="e.g., Science Department"
          value={state.department}
          onChange={(e) => handleChange('department', e.target.value)}
          error={state.errors.department}
        />
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
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        <label htmlFor="is_active" className="text-sm text-slate-700">
          Active (visible to public)
        </label>
      </div>

      {state.errors.submit && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
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
