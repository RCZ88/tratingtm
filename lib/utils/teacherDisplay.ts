export function formatYearLevels(levels?: number[] | null): string | null {
  if (!levels || levels.length === 0) return null;
  const sorted = Array.from(new Set(levels)).sort((a, b) => a - b);
  if (sorted.length === 1) return `${sorted[0]}`;

  const isContiguous = sorted.every((value, index) =>
    index === 0 ? true : value === sorted[index - 1] + 1
  );
  if (isContiguous) {
    return `${sorted[0]}-${sorted[sorted.length - 1]}`;
  }

  if (sorted.length === 2) {
    return `${sorted[0]} & ${sorted[1]}`;
  }

  return sorted.join(', ');
}

export function getAvatarStyle(name?: string | null): string {
  const normalized = (name || '').trim().toLowerCase();
  if (normalized.startsWith('mr ') || normalized.startsWith('mr.')) {
    return 'bg-sky-100 text-sky-700 dark:text-sky-200';
  }
  if (normalized.startsWith('ms ') || normalized.startsWith('ms.')) {
    return 'bg-rose-100 text-rose-700';
  }
  return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200';
}

function normalizeHex(hex?: string | null): string | null {
  if (!hex) return null;
  const trimmed = hex.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) return null;
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

export function getDepartmentBadgeStyle(colorHex?: string | null) {
  const normalized = normalizeHex(colorHex);
  if (!normalized) {
    return {
      className: 'border border-border bg-muted text-muted-foreground',
      style: undefined as CSSProperties | undefined,
    };
  }

  const { r, g, b } = hexToRgb(normalized);
  return {
    className: 'border',
    style: {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
      borderColor: `rgba(${r}, ${g}, ${b}, 0.3)`,
      color: normalized,
    } as CSSProperties,
  };
}
import type { CSSProperties } from 'react';






