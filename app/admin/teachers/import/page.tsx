'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ArrowLeft, Upload } from 'lucide-react';

const SAMPLE_JSON = `[
  { "name": "Ada Lovelace", "subject": "Mathematics", "subjects": ["Math"], "department": "Mathematics", "levels": ["SL"], "year_levels": [10, 11] },
  { "name": "Alan Turing", "department": "Sciences", "subjects": ["Computer Science"], "levels": ["HL"], "year_levels": [11, 12] },
  "Grace Hopper"
]`;

export default function ImportTeachersPage() {
  const router = useRouter();
  const [jsonText, setJsonText] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setJsonText(text);
      setError(null);
      setSuccess(null);
    } catch {
      setError('Failed to read the selected file.');
    }
  };

  const handleImport = async () => {
    setError(null);
    setSuccess(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError('Invalid JSON. Please fix the JSON and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/teachers/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const data = await response.json();

      if (!response.ok) {
        const details = Array.isArray(data.details) ? data.details.join(', ') : '';
        setError(details ? `${data.error}: ${details}` : data.error || 'Import failed');
        return;
      }

      setSuccess(`Imported ${data.inserted} teachers successfully.`);
      setJsonText('');
      router.refresh();
    } catch {
      setError('Import failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Teachers</h1>
          <p className="text-slate-600">Upload or paste JSON to bulk add teachers</p>
        </div>
        <Link href="/admin/teachers">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>JSON Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-600">
            You can send either an array of teacher objects, or an array of strings
            (names only). Optional fields: subject, subjects, department, levels, year_levels, bio, image_url, is_active.
          </p>
          <pre className="rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
{SAMPLE_JSON}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Upload JSON File
            </label>
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          <Textarea
            label="Paste JSON"
            placeholder="Paste JSON array here..."
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={12}
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

          <div className="flex gap-3">
            <Button
              onClick={handleImport}
              isLoading={isSubmitting}
              leftIcon={<Upload className="h-4 w-4" />}
              disabled={!jsonText.trim()}
            >
              Import Teachers
            </Button>
            <Button
              variant="outline"
              onClick={() => setJsonText(SAMPLE_JSON)}
            >
              Use Sample
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
