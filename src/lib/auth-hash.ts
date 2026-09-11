/**
 * Password hashing, split out of auth.ts.
 *
 * auth.ts imports `next/headers`, which only exists inside a request. Seed
 * scripts need to hash a password without pulling that in, so the pure crypto
 * lives here and auth.ts re-exports it.
 */
import crypto from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  // Length check first: timingSafeEqual throws on a length mismatch rather than
  // returning false, which would turn a wrong-length password into a 500.
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}
