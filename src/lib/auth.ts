/**
 * Local accounts. No email, no OAuth, no third party.
 *
 * This is a household app holding a child's voice recordings and error history.
 * The privacy requirement in the brief ("child data and voice recordings stay
 * private, no third-party analytics") is easiest to honour by never having an
 * identity provider at all: two local accounts, scrypt-hashed passwords, an
 * httpOnly session cookie, and nothing that leaves the machine.
 */
import crypto from 'node:crypto';
import { verifyPassword } from './auth-hash';
import { cookies } from 'next/headers';
import { eq, and, gt } from 'drizzle-orm';
import { db, users, sessions, profiles } from './db';

const COOKIE = 'hq_session';
const SESSION_DAYS = 30;

export { hashPassword, verifyPassword } from './auth-hash';

export interface SessionUser {
  id: string;
  name: string;
  role: 'student' | 'parent';
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;
  await db.insert(sessions).values({ token, userId, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 86400,
    secure: process.env.NODE_ENV === 'production',
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.token, token));
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const now = Math.floor(Date.now() / 1000);
  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
    .limit(1);
  return (rows[0] as SessionUser) ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) throw new AuthError('not signed in');
  return u;
}

export async function requireStudent(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== 'student') throw new AuthError('student account required');
  return u;
}

/**
 * The parent can read the student's data; the student cannot read the parent's
 * settings. `studentIdFor` resolves whose profile a request is about.
 */
export async function studentIdFor(u: SessionUser): Promise<string> {
  if (u.role === 'student') return u.id;
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'student'))
    .limit(1);
  if (!rows[0]) throw new AuthError('no student account exists');
  return rows[0].id;
}

export class AuthError extends Error {
  status = 401;
}

export async function login(name: string, password: string): Promise<SessionUser | null> {
  const rows = await db.select().from(users).where(eq(users.name, name)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  await createSession(user.id);
  return { id: user.id, name: user.name, role: user.role };
}

export async function profileOf(userId: string) {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}
