import { eq } from 'drizzle-orm';
import { db, items as itemsTable, attempts, errorLog } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { resolveOption } from '@/lib/items/public';
import { buildReveal } from '@/lib/items/reveal';
import { addXp, touchStreak } from '@/lib/player';
import type { Item } from '@/lib/items/types';
import { BadRequest, body, route } from '@/lib/api';

/**
 * Mark one 课文 side-quest answer.
 *
 * The item is loaded from the database by id, so the answer key never reaches
 * the client and the positional option ids map back the same way they do
 * everywhere else. Wrong answers feed the same error log the daily session and
 * the arcade read from - a word missed in this week's 课文 is exactly the kind
 * of thing that should come back tomorrow.
 */
export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{ itemId: string; value: string; elapsedMs?: number }>(req);
    if (!input.itemId) throw new BadRequest('itemId required');
    const user = await requireStudent();

    const rows = await db.select().from(itemsTable).where(eq(itemsTable.id, input.itemId)).limit(1);
    const row = rows[0];
    if (!row) throw new BadRequest('item not found');

    const item = {
      id: row.id,
      type: row.type,
      skill: row.skill,
      band: row.band,
      year: row.year,
      payload: row.payload,
      answer: row.answer,
      tags: [],
    } as unknown as Item;

    const chosen = resolveOption(item, input.value ?? '');
    const key = item.answer.correct;
    const correct = Array.isArray(key) ? key.includes(chosen) : key === chosen;

    await db.insert(attempts).values({
      userId: user.id,
      itemId: row.id,
      context: 'lesson',
      contextRef: row.lessonId,
      response: { value: input.value },
      correct,
      score: correct ? 1 : 0,
      elapsedMs: input.elapsedMs ?? 0,
    });

    if (!correct && row.standardRef) {
      await db.insert(errorLog).values({
        userId: user.id,
        tag: `standard:${row.standardRef}`,
        skill: row.skill,
        detail: String(item.payload.stem ?? '').slice(0, 80),
      });
    }

    await touchStreak(user.id);
    if (correct) await addXp(user.id, 6);

    return {
      correct,
      explainEn: item.answer.explainEn ?? '',
      explainZh: item.answer.explainZh ?? '',
      // The reading of whatever the question was actually about - the word that
      // fills the gap, the 多音字 in its sentence. Null for the item types where
      // a pinyin card would be noise, such as sequencing a paragraph.
      reveal: buildReveal(item),
      // The untouched line, sent only once the answer is in. Read aloud after a
      // miss: a word heard inside the sentence it came from is worth more than
      // the same word heard on its own, and for punctuation the line IS the
      // lesson - a comma is a pause, and a pause can only be heard.
      sourceLine: correct ? '' : item.answer.sourceLine ?? '',
    };
  });
}
