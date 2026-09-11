import { eq } from 'drizzle-orm';
import { db, baselineRuns, profiles, skillLevels, errorLog, attempts, cards } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import {
  applyResponse,
  ensureItem,
  finalise,
  isComplete,
  markResponse,
  progress,
  seedKnownSet,
  STAGES,
  type RunState,
} from '@/lib/baseline';
import { publicItem } from '@/lib/items/public';
import { newCardState } from '@/lib/srs';
import { rarityOf } from '@/lib/lexicon';
import { BadRequest, body, route } from '@/lib/api';

export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{ runId: string; value: string; elapsedMs?: number }>(req);
    if (!input.runId) throw new BadRequest('runId required');
    const user = await requireStudent();
    const rows = await db.select().from(baselineRuns).where(eq(baselineRuns.id, input.runId)).limit(1);
    const run = rows[0];
    if (!run || run.userId !== user.id) throw new Error('run not found');
    if (run.completedAt) throw new Error('run already finished');

    // The pinned item, not a freshly generated one. The client never sends the
    // item back (it only ever holds the public view without the answer key), and
    // regenerating here would mark a different question from the one answered.
    const pinned = ensureItem(run.state as RunState);
    const state = pinned.state;
    const item = pinned.item;
    if (!item) throw new Error('no item pending');

    const marked = markResponse(item, input.value ?? '');
    const next = applyResponse(state, item, input.value ?? '', marked, input.elapsedMs ?? 0);

    await db.insert(attempts).values({
      userId: user.id,
      itemId: item.id,
      context: run.kind === 'retest' ? 'retest' : 'baseline',
      contextRef: run.id,
      response: { value: input.value },
      correct: marked.correct ?? undefined,
      score: marked.score,
      maxScore: 1,
      marking: marked.detail ?? null,
      markedBy: item.type === 'writing' ? 'rule' : 'rule',
      elapsedMs: input.elapsedMs ?? 0,
    });

    if (marked.correct === false) {
      for (const tag of item.tags) {
        if (tag.startsWith('band:')) continue;
        await db.insert(errorLog).values({
          userId: user.id,
          tag,
          skill: item.skill,
          detail: item.payload.stem.slice(0, 80),
        });
      }
    }

    const done = isComplete(next);
    let result = null;

    if (done) {
      const elapsed = Date.now() - run.startedAt * 1000;
      result = finalise(next, elapsed);

      await db.update(profiles)
        .set({
          baselineCompletedAt: Math.floor(Date.now() / 1000),
          storyBand: result.storyBand,
        })
        .where(eq(profiles.userId, user.id));

      for (const s of result.skills) {
        await db
          .insert(skillLevels)
          .values({
            userId: user.id,
            skill: s.skill,
            hskLevel: s.hskLevel,
            percentOfTarget: s.percentOfTarget,
            lastAccuracy: s.accuracy,
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .onConflictDoUpdate({
            target: [skillLevels.userId, skillLevels.skill],
            set: {
              hskLevel: s.hskLevel,
              percentOfTarget: s.percentOfTarget,
              lastAccuracy: s.accuracy,
              updatedAt: Math.floor(Date.now() / 1000),
            },
          });
      }

      // Seed the deck. Characters the learner already reads go in as mature
      // cards so FSRS does not make him re-learn what he knows; everything else
      // arrives through chapters.
      const seeded = seedKnownSet(result);
      const nowSec = Math.floor(Date.now() / 1000);
      for (const ch of seeded) {
        const base = newCardState();
        await db
          .insert(cards)
          .values({
            id: `${user.id}:char:${ch}`,
            userId: user.id,
            kind: 'char',
            value: ch,
            ...base,
            state: 2,
            stability: 3,
            difficulty: 5,
            reps: 1,
            due: nowSec + 2 * 86400,
            lastReview: nowSec,
            cardLevel: 2,
            rarity: rarityOf(ch),
          })
          .onConflictDoNothing();
      }
    }

    const after = done ? { state: next, item: null } : ensureItem(next);

    await db
      .update(baselineRuns)
      .set({
        state: after.state,
        result,
        completedAt: done ? Math.floor(Date.now() / 1000) : null,
      })
      .where(eq(baselineRuns.id, run.id));

    const upcoming = after.item;

    return {
      feedback: {
        correct: marked.correct,
        score: marked.score,
        en: marked.feedbackEn,
        zh: marked.feedbackZh,
        detail: marked.detail ?? null,
      },
      progress: progress(next),
      stage: STAGES[next.stageIndex] ?? null,
      stageIndex: next.stageIndex,
      stageChanged: next.stageIndex !== state.stageIndex,
      item: upcoming ? publicItem(upcoming) : null,
      done,
      result,
    };
  });
}
