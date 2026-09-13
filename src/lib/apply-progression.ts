import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { db, attempts, profiles } from '@/lib/db';
import { nextBand, WINDOW, type BandDecision } from '@/lib/progression';

/**
 * Re-check the difficulty band after an answer, and move it if earned.
 *
 * Called from the places that grade an answer rather than on a schedule, so the
 * band responds within the session that earned it - a child who has just had a
 * good run should see the effect, not find out next week.
 *
 * Deliberately quiet: a failure here must never fail the answer that triggered
 * it. Losing a promotion is a missed nicety; losing the answer is losing work.
 */
export async function applyProgression(userId: string): Promise<BandDecision | null> {
  try {
    const rows = await db
      .select({ correct: attempts.correct })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), isNotNull(attempts.correct)))
      .orderBy(desc(attempts.createdAt))
      .limit(WINDOW);

    if (!rows.length) return null;

    const current = await db
      .select({ band: profiles.storyBand })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    const band = current[0]?.band ?? 1;

    const decision = nextBand(band, rows.map((r) => Boolean(r.correct)));
    if (decision.band !== band) {
      await db
        .update(profiles)
        .set({ storyBand: decision.band })
        .where(eq(profiles.userId, userId));
    }
    return decision;
  } catch {
    return null;
  }
}
