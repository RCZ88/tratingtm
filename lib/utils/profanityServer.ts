import profanity from 'leo-profanity';
import { findProfanityMatches } from '@/lib/utils/profanity';

let cachedBaseWords: string[] | null = null;

export function getBaseProfanityWords() {
  if (cachedBaseWords) return cachedBaseWords;
  try {
    const dictionary = profanity.getDictionary?.('en') || [];
    const list = profanity.list?.() || [];
    cachedBaseWords = Array.from(new Set([...(dictionary || []), ...(list || [])]));
  } catch {
    cachedBaseWords = [];
  }
  return cachedBaseWords;
}

export function scanForProfanity(text: string, bannedWords: string[]) {
  const baseWords = getBaseProfanityWords();
  const combined = Array.from(new Set([...baseWords, ...bannedWords]));
  return findProfanityMatches(text, combined);
}
