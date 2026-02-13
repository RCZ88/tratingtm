'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { getAnonymousId } from '@/lib/utils/anonymousId';
import { ArrowLeft, ImagePlus } from 'lucide-react';

async function uploadImage(file: File, anonymousId: string): Promise<{ path: string; signed_preview_url: string | null }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('anonymous_id', anonymousId);

  const response = await fetch('/api/forum/uploads', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload image');
  }
  return data.data;
}

export default function ForumComposePage() {
  const router = useRouter();
  const anonymousId = React.useMemo(() => getAnonymousId(), []);

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [imagePath, setImagePath] = React.useState<string | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleImageSelect = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const uploaded = await uploadImage(file, anonymousId);
      setImagePath(uploaded.path);
      setImagePreview(uploaded.signed_preview_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    }
  };

  const submitPost = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          anonymous_id: anonymousId,
          image_path: imagePath,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit post');
      }

      router.push('/forum?tab=forum');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Link href="/forum?tab=forum" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-emerald-700 dark:text-emerald-200">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Forum
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Compose Forum Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short title"
            />

            <Textarea
              label="Post"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts..."
              rows={6}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Attach Image (optional)</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageSelect(e.target.files?.[0] || null)} />
              {imagePreview && <img src={imagePreview} alt="Post image preview" className="h-48 rounded-md border border-border object-cover" />}
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <Button onClick={submitPost} isLoading={isSubmitting} leftIcon={<ImagePlus className="h-4 w-4" />}>
                Submit for Moderation
              </Button>
              <Button variant="outline" onClick={() => router.push('/forum?tab=forum')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
