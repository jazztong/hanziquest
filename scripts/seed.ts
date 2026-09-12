/**
 * Seeds a fresh database: two accounts, the seed chapters, the item bank, the
 * 14 relics, exam dates, milestones and three sample 课文.
 *
 * Idempotent by primary key - re-running replaces rather than duplicates.
 */
import { createClient } from '@libsql/client';
import path from 'node:path';
import { hashPassword } from '../src/lib/auth-hash';
import { ALL_SEED_CHAPTERS } from '../src/content/chapters';
import { POEMS } from '../src/content/poems';
import { LANGUAGE_KNOWLEDGE_ITEMS, PASSAGES } from '../src/content/baseline-items';
import { SAMPLE_LESSONS } from '../src/content/sample-lessons';
import { GENRES } from '../src/content/genres';

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
const EXAM_DATES = [
  { id: 'e-mid-2026', label: '初一 期末考', kind: 'school-final', date: '2026-11-06', placeholder: 1 },
  { id: 'e-mid-2027', label: '初二 期中考', kind: 'school-midterm', date: '2027-05-14', placeholder: 1 },
  { id: 'e-fin-2027', label: '初二 期末考', kind: 'school-final', date: '2027-11-05', placeholder: 1 },
  { id: 'e-mid-2028', label: '初三 期中考', kind: 'school-midterm', date: '2028-05-12', placeholder: 1 },
  { id: 'e-uec-2028', label: '初中统考 华文 (JY01)', kind: 'uec-junior', date: '2028-10-24', placeholder: 1 },
];

/**
 * Milestones, scoped to 初一 and the 初二 entry point.
 *
 * The 初三 and 统考 targets are real and still recorded in docs/research.md, but
 * a 2028 goal on a thirteen-year-old's home screen in 2026 is not motivating -
 * it is just a large number a long way off. They come back when he gets there.
 */
const MILESTONES = [
  { key: 'chars-500', title: '认识 500 字', titleEn: 'Recognise 500 characters', kind: 'chars', target: 500, due: '2026-12-31', arc: 'arc-1' },
  { key: 'chars-1000', title: '认识 1000 字', titleEn: 'Recognise 1,000 characters', kind: 'chars', target: 1000, due: '2027-06-30', arc: 'arc-2' },
  { key: 'relics-4', title: '收集 4 件初一古诗文遗物', titleEn: 'Activate the 4 初一 poem relics', kind: 'relics', target: 4, due: '2027-01-05', arc: 'arc-2' },
  { key: 'essay-300', title: '完成第一篇 300 字作文', titleEn: 'First 300-character essay (初一 length)', kind: 'writing', target: 300, due: '2026-11-06', arc: 'arc-1' },
  { key: 'exam-final-2026', title: '期末考准备好', titleEn: '初一 期末考 ready', kind: 'exam', target: 70, due: '2026-11-06', arc: 'arc-1' },
  { key: 'entry-junior2', title: '升上初二', titleEn: '初二 entry ready', kind: 'exam', target: 75, due: '2027-01-05', arc: 'arc-2' },
];

async function run(sql: string, args: unknown[] = []) {
  await client.execute({ sql, args: args as never });
}

async function main() {
  console.log('seeding...');

  // --- accounts -----------------------------------------------------------
  // Passwords are seeded, printed once, and meant to be changed. They are not
  // secrets in any meaningful sense: this is a local household app.
  const studentPw = 'student';
  const parentPw = 'parent';

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
  console.log('  student login:  student / student');
  console.log('  parent login:   parent / parent');
  console.log('  change both in the parent dashboard.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
