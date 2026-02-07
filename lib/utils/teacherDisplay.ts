export const DEPARTMENT_COLORS: Record<string, string> = {
  Mathematics: 'bg-indigo-100 text-indigo-700',
  Sciences: 'bg-emerald-100 text-emerald-700',
  Homeroom: 'bg-amber-100 text-amber-700',
  Electives: 'bg-pink-100 text-pink-700',
  Humanities: 'bg-purple-100 text-purple-700',
  Languages: 'bg-sky-100 text-sky-700',
};

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
    return 'bg-sky-100 text-sky-700';
  }
  if (normalized.startsWith('ms ') || normalized.startsWith('ms.')) {
    return 'bg-rose-100 text-rose-700';
  }
  return 'bg-emerald-100 text-emerald-700';
}

export function getDepartmentColor(department?: string | null): string {
  if (!department) return 'bg-slate-100 text-slate-600';
  return DEPARTMENT_COLORS[department] || 'bg-slate-100 text-slate-600';
}
