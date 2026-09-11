/**
 * Spaced repetition for the 识字 deck, on top of FSRS.
 *
 * Two things here are ours rather than FSRS's:
 *
 * 1. `gradeFrom` turns a mechanic's result into an FSRS rating. The deck is fed
 *    by four different mechanics (recognise, write, listen, read-aloud) with
 *    very different signal quality, so each maps to ratings differently.
 *
 * 2. `pickReviewQueue` deliberately does NOT hand back every due card. A
 *    13-year-old who opens the app to a 180-card backlog stops opening the app.
 *    The queue is capped and mixes in new cards so the session always feels like
 *    progress rather than debt. Overdue cards are not lost - they just wait.
 */
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs';

export { Rating, State };

/**
 * Target retention 0.9 is the FSRS default and the right call here: pushing it
 * higher inflates review load, which is the one thing that kills a daily habit.
 */
const params = generatorParameters({
  request_retention: 0.9,
  enable_fuzz: true,
  maximum_interval: 365,
});

const scheduler = fsrs(params);

/** The subset of card columns the scheduler reads and writes. */
export interface SrsState {
  state: number;
  due: number; // unix seconds
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  lastReview: number | null;
}

export function newCardState(now = new Date()): SrsState {
  return toSrs(createEmptyCard(now));
}

function toFsrs(s: SrsState): FsrsCard {
  return {
    due: new Date(s.due * 1000),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsedDays,
    scheduled_days: s.scheduledDays,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state as State,
    last_review: s.lastReview ? new Date(s.lastReview * 1000) : undefined,
  } as FsrsCard;
}

function toSrs(c: FsrsCard): SrsState {
  return {
    state: c.state,
    due: Math.floor(c.due.getTime() / 1000),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsedDays: c.elapsed_days,
    scheduledDays: c.scheduled_days,
    reps: c.reps,
    lapses: c.lapses,
    lastReview: c.last_review ? Math.floor(c.last_review.getTime() / 1000) : null,
  };
}

export function schedule(state: SrsState, rating: Grade, now = new Date()): SrsState {
  const result = scheduler.next(toFsrs(state), now, rating);
  return toSrs(result.card);
}

/** Preview of every possible next interval, for the "next review in..." hints. */
export function previewIntervals(state: SrsState, now = new Date()): Record<Grade, number> {
  const s = scheduler.repeat(toFsrs(state), now);
  return {
    [Rating.Again]: s[Rating.Again].card.scheduled_days,
    [Rating.Hard]: s[Rating.Hard].card.scheduled_days,
    [Rating.Good]: s[Rating.Good].card.scheduled_days,
    [Rating.Easy]: s[Rating.Easy].card.scheduled_days,
  } as Record<Grade, number>;
}

// ---------------------------------------------------------------------------
// Mechanic -> rating
// ---------------------------------------------------------------------------

export type ReviewMode = 'recognise' | 'write' | 'listen' | 'readAloud';

export interface GradeInput {
  mode: ReviewMode;
  correct: boolean;
  /** Time to answer, milliseconds. */
  elapsedMs: number;
  /** 0-1 quality signal where the mechanic produces one (stroke or pronunciation). */
  quality?: number;
  /** Whether the player tapped the hint (gloss / pinyin / stroke replay). */
  usedHint?: boolean;
}

/**
 * How long "fast" is, per mechanic.
 *
 * Recognition should be near-instant - if it takes four seconds the character
 * is being reconstructed, not recognised, and that deserves Hard even when the
 * answer is right. Writing and reading aloud are inherently slower, so their
 * thresholds are much more generous and speed carries less weight.
 */
const FAST_MS: Record<ReviewMode, number> = {
  recognise: 2500,
  listen: 3500,
  write: 12000,
  readAloud: 9000,
};

