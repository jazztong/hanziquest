import { and, eq } from 'drizzle-orm';
import { db, cards } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { pickReviewQueue } from '@/lib/srs';
import { lookupChar, lookupWord, readingsOf, isPolyphonic } from '@/lib/lexicon';
import { route } from '@/lib/api';

export async function GET(req: Request) {
  const limit = Number(new URL(req.url).searchParams.get('limit') ?? '30');

  return route(async () => {
    const user = await requireStudent();
    const rows = await db.select().from(cards).where(eq(cards.userId, user.id));

    const queue = pickReviewQueue(
      rows.map((r) => ({
        id: r.id,
        value: r.value,
        due: r.due,
        state: r.state,
        stability: r.stability,
      })),
      { limit, newLimit: Math.max(4, Math.round(limit / 5)) },
    );

    const byId = new Map(rows.map((r) => [r.id, r]));
    return {
      dueTotal: queue.dueTotal,
      deferred: queue.deferred,
      cards: queue.cards.map((q) => {
        const row = byId.get(q.id)!;
        const single = row.kind === 'char';
        const entry = single ? lookupChar(row.value) : lookupWord(row.value);
        return {
          id: row.id,
          kind: row.kind,
          value: row.value,
          readings: single ? readingsOf(row.value) : [],
          polyphonic: single ? isPolyphonic(row.value) : false,
          gloss: entry?.gloss ?? '',
          radical: single ? lookupChar(row.value)?.radical ?? '' : '',
          band: entry?.band ?? null,
          rarity: row.rarity,
          cardLevel: row.cardLevel,
          state: row.state,
          canWrite: row.canWrite,
          reps: row.reps,
          lapses: row.lapses,
        };
      }),
    };
  });
}
