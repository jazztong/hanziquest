/**
 * Table DDL, hand-written to keep `npm run dev` a single command with no
 * migration tooling in the loop.
 *
 * This duplicates src/lib/db/schema.ts, which is a real risk, so
 * tests/db-schema.test.ts asserts that every table declared in the Drizzle
 * schema has a CREATE TABLE here and that the column sets match. If you add a
 * column to the schema and forget the DDL, the test fails.
 */
export const DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    linked_student_id TEXT REFERENCES users(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_name_idx ON users(name)`,

  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)`,

  `CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    genre TEXT NOT NULL DEFAULT 'mystery',
    avatar_id TEXT NOT NULL DEFAULT 'avatar-01',
    hero_name TEXT NOT NULL DEFAULT '',
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_played_on TEXT,
    baseline_completed_at INTEGER,
    story_band INTEGER NOT NULL DEFAULT 1,
    daily_minutes_goal INTEGER NOT NULL DEFAULT 25,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,

  `CREATE TABLE IF NOT EXISTS skill_levels (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    hsk_level REAL NOT NULL DEFAULT 0,
    percent_of_target REAL NOT NULL DEFAULT 0,
    last_accuracy REAL NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS skill_levels_pk ON skill_levels(user_id, skill)`,

  `CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    value TEXT NOT NULL,
    state INTEGER NOT NULL DEFAULT 0,
    due INTEGER NOT NULL,
    stability REAL NOT NULL DEFAULT 0,
    difficulty REAL NOT NULL DEFAULT 0,
    elapsed_days REAL NOT NULL DEFAULT 0,
    scheduled_days REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    last_review INTEGER,
    card_level INTEGER NOT NULL DEFAULT 1,
    rarity TEXT NOT NULL DEFAULT 'common',
    first_seen_chapter_id TEXT,
    can_write INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS cards_user_value_idx ON cards(user_id, kind, value)`,
  `CREATE INDEX IF NOT EXISTS cards_due_idx ON cards(user_id, due)`,

  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    mode TEXT NOT NULL,
    elapsed_ms INTEGER NOT NULL DEFAULT 0,
    reviewed_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS reviews_user_time_idx ON reviews(user_id, reviewed_at)`,

  `CREATE TABLE IF NOT EXISTS story_bibles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre TEXT NOT NULL,
    bible TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS story_bibles_user_genre_idx ON story_bibles(user_id, genre)`,

  `CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    genre TEXT NOT NULL,
    arc INTEGER NOT NULL DEFAULT 1,
    seq INTEGER NOT NULL,
    title TEXT NOT NULL,
    title_en TEXT NOT NULL DEFAULT '',
    band INTEGER NOT NULL DEFAULT 1,
    script TEXT NOT NULL,
    targets TEXT NOT NULL,
    coverage TEXT,
    art_id TEXT,
    source TEXT NOT NULL DEFAULT 'seed',
    prompt TEXT,
    reviewed_by_parent INTEGER NOT NULL DEFAULT 0,
    flagged INTEGER NOT NULL DEFAULT 0,
    flag_note TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS chapters_genre_seq_idx ON chapters(genre, arc, seq)`,

  `CREATE TABLE IF NOT EXISTS chapter_progress (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id TEXT NOT NULL,
    path TEXT NOT NULL DEFAULT '[]',
    comprehension_score REAL NOT NULL DEFAULT 0,
    detours INTEGER NOT NULL DEFAULT 0,
    started_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS chapter_progress_pk ON chapter_progress(user_id, chapter_id)`,

  `CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    standard_ref TEXT,
    year INTEGER NOT NULL DEFAULT 1,
    band INTEGER NOT NULL DEFAULT 1,
    skill TEXT NOT NULL,
    payload TEXT NOT NULL,
    answer TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'seed',
    prompt TEXT,
    lesson_id TEXT,
    reviewed_by_parent INTEGER NOT NULL DEFAULT 0,
    flagged INTEGER NOT NULL DEFAULT 0,
    flag_note TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS items_type_band_idx ON items(type, band)`,
  `CREATE INDEX IF NOT EXISTS items_skill_idx ON items(skill, year)`,

  `CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    context TEXT NOT NULL DEFAULT 'drill',
    context_ref TEXT,
    response TEXT,
    correct INTEGER,
    score REAL NOT NULL DEFAULT 0,
    max_score REAL NOT NULL DEFAULT 1,
    marking TEXT,
    marked_by TEXT NOT NULL DEFAULT 'rule',
    elapsed_ms INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS attempts_user_time_idx ON attempts(user_id, created_at)`,

  `CREATE TABLE IF NOT EXISTS error_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    skill TEXT NOT NULL,
    detail TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS error_log_user_tag_idx ON error_log(user_id, tag)`,

  `CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    book_ref TEXT NOT NULL DEFAULT '',
    week_of TEXT,
    text TEXT NOT NULL,
    vocab TEXT NOT NULL DEFAULT '[]',
    extracted_by TEXT NOT NULL DEFAULT 'manual',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS lessons_user_idx ON lessons(user_id, week_of)`,

  `CREATE TABLE IF NOT EXISTS relic_progress (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relic_id TEXT NOT NULL,
    stage INTEGER NOT NULL DEFAULT 0,
    best_cloze_score REAL NOT NULL DEFAULT 0,
    best_recite_score REAL NOT NULL DEFAULT 0,
    activated_at INTEGER,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS relic_progress_pk ON relic_progress(user_id, relic_id)`,

  `CREATE TABLE IF NOT EXISTS exam_dates (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    kind TEXT NOT NULL,
    date TEXT NOT NULL,
    is_placeholder INTEGER NOT NULL DEFAULT 1
  )`,
  `CREATE INDEX IF NOT EXISTS exam_dates_user_idx ON exam_dates(user_id, date)`,

  `CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    title TEXT NOT NULL,
    title_en TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL,
    target REAL NOT NULL,
    current REAL NOT NULL DEFAULT 0,
    due_date TEXT,
    arc_id TEXT,
    achieved_at INTEGER
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS milestones_pk ON milestones(user_id, key)`,

  `CREATE TABLE IF NOT EXISTS play_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at INTEGER NOT NULL DEFAULT (unixepoch()),
    ended_at INTEGER,
    seconds INTEGER NOT NULL DEFAULT 0,
    summary TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS play_sessions_user_idx ON play_sessions(user_id, started_at)`,

  `CREATE TABLE IF NOT EXISTS recordings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    ref_id TEXT,
    path TEXT NOT NULL,
    target_text TEXT NOT NULL,
    score TEXT,
    scored_by TEXT NOT NULL DEFAULT 'none',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE INDEX IF NOT EXISTS recordings_user_idx ON recordings(user_id, created_at)`,

  `CREATE TABLE IF NOT EXISTS daily_plans (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    plan TEXT NOT NULL,
    completed_steps TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS daily_plans_pk ON daily_plans(user_id, day)`,

  `CREATE TABLE IF NOT EXISTS baseline_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'prologue',
    state TEXT NOT NULL,
    result TEXT,
    started_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS baseline_runs_user_idx ON baseline_runs(user_id, started_at)`,
];
