'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';

export default function TeachersJsonPage() {
  const [jsonText, setJsonText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadJson = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/teachers/json?include_inactive=true');
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load teachers.');
        return;
      }
      setJsonText(JSON.stringify(data.data || [], null, 2));
    } catch {
      setError('Failed to load teachers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadJson();
  }, [loadJson]);

  const saveJson = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError('Invalid JSON. Please fix the JSON and try again.');
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/teachers/json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const data = await response.json();
      if (!response.ok) {
        const details = Array.isArray(data.details) ? data.details.join(', ') : '';
        setError(details ? `${data.error}: ${details}` : data.error || 'Save failed');
        return;
      }

      setSuccess(`Saved. Updated ${data.updated}, inserted ${data.inserted}.`);
    } catch {
      setError('Save failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Teachers JSON</h1>
          <p className="text-slate-600">Load, edit, and save teacher data as JSON</p>
        </div>
        <Link href="/admin/teachers">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Required fields: <strong>name</strong> (min 3 chars).</p>
          <p>Optional: department_id, subject_ids, levels, year_levels, bio, image_url, is_active, id.</p>
          <p>Updates are matched by <strong>id</strong>. If no id is present, a new teacher is inserted.</p>
          <p>Removing a teacher from JSON does not delete it from the database.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>JSON Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            label="Teachers JSON"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={18}
            className="font-mono text-xs"
          />

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={loadJson}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Reload
            </Button>
            <Button
              onClick={saveJson}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
              disabled={!jsonText.trim()}
            >
              Save JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
