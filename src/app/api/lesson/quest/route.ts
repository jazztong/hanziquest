import { eq } from 'drizzle-orm';
import { db, lessons, items as itemsTable } from '@/lib/db';
import { requireUser, studentIdFor } from '@/lib/auth';
import { knownChars, profile } from '@/lib/player';
import { buildQuest, type LessonInput } from '@/lib/lesson/quest';
import { publicItem } from '@/lib/items/public';
import { planClip } from '@/lib/providers/tts';
import { BadRequest, route } from '@/lib/api';

/**
 * Build the side quest for one uploaded 课文.
 *
 * Built on every request rather than stored: the quest depends on what the
 * student currently knows, and that changes daily. A quest cached on upload
 * would still be pre-teaching words he learned last week.
 */
export async function GET(req: Request) {
  const lessonId = new URL(req.url).searchParams.get('id');

  return route(async () => {
    if (!lessonId) throw new BadRequest('lesson id required');
    const user = await requireUser();
    const studentId = await studentIdFor(user);

    const rows = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
    const row = rows[0];
    if (!row || row.userId !== studentId) throw new BadRequest('lesson not found');

    const p = await profile(studentId);
    const known = await knownChars(studentId);

    const input: LessonInput = {
      id: row.id,
      title: row.title,
      bookRef: row.bookRef,
      text: row.text,
      vocab: (row.vocab as string[]) ?? [],
    };

    const quest = buildQuest(input, known, Math.max(1, p?.storyBand ?? 2));

    // Persist the generated items. Two reasons, both from the brief:
    // the parent must be able to review anything generated, and marking needs
    // to look an item up server-side rather than trust what the client sends
    // back. Re-running replaces this lesson's items rather than accumulating.
    await db.delete(itemsTable).where(eq(itemsTable.lessonId, row.id));
    for (const it of quest.items) {
      await db.insert(itemsTable).values({
        id: it.id,
        type: it.type,
        standardRef: it.standardRef ?? null,
        year: it.year,
        band: it.band,
        skill: it.skill,
        payload: it.payload,
        answer: it.answer,
        source: 'lesson',
        lessonId: row.id,
      });
    }

    // Audio plan per line so the karaoke reading works the same way chapters do.
    const clips: Record<string, ReturnType<typeof planClip>> = {};
    for (const line of quest.lines) clips[line.id] = planClip(line.zh, 'narrator');

    return {
      ...quest,
      // The answer keys stay server-side, exactly as in the campaign.
      items: quest.items.map(publicItem),
      clips,
    };
  });
}
