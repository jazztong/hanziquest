import { and, desc, eq, isNull } from 'drizzle-orm';
import { db, baselineRuns } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { ensureItem, newRun, progress, STAGES, type RunState } from '@/lib/baseline';
import { body, route } from '@/lib/api';
import { publicItem } from '@/lib/items/public';

/**
 * Starts a baseline run, or resumes the one already in progress.
 *
 * Resuming rather than restarting is the whole point of storing the run: the
 * brief asks for a 40-minute assessment "splittable into 2 sittings", and the
 * only honest way to do that is to make an interrupted run resumable to the
 * exact item.
 */
export async function POST(req: Request) {
  return route(async () => {
    // An empty body is legitimate here - "just start the default run" - so the
    // parse failure is swallowed rather than rejected.
    const { kind = 'prologue' } = await body<{ kind?: 'prologue' | 'retest' }>(req).catch(
      () => ({ kind: 'prologue' as const }),
    );
    const user = await requireStudent();

    const open = await db
      .select()
      .from(baselineRuns)
      .where(and(eq(baselineRuns.userId, user.id), isNull(baselineRuns.completedAt)))
      .orderBy(desc(baselineRuns.startedAt))
      .limit(1);

    let runId: string;
    let state: RunState;

    if (open[0]) {
      runId = open[0].id;
      state = open[0].state as RunState;
    } else {
      runId = `br-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      state = newRun();
      await db.insert(baselineRuns).values({ id: runId, userId: user.id, kind, state });
    }

    // Generating an item mutates the run - it pins which question the player is
    // looking at - so the new state is written back before responding.
    const pinned = ensureItem(state);
    if (pinned.state !== state) {
      await db.update(baselineRuns).set({ state: pinned.state }).where(eq(baselineRuns.id, runId));
    }
    const item = pinned.item;

    return {
      runId,
      resumed: Boolean(open[0]),
      stage: STAGES[pinned.state.stageIndex] ?? null,
      stageIndex: pinned.state.stageIndex,
      stages: STAGES,
      progress: progress(pinned.state),
      item: item ? publicItem(item) : null,
    };
  });
}
