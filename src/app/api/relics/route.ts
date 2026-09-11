import { eq } from 'drizzle-orm';
import { db, relicProgress } from '@/lib/db';
import { requireUser, studentIdFor } from '@/lib/auth';
import { POEMS, poemText } from '@/content/poems';
import { pinyinOf } from '@/lib/lexicon';
import { BadRequest, body, route } from '@/lib/api';

export async function GET() {
  return route(async () => {
    const user = await requireUser();
    const studentId = await studentIdFor(user);
    const rows = await db.select().from(relicProgress).where(eq(relicProgress.userId, studentId));
    const byId = new Map(rows.map((r) => [r.relicId, r]));

    return {
      relics: POEMS.map((p) => ({
        id: p.id,
        title: p.title,
        titleEn: p.titleEn,
        author: p.author,
        dynasty: p.dynasty,
        book: p.book,
        lesson: p.lesson,
        year: p.year,
        form: p.form,
        gist: p.gist,
        hook: p.hook,
        artId: p.artId,
        // Classical readings declared on the poem beat the modern dictionary.
        lines: p.lines.map((l) => ({
          ...l,
          pinyin: pinyinOf(l.zh, Object.fromEntries(p.polyphonic.map((x) => [x.char, x.reading]))),
        })),
        notes: p.notes,
        polyphonic: p.polyphonic,
        charCount: [...poemText(p)].filter((c) => /[一-鿿]/u.test(c)).length,
        stage: byId.get(p.id)?.stage ?? 0,
        bestCloze: byId.get(p.id)?.bestClozeScore ?? 0,
        bestRecite: byId.get(p.id)?.bestReciteScore ?? 0,
      })),
    };
  });
}

export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{
      relicId: string;
      stage?: number;
      clozeScore?: number;
      reciteScore?: number;
    }>(req);
    const user = await requireUser();
    const studentId = await studentIdFor(user);
    const rows = await db
      .select()
      .from(relicProgress)
      .where(eq(relicProgress.relicId, input.relicId));
    const cur = rows.find((r) => r.userId === studentId);
    const now = Math.floor(Date.now() / 1000);

    const stage = Math.max(cur?.stage ?? 0, input.stage ?? 0);
    const bestCloze = Math.max(cur?.bestClozeScore ?? 0, input.clozeScore ?? 0);
    const bestRecite = Math.max(cur?.bestReciteScore ?? 0, input.reciteScore ?? 0);

    await db
      .insert(relicProgress)
      .values({
        userId: studentId,
        relicId: input.relicId,
        stage,
        bestClozeScore: bestCloze,
        bestReciteScore: bestRecite,
        activatedAt: stage >= 4 ? (cur?.activatedAt ?? now) : null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [relicProgress.userId, relicProgress.relicId],
        set: {
          stage,
          bestClozeScore: bestCloze,
          bestReciteScore: bestRecite,
          activatedAt: stage >= 4 ? (cur?.activatedAt ?? now) : null,
          updatedAt: now,
        },
      });

    return { stage, bestCloze, bestRecite };
  });
}
