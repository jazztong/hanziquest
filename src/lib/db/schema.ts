/**
 * Database schema (libSQL / SQLite via Drizzle).
 *
 * Design notes that are not obvious from the column names:
 *
 * - Mastery is stored per (user, item) with the FSRS fields inline rather than
 *   in a separate review table. FSRS only ever needs the current card state to
 *   schedule the next review, and keeping it in one row makes "due today"
 *   a single indexed query instead of a join over a review history.
 *   The history is still kept in `reviews` for the parent dashboard, but nothing
 *   in the scheduling path reads it.
 *
 * - Generated content (chapters, items) always stores `source` and `prompt`.
 *   The brief requires every AI artefact to be reviewable and attributable, and
 *   a nullable prompt column is the cheapest way to guarantee it.
 *
 * - Uploaded 课文 lives in `lessons` and is never mixed into `chapters`. It is
 *   the parent's copyrighted textbook content; it must stay local and must not
 *   leak into the seed data or any export.
 */
import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const now = sql`(unixepoch())`;

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    role: text('role', { enum: ['student', 'parent'] }).notNull(),
    /** scrypt hash; see src/lib/auth.ts. Local-only accounts, no email. */
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [uniqueIndex('users_name_idx').on(t.name)],
);

export const sessions = sqliteTable(
  'sessions',
  {
    token: text('token').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

// ---------------------------------------------------------------------------
// Player profile
// ---------------------------------------------------------------------------

export const profiles = sqliteTable('profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  genre: text('genre', {
    enum: ['mystery', 'scifi', 'wuxia', 'legend'],
  }).notNull().default('mystery'),
  avatarId: text('avatar_id').notNull().default('avatar-01'),
  heroName: text('hero_name').notNull().default(''),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  streakDays: integer('streak_days').notNull().default(0),
  lastPlayedOn: text('last_played_on'), // YYYY-MM-DD, local date
  /** Set once the prologue baseline completes. Gates the campaign. */
  baselineCompletedAt: integer('baseline_completed_at'),
  /** Story difficulty 1-7, mapped to the HSK band chapters are written at. */
  storyBand: integer('story_band').notNull().default(1),
  dailyMinutesGoal: integer('daily_minutes_goal').notNull().default(25),
  createdAt: integer('created_at').notNull().default(now),
});

/** One row per skill per user. `skill` values are in src/lib/skills.ts. */
export const skillLevels = sqliteTable(
  'skill_levels',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    skill: text('skill').notNull(),
    /** HSK 3.0 band 0-7. 0 means "below band 1". */
    hskLevel: real('hsk_level').notNull().default(0),
    /** Percent of the 初一 target for this skill, 0-100. */
    percentOfTarget: real('percent_of_target').notNull().default(0),
    /** Raw accuracy on the most recent assessment, 0-1. */
    lastAccuracy: real('last_accuracy').notNull().default(0),
    updatedAt: integer('updated_at').notNull().default(now),
  },
  (t) => [uniqueIndex('skill_levels_pk').on(t.userId, t.skill)],
);

// ---------------------------------------------------------------------------
// 识字 mastery (FSRS)
// ---------------------------------------------------------------------------

/**
 * A collectible card. `kind` distinguishes a single character from a word so
 * both can share one scheduler and one deck view.
 */
