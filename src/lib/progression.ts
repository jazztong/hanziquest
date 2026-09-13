/**
 * Moving the difficulty band as the player actually gets better.
 *
 * The prologue runs a proper adaptive staircase and writes a band. Nothing
 * raised it afterwards, so the measurement was a one-off: a player could learn
 * five hundred characters and still be served the band the prologue found on
 * their first evening. The staircase existed for the diagnostic and never for
 * the daily loop, which is where nearly all the practice happens.
 *
 * The rules here are deliberately slower than the prologue's. A staircase can
 * move on two answers because its whole purpose is to find a threshold fast and
 * be discarded. This decides what a child is served for the next week, so it
 * asks for a body of evidence and moves one band at a time.
 */

/** Attempts to consider. Short enough to respond within a week of real use. */
export const WINDOW = 24;

/** Below this many graded answers, there is nothing worth concluding. */
export const MIN_EVIDENCE = 16;

/**
 * Comfortably above the staircase's ~70% target.
 *
 * The staircase converges on the band where a learner is right about 70% of the
 * time, because that is where a measurement is most informative. Sitting there
 * permanently is not a good place to *practise*: it means being wrong three
 * times in ten, every day. Promotion waits for the band to become genuinely
 * easy.
 */
export const PROMOTE_AT = 0.85;

/**
 * Demotion is rarer than promotion, and deliberately so.
 *
 * Being served material that is slightly too hard is uncomfortable; being
 * bounced down a band after a bad evening is discouraging, and a child who has
 * just had a bad evening is the last person who needs it. This only triggers on
 * sustained failure, where the alternative is being stuck failing.
 */
export const DEMOTE_AT = 0.45;

export const MIN_BAND = 1;
export const MAX_BAND = 7;

export interface BandDecision {
  band: number;
  moved: 'up' | 'down' | null;
  /** Why, in a form the parent dashboard can show without interpretation. */
  reason: string;
}

/**
 * Decide the band from recent graded answers.
 *
 * `recent` is most-recent-first or not - order does not matter, only the
 * proportion. Pass only *graded* attempts: an ungraded one (a written answer
 * awaiting marking, a skipped listening item) is not evidence either way, and
 * counting it as wrong would quietly drag every player downwards.
 */
export function nextBand(current: number, recent: readonly boolean[]): BandDecision {
  const window = recent.slice(-WINDOW);
  const n = window.length;

  if (n < MIN_EVIDENCE) {
    return { band: current, moved: null, reason: `only ${n} recent answers — not enough yet` };
  }

  const accuracy = window.filter(Boolean).length / n;
  const pct = Math.round(accuracy * 100);

  if (accuracy >= PROMOTE_AT && current < MAX_BAND) {
    return { band: current + 1, moved: 'up', reason: `${pct}% over the last ${n} — moved up` };
  }
  if (accuracy <= DEMOTE_AT && current > MIN_BAND) {
    return { band: current - 1, moved: 'down', reason: `${pct}% over the last ${n} — eased back` };
  }
  return { band: current, moved: null, reason: `${pct}% over the last ${n} — holding` };
}
