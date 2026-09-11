import { eq } from 'drizzle-orm';
import { db, cards, reviews, errorLog } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { cardLevelFromStability, gradeFrom, schedule, type ReviewMode } from '@/lib/srs';
import { refreshMilestones, touchStreak, addXp } from '@/lib/player';
import { BadRequest, body, route } from '@/lib/api';

export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{
      cardId: string;
      mode: ReviewMode;
      correct: boolean;
      elapsedMs: number;
      quality?: number;
      usedHint?: boolean;
    }>(req);
    if (!input.cardId) throw new BadRequest('cardId required');
    const user = await requireStudent();
    const rows = await db.select().from(cards).where(eq(cards.id, input.cardId)).limit(1);
    const card = rows[0];
    if (!card || card.userId !== user.id) throw new Error('card not found');

    const rating = gradeFrom({
      mode: input.mode,
      correct: input.correct,
      elapsedMs: input.elapsedMs,
      quality: input.quality,
      usedHint: input.usedHint,
    });

    const next = schedule(
      {
        state: card.state,
        due: card.due,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsedDays: card.elapsedDays,
        scheduledDays: card.scheduledDays,
        reps: card.reps,
        lapses: card.lapses,
        lastReview: card.lastReview,
      },
      rating,
    );

    const cardLevel = cardLevelFromStability(next.stability);
    const levelledUp = cardLevel > card.cardLevel;

    await db
      .update(cards)
      .set({
        ...next,
        cardLevel,
        canWrite: input.mode === 'write' && input.correct ? true : card.canWrite,
      })
      .where(eq(cards.id, card.id));

    await db.insert(reviews).values({
      cardId: card.id,
      userId: user.id,
      rating,
      mode: input.mode,
      elapsedMs: input.elapsedMs,
    });

    if (!input.correct) {
      await db.insert(errorLog).values({
        userId: user.id,
        tag: `${card.kind}:${card.value}`,
        skill: input.mode === 'write' ? 'handwriting' : 'recognition',
        detail: input.mode,
      });
    }

    await touchStreak(user.id);
    if (input.correct) await addXp(user.id, levelledUp ? 12 : 4);
    if (levelledUp) await refreshMilestones(user.id);

    return {
      rating,
      cardLevel,
      levelledUp,
      dueInDays: Math.round(next.scheduledDays * 10) / 10,
    };
  });
}