export const cards = sqliteTable(
  'cards',
  {
    id: text('id').primaryKey(), // `${userId}:${kind}:${value}`
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind', { enum: ['char', 'word'] }).notNull(),
    value: text('value').notNull(),

    // --- FSRS state -------------------------------------------------------
    state: integer('state').notNull().default(0), // 0 New 1 Learning 2 Review 3 Relearning
    due: integer('due').notNull(),
    stability: real('stability').notNull().default(0),
    difficulty: real('difficulty').notNull().default(0),
    elapsedDays: real('elapsed_days').notNull().default(0),
    scheduledDays: real('scheduled_days').notNull().default(0),
    reps: integer('reps').notNull().default(0),
    lapses: integer('lapses').notNull().default(0),
    lastReview: integer('last_review'),

    // --- game layer -------------------------------------------------------
    /** Card level 1-5, derived from stability. Drives the visual upgrade. */
    cardLevel: integer('card_level').notNull().default(1),
    rarity: text('rarity').notNull().default('common'),
    /** Where the player first met it, for the "found in" line on the card. */
    firstSeenChapterId: text('first_seen_chapter_id'),
    /** True once the learner has written it correctly on the canvas. */
    canWrite: integer('can_write', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [
    uniqueIndex('cards_user_value_idx').on(t.userId, t.kind, t.value),
    index('cards_due_idx').on(t.userId, t.due),
  ],
);

export const reviews = sqliteTable(
  'reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    rating: integer('rating').notNull(), // 1 Again 2 Hard 3 Good 4 Easy
    /** Which mechanic produced the review - recognise, write, listen, read-aloud. */
    mode: text('mode').notNull(),
    elapsedMs: integer('elapsed_ms').notNull().default(0),
    reviewedAt: integer('reviewed_at').notNull().default(now),
  },
  (t) => [index('reviews_user_time_idx').on(t.userId, t.reviewedAt)],
);

// ---------------------------------------------------------------------------
// Story campaign
// ---------------------------------------------------------------------------

/**
 * The story bible. One row per (user, genre): characters, world facts, and the
 * running plot summary. Generation reads this so chapter 9 still remembers what
 * happened in chapter 2.
 */
export const storyBibles = sqliteTable(
  'story_bibles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    genre: text('genre').notNull(),
    /** JSON: { premise, setting, cast: [...], threads: [...], recap: string }. */
    bible: text('bible', { mode: 'json' }).notNull(),
    updatedAt: integer('updated_at').notNull().default(now),
  },
  (t) => [uniqueIndex('story_bibles_user_genre_idx').on(t.userId, t.genre)],
);

export const chapters = sqliteTable(
  'chapters',
  {
    id: text('id').primaryKey(),
    /** Null for seed chapters shared by all players; set for generated ones. */
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    genre: text('genre').notNull(),
    arc: integer('arc').notNull().default(1),
    seq: integer('seq').notNull(),
    title: text('title').notNull(),
    titleEn: text('title_en').notNull().default(''),
    /** HSK band the prose was written to. */
    band: integer('band').notNull().default(1),
    /** JSON ChapterScript - see src/lib/story/types.ts. */
    script: text('script', { mode: 'json' }).notNull(),
    /** JSON string[] of target characters this chapter teaches. */
    targets: text('targets', { mode: 'json' }).notNull(),
    /** JSON CoverageVerdict recorded when the chapter was accepted. */
    coverage: text('coverage', { mode: 'json' }),
    artId: text('art_id'),

    source: text('source', { enum: ['seed', 'claude'] }).notNull().default('seed'),
    prompt: text('prompt'),
    reviewedByParent: integer('reviewed_by_parent', { mode: 'boolean' })
      .notNull()
      .default(false),
    flagged: integer('flagged', { mode: 'boolean' }).notNull().default(false),
    flagNote: text('flag_note'),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [index('chapters_genre_seq_idx').on(t.genre, t.arc, t.seq)],
);

export const chapterProgress = sqliteTable(
  'chapter_progress',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    chapterId: text('chapter_id').notNull(),
    /** JSON: nodes visited and choices made, for resume + parent replay. */
    path: text('path', { mode: 'json' }).notNull().default(sql`'[]'`),
    comprehensionScore: real('comprehension_score').notNull().default(0),
    detours: integer('detours').notNull().default(0),
    startedAt: integer('started_at').notNull().default(now),
    completedAt: integer('completed_at'),
  },
  (t) => [uniqueIndex('chapter_progress_pk').on(t.userId, t.chapterId)],
);

// ---------------------------------------------------------------------------
// Item bank (baseline probes, drills, exam questions)
// ---------------------------------------------------------------------------

