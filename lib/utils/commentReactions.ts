export const THUMBS_UP = '\u{1F44D}';
export const THUMBS_DOWN = '\u{1F44E}';

export const LEGACY_REACTION_MAP: Record<string, string> = {
  like: THUMBS_UP,
  dislike: THUMBS_DOWN,
};

export const normalizeReaction = (reaction: string): string => {
  const value = (reaction || '').trim();
  if (!value) return '';
  return LEGACY_REACTION_MAP[value] || value;
};

export const defaultReactionEmojis = [
  '\u{2764}\u{FE0F}',
  '\u{1F602}',
  '\u{1F62E}',
  '\u{1F622}',
  '\u{1F621}',
  '\u{1F445}',
] as const;

export const isThumbsUpReaction = (reaction: string): boolean => {
  const normalized = normalizeReaction(reaction);
  return normalized === THUMBS_UP;
};

export const isThumbsDownReaction = (reaction: string): boolean => {
  const normalized = normalizeReaction(reaction);
  return normalized === THUMBS_DOWN;
};
