export const LEGACY_REACTION_MAP: Record<string, string> = {
  like: '??',
  dislike: '??',
};

export const normalizeReaction = (reaction: string): string => {
  const value = (reaction || '').trim();
  if (!value) return '';
  return LEGACY_REACTION_MAP[value] || value;
};

export const defaultReactionEmojis = ['??', '??', '??', '??', '??', '??', '??'] as const;

export const isThumbsUpReaction = (reaction: string): boolean => {
  const normalized = normalizeReaction(reaction);
  return normalized === '??';
};

export const isThumbsDownReaction = (reaction: string): boolean => {
  const normalized = normalizeReaction(reaction);
  return normalized === '??';
};
