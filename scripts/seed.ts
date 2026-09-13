/**
 * Seeds a fresh database: two accounts, the seed chapters, the item bank, the
 * 14 relics, exam dates, milestones and three sample 课文.
 *
 * Idempotent by primary key - re-running replaces rather than duplicates.
 */
import { createClient } from '@libsql/client';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { hashPassword } from '../src/lib/auth-hash';
import { ALL_SEED_CHAPTERS } from '../src/content/chapters';
import { POEMS } from '../src/content/poems';
import { LANGUAGE_KNOWLEDGE_ITEMS, PASSAGES } from '../src/content/baseline-items';
import { SAMPLE_LESSONS } from '../src/content/sample-lessons';
import { GENRES } from '../src/content/genres';
import { EXAM_DATES, MILESTONES } from '../src/content/milestones';

const DB_FILE = path.join(process.cwd(), 'data', 'app.db');
const client = createClient({ url: `file:${DB_FILE}` });

const STUDENT_ID = 'u-student';
const PARENT_ID = 'u-parent';

/**
 * Exam dates.
 *
 * The 统考 date is real for 2026 (22 Oct, from the published timetable) and
 * projected for 2028 - the student's 初三 year - by the same late-October pattern.
 * Everything else is a placeholder the parent edits; `is_placeholder` is what
 * makes the dashboard nag until they confirm.
 */
// EXAM_DATES and MILESTONES now live in src/content/milestones.ts, shared with
// bootstrapStudent so a registered account starts the same way this one does.

async function run(sql: string, args: unknown[] = []) {
  await client.execute({ sql, args: args as never });
}