export const items = sqliteTable(
  'items',
  {
    id: text('id').primaryKey(),
    /** See src/lib/items/types.ts ItemType. */
    type: text('type').notNull(),
    /** Clause number from the 课程标准, e.g. "1.6.9-比喻". Nullable for probes. */
    standardRef: text('standard_ref'),
    /** 1 = 初一, 2 = 初二, 3 = 初三. */
    year: integer('year').notNull().default(1),
    /** HSK band the item is calibrated to. */
    band: integer('band').notNull().default(1),
    skill: text('skill').notNull(),
    /** JSON payload; shape depends on `type`. */
    payload: text('payload', { mode: 'json' }).notNull(),
    /** JSON marking key / rubric. */
    answer: text('answer', { mode: 'json' }).notNull(),
    source: text('source', { enum: ['seed', 'claude', 'lesson'] })
      .notNull()
      .default('seed'),
    prompt: text('prompt'),
    lessonId: text('lesson_id'),
    reviewedByParent: integer('reviewed_by_parent', { mode: 'boolean' })
      .notNull()
      .default(false),
    flagged: integer('flagged', { mode: 'boolean' }).notNull().default(false),
    flagNote: text('flag_note'),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [
    index('items_type_band_idx').on(t.type, t.band),
    index('items_skill_idx').on(t.skill, t.year),
  ],
);

export const attempts = sqliteTable(
  'attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull(),
    /** Where this attempt happened: baseline, drill, quest, boss, retest. */
    context: text('context').notNull().default('drill'),
    contextRef: text('context_ref'),
    response: text('response', { mode: 'json' }),
    correct: integer('correct', { mode: 'boolean' }),
    score: real('score').notNull().default(0),
    maxScore: real('max_score').notNull().default(1),
    /** JSON marking detail: per-criterion scores, feedback, model answer. */
    marking: text('marking', { mode: 'json' }),
    markedBy: text('marked_by', { enum: ['rule', 'claude', 'self'] })
      .notNull()
      .default('rule'),
    elapsedMs: integer('elapsed_ms').notNull().default(0),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [index('attempts_user_time_idx').on(t.userId, t.createdAt)],
);

/** Weak-area tags accumulated from wrong answers; drives the daily session. */
export const errorLog = sqliteTable(
  'error_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** e.g. "tone:2v3", "char:银", "standard:1.6.9-比喻", "rubric:结构". */
    tag: text('tag').notNull(),
    skill: text('skill').notNull(),
    detail: text('detail'),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [index('error_log_user_tag_idx').on(t.userId, t.tag)],
);

// ---------------------------------------------------------------------------
// 课文 companion
// ---------------------------------------------------------------------------

export const lessons = sqliteTable(
  'lessons',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    /** 册别/课次 as the parent typed it, e.g. "初一下册 第十课". */
    bookRef: text('book_ref').notNull().default(''),
    /** School week this lesson is taught, for scheduling side quests. */
    weekOf: text('week_of'), // YYYY-MM-DD
    /** The lesson text. Parent-uploaded, stays local, never exported. */
    text: text('text').notNull(),
    /** JSON string[] of new vocabulary extracted or supplied. */
    vocab: text('vocab', { mode: 'json' }).notNull().default(sql`'[]'`),
    extractedBy: text('extracted_by', { enum: ['manual', 'claude-ocr', 'seed'] })
      .notNull()
      .default('manual'),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [index('lessons_user_idx').on(t.userId, t.weekOf)],
);

// ---------------------------------------------------------------------------
// 古诗文 relics
// ---------------------------------------------------------------------------

/** Per-user progress on the 14 默写 poems. The poems themselves are static content. */
export const relicProgress = sqliteTable(
  'relic_progress',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    relicId: text('relic_id').notNull(),
    /** 0 locked, 1 heard, 2 understood, 3 cloze-passed, 4 recited (activated). */
    stage: integer('stage').notNull().default(0),
    bestClozeScore: real('best_cloze_score').notNull().default(0),
    bestReciteScore: real('best_recite_score').notNull().default(0),
    activatedAt: integer('activated_at'),
    updatedAt: integer('updated_at').notNull().default(now),
  },
  (t) => [uniqueIndex('relic_progress_pk').on(t.userId, t.relicId)],
);

// ---------------------------------------------------------------------------
// Milestones, exams, sessions played
// ---------------------------------------------------------------------------

