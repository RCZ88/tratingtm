export const DEFAULT_SUBJECT_SPLIT_REGEX = /\s*,\s*/;

export function splitSubjectList(input: string): string[] {
  return input
    .split(DEFAULT_SUBJECT_SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeSubjectName(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