export function gradeFrom(input: GradeInput): Grade {
  const { mode, correct, elapsedMs, quality, usedHint } = input;

  if (!correct) return Rating.Again;

  // A hint is a partial failure: the answer was not retrievable unaided.
  if (usedHint) return Rating.Hard;

  // Mechanics that emit a quality score (stroke accuracy, pronunciation) let a
  // technically-correct-but-poor attempt be graded down rather than binary.
  if (quality !== undefined) {
    if (quality < 0.6) return Rating.Again;
    if (quality < 0.8) return Rating.Hard;
  }

  const fast = FAST_MS[mode];
  if (elapsedMs <= fast * 0.5 && (quality ?? 1) >= 0.95) return Rating.Easy;
  if (elapsedMs <= fast) return Rating.Good;
  return Rating.Hard;
}

// ---------------------------------------------------------------------------
// Card level (the visible "this card levelled up" moment)
// ---------------------------------------------------------------------------

/**
 * Card level 1-5 from FSRS stability, in days.
 *
 * Stability is the right driver because it is the model's own estimate of how
 * long the memory will hold - which is exactly what "mastery" means. Reps would
 * be the wrong driver: ten reviews of a card you keep forgetting is not mastery.
 */
const LEVEL_THRESHOLDS = [0, 1, 7, 21, 60];

export function cardLevelFromStability(stability: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (stability >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/** A card is "known" for coverage purposes once it can be read on sight. */
export function isKnown(state: SrsState): boolean {
  // Review/Relearning state with any stability means it has been recalled at
  // least once after a gap. New and first-exposure Learning cards do not count -
  // counting them would inflate coverage and hand the player unreadable chapters.
  return (
    (state.state === State.Review || state.state === State.Relearning) &&
    state.stability >= 1
  );
}

// ---------------------------------------------------------------------------
// Queue building
// ---------------------------------------------------------------------------

export interface QueueCandidate {
  id: string;
  value: string;
  due: number;
  state: number;
  stability: number;
  /** Higher = more urgent for reasons outside FSRS (in this week's 课文, etc). */
  boost?: number;
}

export interface QueueOptions {
  now?: number;
  /** Hard cap on the session. */
  limit?: number;
  /** How many brand-new cards to introduce. */
  newLimit?: number;
}

export interface ReviewQueue {
  cards: QueueCandidate[];
  dueTotal: number;
  /** Due cards deliberately held back, so the UI can say "and N more tomorrow". */
  deferred: number;
}

/**
 * Build a session queue.
 *
 * Ordering within the due set is by overdueness (most overdue first) plus any
 * boost, so a character from this week's 课文 jumps the line. New cards are
 * interleaved rather than appended so the session does not end with a wall of
 * unfamiliar material when attention is lowest.
 */
export function pickReviewQueue(
  candidates: QueueCandidate[],
  opts: QueueOptions = {},
): ReviewQueue {
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const limit = opts.limit ?? 40;
  const newLimit = opts.newLimit ?? 8;

  const due = candidates
    .filter((c) => c.state !== State.New && c.due <= now)
    .sort((a, b) => (b.boost ?? 0) - (a.boost ?? 0) || a.due - b.due);

  const fresh = candidates
    .filter((c) => c.state === State.New)
    .sort((a, b) => (b.boost ?? 0) - (a.boost ?? 0));

  const reviewSlots = Math.max(0, limit - Math.min(newLimit, fresh.length));
  const takenDue = due.slice(0, reviewSlots);
  const takenNew = fresh.slice(0, Math.min(newLimit, limit - takenDue.length));

  // Interleave: roughly one new card every `step` reviews.
  const out: QueueCandidate[] = [];
  const step = takenNew.length ? Math.max(1, Math.floor(takenDue.length / takenNew.length)) : 0;
  let n = 0;
  for (let i = 0; i < takenDue.length; i++) {
    out.push(takenDue[i]);
    if (step && (i + 1) % step === 0 && n < takenNew.length) out.push(takenNew[n++]);
  }
  while (n < takenNew.length) out.push(takenNew[n++]);

  return {
    cards: out,
    dueTotal: due.length,
    deferred: Math.max(0, due.length - takenDue.length),
  };
}
