export const FORUM_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const FORUM_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function getExtensionFromMime(mimeType: string): string | null {
  return MIME_EXTENSION_MAP[mimeType] || null;
}

export function buildForumImagePath(seed: string, extension: string): string {
  const safeSeed = (seed || 'anon').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'anon';
  const nonce = Math.random().toString(36).slice(2, 10);
  return `${safeSeed}/${Date.now()}-${nonce}.${extension}`;
}