async function main() {
  console.log('seeding...');

  // --- accounts -----------------------------------------------------------
  // Generated rather than hard-coded, and printed once.
  //
  // A password written into the repository is a password every reader of the
  // repository already has, and this database ends up holding a child's work
  // and their voice recordings. Generating it means there is nothing to leak
  // and no two checkouts share a login. Set SEED_PASSWORD to choose your own.
  const newPassword = () => process.env.SEED_PASSWORD || randomBytes(6).toString('base64url');
  const studentPw = newPassword();
  const parentPw = newPassword();

  // Re-seeding must not reset a password that is already in use, so the upsert
  // below leaves password_hash alone on conflict. That means a generated
  // password only becomes real for an account that did not exist yet - and
  // printing it either way would confidently report a login that does not work.
  const existing = await client.execute('SELECT id FROM users');
  const isNew = (id: string) => !existing.rows.some((r) => r.id === id);
  const studentIsNew = isNew(STUDENT_ID);
  const parentIsNew = isNew(PARENT_ID);

  await run(
    `INSERT INTO users (id, name, role, password_hash) VALUES (?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, role=excluded.role`,
    [STUDENT_ID, 'student', 'student', hashPassword(studentPw)],
  );
  await run(
    `INSERT INTO users (id, name, role, password_hash) VALUES (?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, role=excluded.role`,
    [PARENT_ID, 'parent', 'parent', hashPassword(parentPw)],
  );
  await run(
    `INSERT INTO profiles (user_id, genre, hero_name) VALUES (?,?,?)
     ON CONFLICT(user_id) DO NOTHING`,
    [STUDENT_ID, 'mystery', ''],
  );
  await run(
    `INSERT INTO profiles (user_id, genre) VALUES (?,?) ON CONFLICT(user_id) DO NOTHING`,
    [PARENT_ID, 'mystery'],
  );

  // --- chapters -----------------------------------------------------------
  for (const ch of ALL_SEED_CHAPTERS) {
    await run(
      `INSERT INTO chapters (id, user_id, genre, arc, seq, title, title_en, band, script, targets, art_id, source)
       VALUES (?,NULL,?,?,?,?,?,?,?,?,?,'seed')
       ON CONFLICT(id) DO UPDATE SET script=excluded.script, targets=excluded.targets,
         title=excluded.title, title_en=excluded.title_en, band=excluded.band, art_id=excluded.art_id`,
      [
        ch.id,
        ch.genre,
        ch.arc,
        ch.seq,
        ch.title,
        ch.titleEn,
        ch.band,
        JSON.stringify(ch.script),
        JSON.stringify(ch.script.targets.map((t) => t.zh)),
        ch.artId,
      ],
    );
  }
  console.log(`  chapters: ${ALL_SEED_CHAPTERS.length}`);

  // --- story bibles -------------------------------------------------------
  for (const g of GENRES) {
    await run(
      `INSERT INTO story_bibles (id, user_id, genre, bible) VALUES (?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET bible=excluded.bible`,
      [`sb-${STUDENT_ID}-${g.id}`, STUDENT_ID, g.id, JSON.stringify(g.bible)],
    );
  }
  console.log(`  story bibles: ${GENRES.length}`);

  // --- items --------------------------------------------------------------
  const allItems = [...LANGUAGE_KNOWLEDGE_ITEMS, ...PASSAGES.flatMap((p) => p.questions)];
  for (const it of allItems) {
    await run(
      `INSERT INTO items (id, type, standard_ref, year, band, skill, payload, answer, source)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, answer=excluded.answer`,
      [
        it.id,
        it.type,
        it.standardRef ?? null,
        it.year,
        it.band,
        it.skill,
        JSON.stringify(it.payload),
        JSON.stringify(it.answer),
        it.source,
      ],
    );
  }
  console.log(`  items: ${allItems.length}`);

  // --- relics -------------------------------------------------------------
  for (const p of POEMS) {
    await run(
      `INSERT INTO relic_progress (user_id, relic_id, stage) VALUES (?,?,0)
       ON CONFLICT(user_id, relic_id) DO NOTHING`,
      [STUDENT_ID, p.id],
    );
  }
  console.log(`  relics: ${POEMS.length}`);

  // --- exams & milestones -------------------------------------------------
  for (const e of EXAM_DATES) {
    await run(
      `INSERT INTO exam_dates (id, user_id, label, kind, date, is_placeholder) VALUES (?,?,?,?,?,?)
       ON CONFLICT(id) DO NOTHING`,
      [e.id, STUDENT_ID, e.label, e.kind, e.date, e.placeholder],
    );
  }
  for (const m of MILESTONES) {
    await run(
      `INSERT INTO milestones (id, user_id, key, title, title_en, kind, target, due_date, arc_id)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(user_id, key) DO UPDATE SET target=excluded.target, due_date=excluded.due_date`,
      [`m-${m.key}`, STUDENT_ID, m.key, m.title, m.titleEn, m.kind, m.target, m.due, m.arc],
    );
  }
  console.log(`  exam dates: ${EXAM_DATES.length}, milestones: ${MILESTONES.length}`);

  // --- sample 课文 ---------------------------------------------------------
  for (const l of SAMPLE_LESSONS) {
    await run(
      `INSERT INTO lessons (id, user_id, title, book_ref, week_of, text, vocab, extracted_by)
       VALUES (?,?,?,?,?,?,?,'seed')
       ON CONFLICT(id) DO UPDATE SET text=excluded.text, vocab=excluded.vocab`,
      [l.id, STUDENT_ID, l.title, l.bookRef, l.weekOf, l.text, JSON.stringify(l.vocab)],
    );
  }
  console.log(`  sample lessons: ${SAMPLE_LESSONS.length}`);

  client.close();
  console.log('\nseed complete.');
  const shown = (name: string, pw: string, fresh: boolean) =>
    fresh ? `${name} / ${pw}` : `${name} / (unchanged - this account already existed)`;
  console.log('  student login:  ' + shown('student', studentPw, studentIsNew));
  console.log('  parent login:   ' + shown('parent', parentPw, parentIsNew));
  if (studentIsNew || parentIsNew) {
    console.log('  Shown once. Change them in the parent dashboard.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
