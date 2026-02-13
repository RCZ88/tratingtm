/**
 * Helpers for formatting update-banner text.
 * Supports safe subset: <b>, <i>, <u> and line breaks.
 */

const ALLOWED_TAGS = new Set(['b', 'i', 'u']);

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderUpdateMarkup(input: string): string {
  if (!input) return '';

  const normalized = input
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\r\n/g, '\n');

  const tokens: string[] = [];
  const tokenized = normalized.replace(/<\s*(\/?)\s*(b|i|u)\b[^>]*>/gi, (_, slash: string, tag: string) => {
    const normalizedTag = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(normalizedTag)) {
      return '';
    }
    const token = `@@UPD_TAG_${tokens.length}@@`;
    tokens.push(`<${slash ? '/' : ''}${normalizedTag}>`);
    return token;
  });

  const stripped = tokenized.replace(/<[^>]*>/g, '');
  let safe = escapeHtml(stripped);

  tokens.forEach((tag, index) => {
    safe = safe.replace(`@@UPD_TAG_${index}@@`, tag);
  });

  return safe.replace(/\n/g, '<br />');
}

