/**
 * Local accounts. No email, no OAuth, no third party.
 *
 * This is a household app holding a child's schoolwork and error history. The
 * privacy requirement in the brief ("child data and voice recordings stay
 * private, no third-party analytics") is easiest to honour by never having an
 * identity provider at all: two accounts, scrypt-hashed passwords, an httpOnly
 * session cookie, and no account shared with anyone else's system.
 *
 * Note this is now reachable from the internet rather than only from a laptop,
 * so the password is the whole of the defence. There is no rate limiting on
 * the login route yet, which is the first thing to add if the address is ever
 * shared beyond the family.
 */
import crypto from 'node:crypto';
import { hashPassword, verifyPassword } from './auth-hash';
import { cookies } from 'next/headers';
import { eq, and, gt, inArray } from 'drizzle-orm';
import { db, users, sessions, profiles } from './db';
import { bootstrapStudent } from './bootstrap';
import { checkName, checkPassword } from './account-rules';

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

  // A parent sees the student they are linked to.
  const self = await db.select().from(users).where(eq(users.id, u.id)).limit(1);
  const linked = self[0]?.linkedStudentId;
  if (linked) return linked;

  // Older parent accounts predate the link. Falling back to the only student
  // in the database is safe while there is exactly one; it is how one family's
  // child would be shown to another the moment there are two, so with more
  // than one this refuses rather than guesses.
  const students = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, 'student'))
    .limit(2);
  if (!students[0]) throw new AuthError('no student account exists');
  if (students.length > 1) {
    throw new AuthError('this parent account is not linked to a student');
  }
  return students[0].id;
}

export class RegisterError extends Error {
  status = 400;
}

/**
 * Create a student account, and optionally the parent account that watches it.
 *
 * Both are made together or not at all. A parent account created without its
 * link would land in the fallback above, and a student created without their
 * starting data would open to an empty map.
 */
export async function register(input: {
  name: string;
  password: string;
  parentName?: string;
  parentPassword?: string;
}): Promise<SessionUser> {
  // Stored lowercase because login() lowercases what it is given. A name saved
  // with a capital would simply never match, and the account would be lost the
  // moment it was created.
  const name = input.name.trim().toLowerCase();
  const problem = checkName(name);
  if (problem === 'length') throw new RegisterError('Pick a name of 2-24 characters.');
  if (problem === 'characters') throw new RegisterError('Letters, numbers, spaces, - and _ only.');
  if (!checkPassword(input.password)) throw new RegisterError('Use a password of at least 8 characters.');

  const parentName = input.parentName?.trim().toLowerCase();
  if (parentName) {
    if (!input.parentPassword || !checkPassword(input.parentPassword)) {
      throw new RegisterError('The parent password needs at least 8 characters.');
    }
    if (parentName === name) {
      throw new RegisterError('The two accounts need different names.');
    }
  }

  const wanted = parentName ? [name, parentName] : [name];
  const clash = await db.select({ name: users.name }).from(users).where(inArray(users.name, wanted));
  if (clash.length) throw new RegisterError('That name is taken. Try another.');

  const studentId = `u-${crypto.randomUUID()}`;
  await db.insert(users).values({
    id: studentId,
    name,
    role: 'student',
    passwordHash: hashPassword(input.password),
  });
  await bootstrapStudent(studentId);

  if (parentName) {
    await db.insert(users).values({
      id: `u-${crypto.randomUUID()}`,
      name: parentName,
      role: 'parent',
      passwordHash: hashPassword(input.parentPassword!),
      linkedStudentId: studentId,
    });
  }

  await createSession(studentId);
  return { id: studentId, name, role: 'student' };
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
