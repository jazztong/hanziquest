/**
 * Chapter selection and the coverage gate.
 *
 * The brief says "verify coverage automatically before a chapter is served".
 * The obvious reading is "refuse chapters that fail" - but refusing is the wrong
 * behaviour for a beginner, because at the start every chapter fails and the
 * player gets an empty campaign. So the gate has three outcomes, not two:
 *
 *   serve      - inside the band, play it now
 *   pre-teach  - a short, bounded set of characters would lift it into the band.
 *                Teach those first (a 识字 drill framed as "gearing up"), then serve.
 *   reject     - out of reach even after the pre-teach budget. Pick another.
 *
 * That turns the gate from a wall into a ramp, while still guaranteeing no
 * chapter is ever *read* below its floor.
 */
import {
  COVERAGE_BANDS,
  splitCoverage,
  verifyCoverage,
  lookupChar,
  type CoverageVerdict,
  type UnknownChar,
} from '../lexicon';
import { chapterText, choiceText, type ChapterScript } from './types';

/** Most characters we will front-load before a chapter. */
export const MAX_PRETEACH = 12;

export interface ChapterCandidate {
  id: string;
  genre: string;
  arc: number;
  seq: number;
  band: number;
  title: string;
  script: ChapterScript;
}

export type GateOutcome =
  | { decision: 'serve'; verdict: CoverageVerdict; warning?: string }
  | { decision: 'pre-teach'; verdict: CoverageVerdict; preTeach: PreTeachItem[] }
  | { decision: 'reject'; verdict: CoverageVerdict; reason: string };

export type PreTeachItem = UnknownChar;

/** Characters of a chapter's declared targets. */
export function targetChars(script: ChapterScript): Set<string> {
  return new Set(
    script.targets.flatMap((t) => [...t.zh].filter((c) => /[一-鿿]/u.test(c))),
  );
}

export function nameChars(script: ChapterScript): Set<string> {
  return new Set(
    (script.properNouns ?? []).flatMap((n) => [...n].filter((c) => /[一-鿿]/u.test(c))),
  );
}

/**
 * Gate one chapter against one learner.
 *
 * The `too-easy` failure is downgraded to a warning here rather than a
 * rejection. A seed chapter sits at a fixed point in a story; refusing to tell
 * chapter one because the player already knows its words would break the
 * narrative to enforce a content-quality rule. Generation still treats
 * `too-easy` as a hard regeneration trigger - see src/lib/ai/story.ts - because
 * there the alternative is simply "write a better chapter".
 */
export function gateChapter(
  script: ChapterScript,
  known: ReadonlySet<string>,
  opts: { maxPreTeach?: number } = {},
): GateOutcome {
  const maxPreTeach = opts.maxPreTeach ?? MAX_PRETEACH;
  const targets = targetChars(script);
  const names = nameChars(script);

  const body = chapterText(script);
  const verdict = verifyCoverage(
    body,
    known,
    'chapter',
    targets,
    names,
    script.targets.length,
  );

  // Reasons that mean "this chapter is badly written", not "this learner is not
  // ready". Pre-teaching cannot fix them and neither can the player.
  if (verdict.failure === 'target-count' || verdict.failure === 'target-share') {
    return { decision: 'reject', verdict, reason: verdict.reason };
  }

  if (!verdict.ok && verdict.failure !== 'too-easy') {
    const needed = charactersToReachBand(body, known, targets, names);
    if (!needed.length) return { decision: 'reject', verdict, reason: verdict.reason };
    if (needed.length > maxPreTeach) {
      return {
        decision: 'reject',
        verdict,
        reason: `needs ${needed.length} characters pre-taught (cap ${maxPreTeach}); out of reach for now`,
      };
    }
    return { decision: 'pre-teach', verdict, preTeach: needed };
  }

  // The chapter body is fine. Decision points are held to a stricter band and
  // checked separately: a chapter can be comfortable overall while its branch
  // points are unreadable, which is exactly the failure that turns a
  // comprehension gate into a coin toss.
  const choices = choiceText(script);
  if (choices) {
    // By the time the player reaches a choice, the chapter's own target words
    // have been met in context, glossed, voiced and carded. So they count as
    // known here. The strict choice band is about *incidental* vocabulary - the
    // words nobody planned for - not about the words the chapter came to teach.
    const knownAtChoice = new Set([...known, ...targets]);
    const cv = verifyCoverage(choices, knownAtChoice, 'choice', new Set(), names, 0);
    if (!cv.ok && cv.failure !== 'too-easy') {
      const needed = charactersToReachBand(choices, knownAtChoice, new Set(), names, 'choice');
      if (needed.length && needed.length <= maxPreTeach) {
        return { decision: 'pre-teach', verdict, preTeach: needed };
      }
      return { decision: 'reject', verdict: cv, reason: `choice text: ${cv.reason}` };
    }
  }

  return {
    decision: 'serve',
    verdict,
    warning: verdict.failure === 'too-easy' ? verdict.reason : undefined,
  };
}

