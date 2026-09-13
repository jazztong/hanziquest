/**
 * What a name and a password have to look like.
 *
 * Pure, and in its own file, so it can be tested without pulling in the
 * database and next/headers. That is not tidiness: the name pattern was once
 * written through a code generator that ate its backslashes, turning
 * \p{L} into p{L}, and every registration was rejected with a message saying
 * letters were allowed. Nothing caught it until a live attempt failed.
 */

/** Letters (any script), digits, spaces, hyphen and underscore. */
const NAME = /^[\p{L}\p{N} _-]+$/u;

export const NAME_MIN = 2;
export const NAME_MAX = 24;
export const PASSWORD_MIN = 8;

export type NameProblem = 'length' | 'characters' | null;

export function checkName(raw: string): NameProblem {
  const name = raw.trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX) return 'length';
  if (!NAME.test(name)) return 'characters';
  return null;
}

export function checkPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN;
}
