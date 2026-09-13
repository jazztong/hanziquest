import { and, desc, eq, gte, sql } from 'drizzle-orm';
import {
  db,
  attempts,
  cards,
  chapters,
  chapterProgress,
  errorLog,
  examDates,
  items,
  lessons,
  milestones,
  playSessions,
  recordings,
  reviews,
} from '@/lib/db';
import { requireUser, studentIdFor, AuthError } from '@/lib/auth';
import { knownChars, profile, skills } from '@/lib/player';
import { route } from '@/lib/api';
import manifest from '../../../../../art/manifest.json';

/** Pending art, read from the manifest - the source of truth for art state. */
/**
 * Pending art, read from the manifest.
 *
 * Imported rather than read at request time: the manifest is written by the
 * art generation script at build time and never changes while the app runs,
 * and Cloudflare Workers have no filesystem to read it from.
 */
function pendingArt() {
  return (manifest.entries as { id: string; type: string; status: string; createdBy?: string; error?: string }[])
    .filter((e) => e.status !== 'done')
    .map((e) => ({ id: e.id, type: e.type, status: e.status, createdBy: e.createdBy, error: e.error }));
}

export async function GET() {
  return route(async () => {
    const user = await requireUser();
    if (user.role !== 'parent') throw new AuthError('parent account required');
    const studentId = await studentIdFor(user);

    const now = Math.floor(Date.now() / 1000);
    const weekAgo = now - 7 * 86400;
    const monthAgo = now - 30 * 86400;

    const sessions = await db
      .select()
      .from(playSessions)
      .where(and(eq(playSessions.userId, studentId), gte(playSessions.startedAt, monthAgo)))
      .orderBy(desc(playSessions.startedAt));

    // Weak areas: the error log grouped by tag over 30 days. Raw counts rather
    // than a recency-weighted score, because a parent needs something they can
    // act on, not a number they have to interpret.
    const weak = await db
      .select({ tag: errorLog.tag, skill: errorLog.skill, n: sql<number>`count(*)` })
      .from(errorLog)
      .where(and(eq(errorLog.userId, studentId), gte(errorLog.createdAt, monthAgo)))
      .groupBy(errorLog.tag, errorLog.skill)
      .orderBy(sql`count(*) desc`)
      .limit(20);

    const recs = await db
      .select()
      .from(recordings)
      .where(eq(recordings.userId, studentId))
      .orderBy(desc(recordings.createdAt))
      .limit(20);

    const recentAttempts = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.userId, studentId), gte(attempts.createdAt, weekAgo)))
      .orderBy(desc(attempts.createdAt))
      .limit(200);

    const chapterRows = await db.select().from(chapters);
    const progressRows = await db
      .select()
      .from(chapterProgress)
      .where(eq(chapterProgress.userId, studentId));

    const reviewsByDay = await db
      .select({
        day: sql<string>`date(${reviews.reviewedAt}, 'unixepoch', 'localtime')`,
        n: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(and(eq(reviews.userId, studentId), gte(reviews.reviewedAt, monthAgo)))
      .groupBy(sql`1`)
      .orderBy(sql`1`);

    const cardCount = await db
      .select({
        n: sql<number>`count(*)`,
        mature: sql<number>`sum(case when ${cards.state} >= 2 then 1 else 0 end)`,
      })
      .from(cards)
      .where(eq(cards.userId, studentId));

    const graded = recentAttempts.filter((a) => a.correct !== null);

    return {
      profile: await profile(studentId),
      skills: await skills(studentId),
      knownChars: (await knownChars(studentId)).size,
      cards: {
        total: Number(cardCount[0]?.n ?? 0),
        mature: Number(cardCount[0]?.mature ?? 0),
      },
      milestones: await db.select().from(milestones).where(eq(milestones.userId, studentId)),
      exams: await db.select().from(examDates).where(eq(examDates.userId, studentId)),
      lessons: await db.select().from(lessons).where(eq(lessons.userId, studentId)),
      weakAreas: weak.map((w) => ({ ...w, n: Number(w.n) })),
      recordings: recs,
      sessions,
      reviewsByDay: reviewsByDay.map((r) => ({ day: r.day, n: Number(r.n) })),
      attemptsThisWeek: recentAttempts.length,
      accuracyThisWeek: graded.length > 0 ? graded.filter((a) => a.correct).length / graded.length : null,
      chapters: chapterRows.map((c) => ({
        id: c.id,
        title: c.title,
        titleEn: c.titleEn,
        genre: c.genre,
        band: c.band,
        source: c.source,
        prompt: c.prompt,
        flagged: c.flagged,
        reviewedByParent: c.reviewedByParent,
        completed: progressRows.some((p) => p.chapterId === c.id && p.completedAt),
      })),
      itemCount: Number(
        (await db.select({ n: sql<number>`count(*)` }).from(items))[0]?.n ?? 0,
      ),
      pendingArt: pendingArt(),
      providers: {
        claude: Boolean(process.env.ANTHROPIC_API_KEY),
        azure: Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION),
      },
    };
  });
}
