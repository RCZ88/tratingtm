'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { TeacherForm } from '@/components/admin/TeacherForm';
import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { TeacherWithStats } from '@/lib/types/database';
import { ArrowLeft } from 'lucide-react';

/**
 * Edit Teacher Page
 * 
 * Form for editing an existing teacher profile.
 */

export default function EditTeacherPage() {
  const params = useParams();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = React.useState<TeacherWithStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const response = await fetch(`/api/teachers/${teacherId}`);
        const data = await response.json();

        if (response.ok) {
          setTeacher(data.data);
        }
      } catch (error) {
        console.error('Error fetching teacher:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacher();
  }, [teacherId]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-foreground">Teacher Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          The teacher you are trying to edit does not exist.
        </p>
        <Link href="/admin/teachers" className="mt-6 inline-block">
          <Button>Back to Teachers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/teachers"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-emerald-700 dark:text-emerald-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teachers
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Edit Teacher</h1>
        <p className="text-muted-foreground">Update {teacher.name}&apos;s profile</p>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <TeacherForm teacher={teacher} />
        </CardContent>
      </Card>
    </div>
  );
}


