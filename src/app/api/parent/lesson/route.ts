import { eq } from 'drizzle-orm';
import { db, lessons, items } from '@/lib/db';
import { requireUser, studentIdFor, AuthError } from '@/lib/auth';
import { uniqueHanzi, lookupWord, WORDS, pinyinOf } from '@/lib/lexicon';
import { BadRequest, body, route } from '@/lib/api';

/**
 * Upload this week's 课文.
 *
 * Vocabulary extraction is done by dictionary lookup, not by the model: we take
 * every multi-character word in the HSK lexicon that actually appears in the
 * text and sits above the student's current band. That is reproducible, it
 * cannot invent a word that is not in the passage, and it works with no API key.
 * Claude's role here is OCR only - turning a photo of a page into text - which
 * is the one part of this a dictionary cannot do.
 */
export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{
      id?: string;
      title?: string;
      bookRef?: string;
      weekOf?: string;
      text?: string;
      vocab?: string[];
      band?: number;
    }>(req);
    if (!input.text?.trim()) throw new BadRequest('lesson text required');

    const user = await requireUser();
    if (user.role !== 'parent') throw new AuthError('parent account required');
    const studentId = await studentIdFor(user);

    const text = input.text!.trim();
    const band = input.band ?? 3;

    const found = new Set<string>(input.vocab ?? []);
    for (const w of WORDS) {
      if (w.band <= band) continue;
      if ([...w.w].length < 2) continue;
      if (text.includes(w.w)) found.add(w.w);
      if (found.size > 60) break;
    }

    const id = input.id ?? `lesson-${Date.now().toString(36)}`;
    await db
      .insert(lessons)
      .values({
        id,
        userId: studentId,
        title: input.title ?? '未命名课文',
        bookRef: input.bookRef ?? '',
        weekOf: input.weekOf ?? null,
        text,
        vocab: [...found],
        extractedBy: 'manual',
      })
      .onConflictDoUpdate({
        target: lessons.id,
        set: {
          text,
          vocab: [...found],
          title: input.title ?? '未命名课文',
          bookRef: input.bookRef ?? '',
          weekOf: input.weekOf ?? null,
        },
      });

    return {
      id,
      vocab: [...found].map((w) => ({
        w,
        pinyin: pinyinOf(w),
        gloss: lookupWord(w)?.gloss ?? '',
        band: lookupWord(w)?.band ?? null,
      })),
      chars: uniqueHanzi(text).length,
    };
  });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  return route(async () => {
    if (!id) throw new BadRequest('id required');
    const user = await requireUser();
    if (user.role !== 'parent') throw new AuthError('parent account required');
    // Items generated FROM this lesson go with it. Leaving orphaned 统考-style
    // questions pointing at deleted textbook text would be both confusing and a
    // slow leak of the content the parent asked to remove.
    await db.delete(items).where(eq(items.lessonId, id));
    await db.delete(lessons).where(eq(lessons.id, id));
    return { ok: true };
  });
}
