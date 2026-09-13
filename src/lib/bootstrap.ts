import { db, profiles, storyBibles, relicProgress, examDates, milestones } from '@/lib/db';
import { GENRES } from '@/content/genres';
import { POEMS } from '@/content/poems';
import { EXAM_DATES, MILESTONES } from '@/content/milestones';

/**
 * Give a newly registered student the state the app expects to already exist.
 *
 * A blank account is not a working account: the map reads a profile, the deck
 * reads relic progress, the hub counts down to exam dates, and the milestone
 * bar needs targets. Without these the first screen a new player sees is an
 * empty one, which reads as the app being broken rather than new.
 *
 * This mirrors what scripts/seed.ts does for the demo account. The two are
 * separate because the seed talks to a local SQLite file through libSQL long
 * before any Worker exists, while this runs inside a request against D1. If you
 * add per-student starting data to one, add it to the other.
 *
 * Everything is written with conflict handling so a retried registration, or a
 * half-finished one, converges rather than failing.
 */
export async function bootstrapStudent(userId: string, genre = 'mystery'): Promise<void> {
  await db
    .insert(profiles)
    .values({ userId, genre: genre as 'mystery' | 'scifi' | 'wuxia' | 'legend', heroName: '' })
    .onConflictDoNothing();

  for (const g of GENRES) {
    await db
      .insert(storyBibles)
      .values({ id: `sb-${userId}-${g.id}`, userId, genre: g.id, bible: g.bible })
      .onConflictDoNothing();
  }

  for (const p of POEMS) {
    await db.insert(relicProgress).values({ userId, relicId: p.id, stage: 0 }).onConflictDoNothing();
  }

  // Ids are scoped to the student on purpose.
  //
  // The seed used the bare content id for both of these, which is unique only
  // while there is exactly one student in the database. With two, the second
  // registration would hit the primary key, be skipped by the conflict clause,
  // and leave that child with no exam dates and no milestones at all - a blank
  // hub, with nothing to indicate anything had gone wrong.
  for (const e of EXAM_DATES) {
    await db
      .insert(examDates)
      .values({
        id: `${e.id}-${userId}`,
        userId,
        label: e.label,
        kind: e.kind,
        date: e.date,
        isPlaceholder: Boolean(e.placeholder),
      })
      .onConflictDoNothing();
  }

  for (const m of MILESTONES) {
    await db
      .insert(milestones)
      .values({
        id: `m-${m.key}-${userId}`,
        userId,
        key: m.key,
        title: m.title,
        titleEn: m.titleEn,
        kind: m.kind,
        target: m.target,
        dueDate: m.due,
        arcId: m.arc,
      })
      .onConflictDoNothing();
  }
}
