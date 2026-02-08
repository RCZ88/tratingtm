export interface ProfanityMatch {
  word: string;
  start: number;
  end: number;
}

const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
};

function normalizeChar(char: string): string {
  const lower = char.toLowerCase();
  const mapped = LEET_MAP[lower] ?? lower;
  return mapped.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function normalizeForMatching(text: string) {
  const normalizedChars: string[] = [];
  const indexMap: number[] = [];

  for (let i = 0; i < text.length; i += 1) {
    const original = text[i];
    const normalized = normalizeChar(original);

    if (/[a-z0-9]/i.test(normalized)) {
      normalizedChars.push(normalized);
      indexMap.push(i);
    } else if (/\s/.test(original)) {
      normalizedChars.push(' ');
      indexMap.push(i);
    } else {
      // punctuation/emoji -> treat as space to preserve word boundaries
      normalizedChars.push(' ');
      indexMap.push(i);
    }
  }

  return {
    normalized: normalizedChars.join(''),
    indexMap,
  };
}

function condense(text: string): string {
  return text
    .replace(/\s+/g, '')
    .replace(/(.)\1+/g, '$1');
}

function buildWordRegex(word: string): RegExp {
  const escaped = word
    .replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')
    .replace(/\s+/g, '\\\\s+');
  return new RegExp(`\\b${escaped}\\b`, 'gi');
}

export function findProfanityMatches(text: string, words: string[]) {
  const wordList = Array.from(
    new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean))
  );
  if (wordList.length === 0) {
    return { matches: [], flaggedWords: [] as string[] };
  }

  const { normalized, indexMap } = normalizeForMatching(text);
  const matches: ProfanityMatch[] = [];
  const flaggedWords = new Set<string>();

  wordList.forEach((word) => {
    const regex = buildWordRegex(word);
    let result = regex.exec(normalized);
    while (result) {
      const start = result.index;
      const end = start + result[0].length;
      const originalStart = indexMap[start] ?? 0;
      const originalEnd = (indexMap[end - 1] ?? originalStart) + 1;
      matches.push({ word, start: originalStart, end: originalEnd });
      flaggedWords.add(word);
      result = regex.exec(normalized);
    }
  });

  // Condensed check for spaced-out or repeated characters
  const condensed = condense(normalized);
  wordList.forEach((word) => {
    if (condensed.includes(word.replace(/\s+/g, ''))) {
      flaggedWords.add(word);
    }
  });

  const merged = mergeRanges(matches);

  return { matches: merged, flaggedWords: Array.from(flaggedWords) };
}

function mergeRanges(matches: ProfanityMatch[]) {
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  if (sorted.length <= 1) return sorted;

  const merged: ProfanityMatch[] = [sorted[0]];
  for (let i = 1; i < sorted.length; i += 1) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      last.word = last.word;
    } else {
      merged.push(current);
    }
  }
  return merged;
}
