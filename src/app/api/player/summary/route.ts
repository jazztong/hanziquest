import { and, eq, gte, sql } from 'drizzle-orm';
import { db, cards, milestones, examDates, relicProgress, chapterProgress, reviews, lessons } from '@/lib/db';
import { requireUser, studentIdFor } from '@/lib/auth';
import { knownChars, levelFromXp, profile, skills } from '@/lib/player';
import { POEMS } from '@/content/poems';
import { GENRES_BY_ID } from '@/content/genres';
import { route } from '@/lib/api';

export async function GET() {
  return route(async () => {
    const user = await requireUser();
    const studentId = await studentIdFor(user);
    const p = await profile(studentId);
    const known = await knownChars(studentId);
    const now = Math.floor(Date.now() / 1000);

    const due = await db
      .select({ n: sql<number>`count(*)` })
      .from(cards)
      .where(and(eq(cards.userId, studentId), sql`${cards.due} <= ${now}`));

    const total = await db
      .select({ n: sql<number>`count(*)` })
      .from(cards)
      .where(eq(cards.userId, studentId));

    const relics = await db
      .select()
      .from(relicProgress)
      .where(eq(relicProgress.userId, studentId));

    const ms = await db.select().from(milestones).where(eq(milestones.userId, studentId));
    const exams = await db.select().from(examDates).where(eq(examDates.userId, studentId));

    const chaptersDone = await db
      .select({ n: sql<number>`count(*)` })
      .from(chapterProgress)
      .where(and(eq(chapterProgress.userId, studentId), sql`${chapterProgress.completedAt} is not null`));

    const weekAgo = now - 7 * 86400;
    const reviewsWeek = await db
      .select({ n: sql<number>`count(*)` })
      .from(reviews)
      .where(and(eq(reviews.userId, studentId), gte(reviews.reviewedAt, weekAgo)));

    const nextExam = exams
      .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    const lessonRows = await db
      .select({ id: lessons.id, title: lessons.title, bookRef: lessons.bookRef, weekOf: lessons.weekOf })
      .from(lessons)
      .where(eq(lessons.userId, studentId));

    return {
      lessons: lessonRows,
      profile: p && {
        ...p,
        ...levelFromXp(p.xp),
        genreName: GENRES_BY_ID.get(p.genre as never)?.nameZh ?? '',
        genreNameEn: GENRES_BY_ID.get(p.genre as never)?.nameEn ?? '',
      },
      skills: await skills(studentId),
      knownChars: known.size,
      cards: { due: Number(due[0]?.n ?? 0), total: Number(total[0]?.n ?? 0) },
      relics: {
        total: POEMS.length,
        activated: relics.filter((r) => r.stage >= 4).length,
        started: relics.filter((r) => r.stage > 0).length,
      },
      chaptersCompleted: Number(chaptersDone[0]?.n ?? 0),
      reviewsThisWeek: Number(reviewsWeek[0]?.n ?? 0),
      milestones: ms.map((m) => ({
        ...m,
        pct: Math.min(100, Math.round((m.current / m.target) * 100)),
      })),
      exams,
      nextExam: nextExam
        ? {
            ...nextExam,
            daysAway: Math.ceil(
              (new Date(nextExam.date).getTime() - Date.now()) / 86400000,
            ),
          }
        : null,
    };
  });
}
