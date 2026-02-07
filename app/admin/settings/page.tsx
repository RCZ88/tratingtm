'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Settings } from 'lucide-react';

interface SettingsData {
  comments_require_approval: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = React.useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadSettings = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to load settings');
        return;
      }
      setSettings(data.data);
    } catch {
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) {
        const details = Array.isArray(data.details) ? data.details.join(', ') : '';
        setError(details ? `${data.error}: ${details}` : data.error || 'Failed to save settings');
        return;
      }
      setSuccess('Settings saved');
    } catch {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Control moderation and other app settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Comment Moderation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
              <div>
                <p className="font-medium text-slate-900">Require approval for new comments</p>
                <p className="text-sm text-slate-500">
                  When enabled, new comments are hidden until approved by an admin.
                </p>
              </div>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                checked={settings?.comments_require_approval ?? true}
                onChange={(e) =>
                  setSettings((prev) => ({
                    comments_require_approval: e.target.checked,
                  }))
                }
              />
            </label>
          )}

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

          <div>
            <Button onClick={saveSettings} isLoading={isSaving} disabled={!settings}>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