export const examDates = sqliteTable(
  'exam_dates',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    /** school-midterm | school-final | uec-junior */
    kind: text('kind').notNull(),
    date: text('date').notNull(), // YYYY-MM-DD
    /** True while it is still the seeded placeholder the parent has not confirmed. */
    isPlaceholder: integer('is_placeholder', { mode: 'boolean' })
      .notNull()
      .default(true),
  },
  (t) => [index('exam_dates_user_idx').on(t.userId, t.date)],
);

export const milestones = sqliteTable(
  'milestones',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    title: text('title').notNull(),
    titleEn: text('title_en').notNull().default(''),
    kind: text('kind').notNull(), // chars | relics | writing | exam | skill
    target: real('target').notNull(),
    current: real('current').notNull().default(0),
    dueDate: text('due_date'),
    arcId: text('arc_id'),
    achievedAt: integer('achieved_at'),
  },
  (t) => [uniqueIndex('milestones_pk').on(t.userId, t.key)],
);

/** One row per play session, for the parent's time-played chart. */
export const playSessions = sqliteTable(
  'play_sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    startedAt: integer('started_at').notNull().default(now),
    endedAt: integer('ended_at'),
    seconds: integer('seconds').notNull().default(0),
    /** JSON summary: xp gained, cards reviewed, chapters completed. */
    summary: text('summary', { mode: 'json' }),
  },
  (t) => [index('play_sessions_user_idx').on(t.userId, t.startedAt)],
);

/**
 * Voice recordings.
 *
 * Nothing writes to this table yet: the capture path was never built, so the
 * `path` column describes an intention rather than a file. It pointed at
 * data/recordings/ on local disk, which no longer exists - the app runs on
 * Cloudflare Workers, which have no filesystem - so when capture is built the
 * audio belongs in a column here, next to the row that describes it.
 *
 * Child voice data is not sent to a third party unless the parent has
 * configured Azure and triggers scoring.
 */
export const recordings = sqliteTable(
  'recordings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // read-aloud | recite | dialogue | baseline
    refId: text('ref_id'),
    /** Path relative to data/recordings/. */
    path: text('path').notNull(),
    targetText: text('target_text').notNull(),
    /** JSON PronunciationScore. */
    score: text('score', { mode: 'json' }),
    scoredBy: text('scored_by', { enum: ['azure', 'webspeech', 'none'] })
      .notNull()
      .default('none'),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [index('recordings_user_idx').on(t.userId, t.createdAt)],
);

/** The generated daily plan, so a refresh does not reshuffle the day. */
export const dailyPlans = sqliteTable(
  'daily_plans',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    day: text('day').notNull(), // YYYY-MM-DD
    /** JSON DailyPlan - see src/lib/plan.ts. */
    plan: text('plan', { mode: 'json' }).notNull(),
    completedSteps: text('completed_steps', { mode: 'json' })
      .notNull()
      .default(sql`'[]'`),
    createdAt: integer('created_at').notNull().default(now),
  },
  (t) => [uniqueIndex('daily_plans_pk').on(t.userId, t.day)],
);

// ---------------------------------------------------------------------------
// Baseline / rank-up trial runs
// ---------------------------------------------------------------------------

/**
 * One adaptive assessment run. Kept as a row rather than in memory so the
 * prologue really is splittable across two sittings: the player can close the
 * app mid-stage and resume exactly where they stopped.
 */
export const baselineRuns = sqliteTable(
  'baseline_runs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    /** prologue = the first one; retest = a monthly rank-up trial. */
    kind: text('kind', { enum: ['prologue', 'retest'] }).notNull().default('prologue'),
    /** JSON RunState - stage cursor, per-skill probe states, answers so far. */
    state: text('state', { mode: 'json' }).notNull(),
    /** JSON BaselineResult, written when the run completes. */
    result: text('result', { mode: 'json' }),
    startedAt: integer('started_at').notNull().default(now),
    completedAt: integer('completed_at'),
  },
  (t) => [index('baseline_runs_user_idx').on(t.userId, t.startedAt)],
);
