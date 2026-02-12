'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Settings } from 'lucide-react';

interface SettingsData {
  comments_require_approval: boolean;
  replies_require_approval: boolean;
  maintenance_enabled: boolean;
  maintenance_message: string;
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
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Control moderation and other app settings</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Moderation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <label className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium text-foreground">Require approval for new comments</p>
                  <p className="text-sm text-muted-foreground">
                    When enabled, new comments are hidden until approved by an admin.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-border text-emerald-600 dark:text-emerald-300 focus:ring-emerald-500"
                  checked={settings?.comments_require_approval ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      comments_require_approval: e.target.checked,
                      replies_require_approval: prev?.replies_require_approval ?? true,
                      maintenance_enabled: prev?.maintenance_enabled ?? false,
                      maintenance_message: prev?.maintenance_message ?? '',
                    }))
                  }
                />
              </label>

              <label className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium text-foreground">Require approval for new replies</p>
                  <p className="text-sm text-muted-foreground">
                    When enabled, replies are hidden until approved by an admin.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-border text-emerald-600 dark:text-emerald-300 focus:ring-emerald-500"
                  checked={settings?.replies_require_approval ?? true}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      comments_require_approval: prev?.comments_require_approval ?? true,
                      replies_require_approval: e.target.checked,
                      maintenance_enabled: prev?.maintenance_enabled ?? false,
                      maintenance_message: prev?.maintenance_message ?? '',
                    }))
                  }
                />
              </label>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <>
              <label className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-medium text-foreground">Enable maintenance mode</p>
                  <p className="text-sm text-muted-foreground">
                    Non-admin users will see a maintenance page while admins can browse the site normally.
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-border text-emerald-600 dark:text-emerald-300 focus:ring-emerald-500"
                  checked={settings?.maintenance_enabled ?? false}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      comments_require_approval: prev?.comments_require_approval ?? true,
                      replies_require_approval: prev?.replies_require_approval ?? true,
                      maintenance_enabled: e.target.checked,
                      maintenance_message: prev?.maintenance_message ?? '',
                    }))
                  }
                />
              </label>

              <div className="rounded-lg border border-border bg-card p-4">
                <Input
                  label="Maintenance message"
                  placeholder="We are updating the site. Please check back soon."
                  value={settings?.maintenance_message ?? ''}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      comments_require_approval: prev?.comments_require_approval ?? true,
                      replies_require_approval: prev?.replies_require_approval ?? true,
                      maintenance_enabled: prev?.maintenance_enabled ?? false,
                      maintenance_message: event.target.value,
                    }))
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 rounded-lg bg-red-500/10 dark:bg-red-500/20 p-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg bg-green-500/10 dark:bg-green-500/20 p-3 text-sm text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="mt-6">
        <Button onClick={saveSettings} isLoading={isSaving} disabled={!settings}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
