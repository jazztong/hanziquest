import { eq, and } from 'drizzle-orm';
import { db, chapters, chapterProgress } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { addXp, ensureCards, refreshMilestones, touchStreak } from '@/lib/player';
import { harvestCards } from '@/lib/story/engine';
import { rarityOf } from '@/lib/lexicon';
import type { ChapterScript } from '@/lib/story/types';
import { BadRequest, body, route } from '@/lib/api';

/**
 * Finish a chapter: bank the path, mint the cards, award XP.
 *
 * XP is weighted toward comprehension rather than completion. Clicking through
 * a chapter should be worth something (it is still reading) but understanding
 * the clues should be worth clearly more, or the comprehension gate becomes
 * decorative.
 */
export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{
      chapterId: string;
      path: string[];
      comprehensionScore: number;
      detours: number;
    }>(req);
    if (!input.chapterId) throw new BadRequest('chapterId required');
    const user = await requireStudent();
    const rows = await db.select().from(chapters).where(eq(chapters.id, input.chapterId)).limit(1);
    const chapter = rows[0];
    if (!chapter) throw new Error('chapter not found');

    const script = chapter.script as ChapterScript;
    const { chars, words } = harvestCards(script);

    const created = await ensureCards(user.id, [
      ...chars.map((c) => ({ kind: 'char' as const, value: c, rarity: rarityOf(c), chapterId: chapter.id })),
      ...words.map((w) => ({ kind: 'word' as const, value: w, rarity: 'uncommon', chapterId: chapter.id })),
    ]);

    const now = Math.floor(Date.now() / 1000);
    await db
      .insert(chapterProgress)
      .values({
        userId: user.id,
        chapterId: chapter.id,
        path: input.path ?? [],
        comprehensionScore: input.comprehensionScore ?? 0,
        detours: input.detours ?? 0,
        completedAt: now,
      })
      .onConflictDoUpdate({
        target: [chapterProgress.userId, chapterProgress.chapterId],
        set: {
          path: input.path ?? [],
          comprehensionScore: input.comprehensionScore ?? 0,
          detours: input.detours ?? 0,
          completedAt: now,
        },
      });

    const base = 30;
    const comprehension = Math.round((input.comprehensionScore ?? 0) * 70);
    const xp = await addXp(user.id, base + comprehension);
    const streak = await touchStreak(user.id);
    await refreshMilestones(user.id);

    return {
      newCards: created,
      xp,
      streak,
      cardsMinted: created.length,
    };
  });
}
