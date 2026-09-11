import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import { db, cards, chapterProgress, profiles, skillLevels, milestones, relicProgress } from './db';
import { isKnown, type SrsState } from './srs';
import { State } from 'ts-fsrs';

/**
 * The learner's read-on-sight character set.
 *
 * This is the single most-read value in the app - the coverage gate calls it on
 * every chapter serve - so it is one indexed query and nothing more. A card
 * counts as known once it has survived a gap (see srs.isKnown); counting
 * freshly-introduced cards would inflate coverage and hand the player chapters
 * he cannot read.
 */
export async function knownChars(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({
      value: cards.value,
      state: cards.state,
      stability: cards.stability,
    })
    .from(cards)
    .where(and(eq(cards.userId, userId), eq(cards.kind, 'char')));

  const known = new Set<string>();
  for (const r of rows) {
    if (r.state === State.Review || r.state === State.Relearning) {
      if (r.stability >= 1) known.add(r.value);
    }
  }
  return known;
}

export async function playedChapters(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ chapterId: chapterProgress.chapterId, completedAt: chapterProgress.completedAt })
    .from(chapterProgress)
    .where(eq(chapterProgress.userId, userId));
  return new Set(rows.filter((r) => r.completedAt).map((r) => r.chapterId));
}

export async function profile(userId: string) {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function skills(userId: string) {
  return db.select().from(skillLevels).where(eq(skillLevels.userId, userId));
}

/** XP curve: each level costs a bit more, but never enough to stall for days. */
export function levelFromXp(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let remaining = xp;
  let need = 100;
  while (remaining >= need) {
    remaining -= need;
    level += 1;
    need = Math.round(need * 1.18);
  }
  return { level, into: remaining, need };
}

export async function addXp(userId: string, amount: number) {
  const p = await profile(userId);
  if (!p) return null;
  const xp = p.xp + amount;
  const { level } = levelFromXp(xp);
  await db.update(profiles).set({ xp, level }).where(eq(profiles.userId, userId));
  return { xp, level, gained: amount, levelledUp: level > p.level };
}

/**
 * Streak update.
 *
 * Deliberately forgiving: a missed day resets the count but costs nothing else -
 * no lost XP, no lost cards, no "streak freeze" to buy. docs/research.md 5.3 is
 * the reason: loss-framed mechanics suppress voluntary practice in adolescents,
 * which is the opposite of what this app needs.
 */
export async function touchStreak(userId: string, today = localDay()) {
  const p = await profile(userId);
  if (!p) return null;
  if (p.lastPlayedOn === today) return { streak: p.streakDays, changed: false };

  const yesterday = localDay(new Date(Date.now() - 86400_000));
  const streak = p.lastPlayedOn === yesterday ? p.streakDays + 1 : 1;
  await db
    .update(profiles)
    .set({ streakDays: streak, lastPlayedOn: today })
    .where(eq(profiles.userId, userId));
  return { streak, changed: true };
}

export function localDay(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Recompute milestone progress from live counts. */
export async function refreshMilestones(userId: string) {
  const knownCount = (await knownChars(userId)).size;
  const relics = await db
    .select({ stage: relicProgress.stage })
    .from(relicProgress)
    .where(eq(relicProgress.userId, userId));
  const activated = relics.filter((r) => r.stage >= 4).length;

  const rows = await db.select().from(milestones).where(eq(milestones.userId, userId));
  for (const m of rows) {
    let current = m.current;
    if (m.kind === 'chars') current = knownCount;
    if (m.kind === 'relics') current = activated;
    const achieved = current >= m.target ? (m.achievedAt ?? Math.floor(Date.now() / 1000)) : null;
    if (current !== m.current || achieved !== m.achievedAt) {
      await db
        .update(milestones)
        .set({ current, achievedAt: achieved })
        .where(eq(milestones.id, m.id));
    }
  }
}

/** Cards due now, for the queue builder. */
export async function dueCards(userId: string, limit = 300) {
  const now = Math.floor(Date.now() / 1000);
  return db
    .select()
    .from(cards)
    .where(and(eq(cards.userId, userId), lte(cards.due, now)))
    .limit(limit);
}

export async function ensureCards(
  userId: string,
  values: { kind: 'char' | 'word'; value: string; rarity: string; chapterId?: string }[],
) {
  const now = Math.floor(Date.now() / 1000);
  const created: string[] = [];
  for (const v of values) {
    const id = `${userId}:${v.kind}:${v.value}`;
    const existing = await db.select({ id: cards.id }).from(cards).where(eq(cards.id, id)).limit(1);
    if (existing[0]) continue;
    await db.insert(cards).values({
      id,
      userId,
      kind: v.kind,
      value: v.value,
      state: 0,
      due: now,
      stability: 0,
      difficulty: 0,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      lastReview: null,
      cardLevel: 1,
      rarity: v.rarity,
      firstSeenChapterId: v.chapterId ?? null,
    });
    created.push(v.value);
  }
  return created;
}

export { isKnown, type SrsState, inArray, sql };
