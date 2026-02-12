'use client';

import * as React from 'react';
import Link from 'next/link';
import { TeacherForm } from '@/components/admin/TeacherForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';

/**
 * Add New Teacher Page
 * 
 * Form for creating a new teacher profile.
 */

export default function NewTeacherPage() {
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
        <h1 className="text-2xl font-bold text-foreground">Add New Teacher</h1>
        <p className="text-muted-foreground">Create a new teacher profile</p>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <TeacherForm />
        </CardContent>
      </Card>
    </div>
  );
}