/**
 * The cheapest set of characters to pre-teach so the text enters its band.
 *
 * Greedy is optimal: each character contributes exactly its own token count and
 * they are independent, so biggest-first is the shortest path. Declared targets
 * are never pre-taught away - they are the point of the chapter.
 */
export function charactersToReachBand(
  text: string,
  known: ReadonlySet<string>,
  targets: ReadonlySet<string>,
  names: ReadonlySet<string>,
  kind: 'chapter' | 'choice' | 'passage' = 'chapter',
): PreTeachItem[] {
  const band = COVERAGE_BANDS[kind];
  const split = splitCoverage(text, known, targets, names);
  if (split.tokens === 0) return [];

  const picked: PreTeachItem[] = [];
  let knownTokens = split.knownTokens;
  let incidentalTokens = split.incidentalTokens;

  const queue = [...split.incidental].sort((a, b) => b.count - a.count || a.band - b.band);

  const satisfied = () =>
    incidentalTokens / split.tokens <= band.maxIncidental &&
    knownTokens / split.tokens >= band.min;

  for (const u of queue) {
    if (satisfied()) break;
    picked.push(u);
    knownTokens += u.count;
    incidentalTokens -= u.count;
  }

  // If the floor still is not met, the shortfall is in declared targets, which
  // we will not pre-teach. The chapter is genuinely too hard.
  return satisfied() ? picked : [];
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface SelectionResult {
  chapter: ChapterCandidate;
  outcome: GateOutcome;
}

/**
 * Choose the next chapter for a player.
 *
 * Sequence is respected before comfort: skipping ahead to an easier chapter
 * would break the story, and the story is the reason the player is here. Only
 * if the next chapter in sequence is genuinely out of reach do we look further
 * down the list.
 */
export function selectNextChapter(
  candidates: ChapterCandidate[],
  played: ReadonlySet<string>,
  known: ReadonlySet<string>,
  genre: string,
): SelectionResult | null {
  const pool = candidates
    .filter((c) => c.genre === genre && !played.has(c.id))
    .sort((a, b) => a.arc - b.arc || a.seq - b.seq);

  for (const chapter of pool) {
    const outcome = gateChapter(chapter.script, known);
    if (outcome.decision !== 'reject') return { chapter, outcome };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Gloss fading
// ---------------------------------------------------------------------------

/**
 * How much English support to show.
 *
 * Computed per chapter from the player's coverage of *that* chapter rather than
 * from a global setting, so a harder chapter automatically brings the training
 * wheels back rather than leaving the player stranded.
 */
export type SupportLevel = 'full' | 'pinyin' | 'none';

export function supportLevel(
  script: ChapterScript,
  known: ReadonlySet<string>,
): SupportLevel {
  const split = splitCoverage(
    chapterText(script),
    known,
    targetChars(script),
    nameChars(script),
  );
  if (split.knownShare < script.glossFadeAt) return 'full';
  if (split.knownShare < script.glossFadeAt + 0.03) return 'pinyin';
  return 'none';
}

/** The cards a chapter adds to the deck when it completes. */
export function harvestCards(script: ChapterScript): { chars: string[]; words: string[] } {
  const words = script.targets.map((t) => t.zh).filter((w) => [...w].length > 1);
  const chars = [
    ...new Set(
      script.targets
        .flatMap((t) => [...t.zh])
        .filter((c) => /[一-鿿]/u.test(c) && lookupChar(c)),
    ),
  ];
  return { chars, words };
}
