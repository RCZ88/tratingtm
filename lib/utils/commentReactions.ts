export const THUMBS_UP = '??';
export const THUMBS_DOWN = '??';

export const LEGACY_REACTION_MAP: Record<string, string> = {
  like: THUMBS_UP,
  dislike: THUMBS_DOWN,
};

export const normalizeReaction = (reaction: string): string => {
  const value = (reaction || '').trim();
  if (!value) return '';
  return LEGACY_REACTION_MAP[value] || value;
};

export const defaultReactionEmojis = ['??', '??', '??', '??', '??', '??'] as const;

export const isThumbsUpReaction = (reaction: string): boolean => {
  const normalized = normalizeReaction(reaction);
  return normalized === THUMBS_UP;
};

export const isThumbsDownReaction = (reaction: string): boolean => {
  const normalized = normalizeReaction(reaction);
  return normalized === THUMBS_DOWN;
};
