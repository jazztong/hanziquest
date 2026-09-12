/**
 * The prologue baseline, and the monthly "rank-up trial" that reuses it.
 *
 * Framed in the UI as the opening chapter of the story, but mechanically it is
 * an adaptive assessment across all eight skills. Two design constraints from
 * the brief shape it:
 *
 *  - about 40 minutes, splittable into two sittings. So state lives in the
 *    database (`baseline_runs`), one row per run, and every answer advances it.
 *    Closing the tab mid-stage loses nothing.
 *  - it has to produce a real profile: per-skill HSK band, % of the 初一 target,
 *    a seeded known-character set, a ranked gap list, and a starting story band.
 *
 * The recognition stage is a proper adaptive staircase (see items/generate.ts).
 * The other stages are short fixed-form blocks: they are measuring things with
 * far less dynamic range than character recognition, and a staircase over six
 * items would mostly measure noise.
 */
import {
  CHARS,
  charsInBand,
  isPolyphonic,
  lookupChar,
  readingsOf,
  WORDS,
} from './lexicon';
import {
  advance,
  charPinyinItem,
  charRecogniseItem,
  estimateBand,
  listenCharItem,
  newProbeState,
  toneDiscriminateItem,
  wordListenItem,
  wordMeaningItem,
  type ProbeState,
} from './items/generate';
import type { Item } from './items/types';
import {
  BASELINE_WRITING_PROMPT,
  HANDWRITE_PROBES,
  LANGUAGE_KNOWLEDGE_ITEMS,
  PASSAGES,
  READ_ALOUD_LINES,
} from '@/content/baseline-items';
import { SKILLS, charsToBand, bandToChars, YEAR1_CHAR_TARGET, type Skill } from './skills';
import { resolveOption } from './items/public';
import { buildReveal, type Reveal } from './items/reveal';
import { markWritingByRule } from './scoring/writing';
import { scoreTranscript } from './scoring/pronunciation';

export type StageId =
  | 'recognition'
  | 'pinyinTone'
  | 'vocabulary'
  | 'languageKnowledge'
  | 'comprehension'
  | 'readAloud'
  | 'handwriting'
  | 'writing';

export interface StageSpec {
  id: StageId;
  skill: Skill;
  /** In-story framing. The player never sees the word "test". */
  titleZh: string;
  titleEn: string;
  blurb: string;
  count: number;
  adaptive: boolean;
  /** Roughly how long, for the "you can stop here" break points. */
  minutes: number;
}

/**
 * The order matters.
 *
 * Recognition goes first because everything else is calibrated off it: once we
 * know roughly which band the learner reads at, every later stage can be served
 * at that band instead of wasting items on material that is obviously too easy
 * or too hard. Writing goes last because it is the most effortful and the least
 * reliable when tired - and because by then the player has had the satisfying
 * parts of the prologue and is invested enough to attempt it.
 */
export const STAGES: StageSpec[] = [
  {
    id: 'recognition',
    skill: 'recognition',
    titleZh: '认字',
    titleEn: 'The Wall of Names',
    blurb: 'Characters are carved into the wall. Say which ones you know.',
    count: 16,
    adaptive: true,
    minutes: 7,
  },
  {
    id: 'pinyinTone',
    skill: 'pinyinTone',
    titleZh: '听声辨调',
    titleEn: 'The Listening Stone',
    blurb: 'The stone speaks. Match what you hear.',
    count: 8,
    adaptive: false,
    minutes: 5,
  },
  {
    id: 'vocabulary',
    skill: 'vocabulary',
    titleZh: '词语',
    titleEn: 'The Word Market',
    blurb: 'Traders shout their goods. Work out what they are selling.',
    count: 8,
    adaptive: false,
    minutes: 5,
  },
  {
    id: 'languageKnowledge',
    skill: 'languageKnowledge',
    titleZh: '语文基础',
    titleEn: 'The Keeper’s Riddles',
    blurb: 'Questions about how the language is built.',
    count: 6,
    adaptive: false,
    minutes: 5,
  },
  {
    id: 'comprehension',
    skill: 'comprehension',
    titleZh: '阅读',
    titleEn: 'Three Letters',
    blurb: 'Three letters, each harder than the last.',
    count: 6,
    adaptive: false,
    minutes: 8,
  },
  {
    id: 'readAloud',
    skill: 'readAloud',
    titleZh: '朗读',
    titleEn: 'Speak the Line',
    blurb: 'Some doors only open to a voice.',
    count: 2,
    adaptive: false,
    minutes: 3,
  },
  {
    id: 'handwriting',
    skill: 'handwriting',
    titleZh: '书写',
    titleEn: 'The Seal',
    blurb: 'Draw the marks, stroke by stroke.',
    count: 4,
    adaptive: false,
    minutes: 4,
  },
  {
    id: 'writing',
    skill: 'writing',
    titleZh: '写作',
    titleEn: 'Your Own Record',
    blurb: 'Every investigator keeps a notebook. Start yours.',
    count: 1,
    adaptive: false,
    minutes: 6,
  },
];

/** Natural break points, so the run really does split into two sittings. */
export const BREAK_AFTER: StageId[] = ['languageKnowledge'];

export interface Response {
  stage: StageId;
  itemId: string;
  /** Option id, transcript, canvas result, or written text. */
  value: string;
  correct: boolean | null;
  /** 0-1 where the mechanic gives partial credit. */
  score: number;
  elapsedMs: number;
  band: number;
  tags: string[];
}

export interface RunState {
  stageIndex: number;
  /** Index within the current stage. */
  itemIndex: number;
  /** Live staircase state for the adaptive stage. */
  probe: ProbeState;
  /** Items already served, so a refresh re-serves the same one. */
  served: Item[];
  responses: Response[];
  /** Characters the learner got right, seeding the known set. */
  knownChars: string[];
}

export function newRun(): RunState {
  return {
    stageIndex: 0,
    itemIndex: 0,
    probe: newProbeState(2),
    served: [],
    responses: [],
    knownChars: [],
  };
}

// ---------------------------------------------------------------------------
// Item production
// ---------------------------------------------------------------------------

function firstNonNull<T>(makers: (() => T | null)[]): T | null {
  for (const m of makers) {
    const v = m();
    if (v) return v;
  }
  return null;
}

function randomOf<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Build the next item for a run. Returns null when the run is complete. */
export function nextItem(state: RunState, estimatedBand = 2): Item | null {
  const stage = STAGES[state.stageIndex];
  if (!stage) return null;
  if (state.itemIndex >= stage.count) return null;

  const band = stage.adaptive ? state.probe.band : Math.max(1, Math.round(estimatedBand));

  switch (stage.id) {
    case 'recognition': {
      const pool = charsInBand(band).filter((c) => !state.knownChars.includes(c.c));
      for (let attempt = 0; attempt < 20; attempt++) {
        const item = charRecogniseItem(randomOf(pool.length ? pool : charsInBand(band)));
        if (item) return item;
      }
      return null;
    }
    case 'pinyinTone': {
      // Alternate reading and tone-pattern items: the first measures whether the
      // learner can attach a sound to a shape, the second whether they can hear
      // a contour at all. Those are different failures with different fixes.
      const useTone = state.itemIndex % 2 === 1;
      for (let attempt = 0; attempt < 25; attempt++) {
        const item = useTone
          ? toneDiscriminateItem(randomOf(WORDS.filter((w) => w.band <= band + 1 && [...w.w].length === 2)))
          : firstNonNull([
              () => charPinyinItem(randomOf(charsInBand(band))),
              () => listenCharItem(randomOf(charsInBand(band))),
            ]);
        if (item) return item;
      }
      return null;
    }
    case 'vocabulary': {
      const pool = WORDS.filter((w) => w.band === band || w.band === band + 1);
      for (let attempt = 0; attempt < 25; attempt++) {
        const w = randomOf(pool.length ? pool : WORDS);
        const item = state.itemIndex % 2 === 0 ? wordMeaningItem(w) : wordListenItem(w);
        if (item) return item;
      }
      return null;
    }
    case 'languageKnowledge': {
      const used = new Set(state.served.map((i) => i.id));
      const pool = LANGUAGE_KNOWLEDGE_ITEMS.filter((i) => !used.has(i.id));
      // Spread across sub-topics rather than serving three 量词 in a row.
      const byBand = pool.filter((i) => Math.abs(i.band - band) <= 2);
      return (byBand.length ? randomOf(byBand) : pool[0]) ?? null;
    }
    case 'comprehension': {
      // Two questions per passage, three passages, easy to hard.
      const passageIdx = Math.floor(state.itemIndex / 2);
      const passage = PASSAGES[Math.min(passageIdx, PASSAGES.length - 1)];
      const q = passage.questions[state.itemIndex % 2];
      if (!q) return null;
      return {
        ...q,
        payload: { ...q.payload, passage: passage.text, passageTitle: passage.title },
      };
    }
    case 'readAloud': {
      const line =
        READ_ALOUD_LINES.find((l) => l.band === Math.min(4, band + state.itemIndex)) ??
        READ_ALOUD_LINES[Math.min(state.itemIndex, READ_ALOUD_LINES.length - 1)];
      return {
        id: `ra-${line.id}`,
        type: 'read-aloud',
        skill: 'readAloud',
        band: line.band,
        year: 1,
        payload: {
          stem: line.zh,
          stemEn: line.en,
          audioText: line.zh,
          hintEn: 'Tap the speaker to hear it first. Then read it aloud.',
        },
        answer: { correct: line.zh },
        source: 'seed',
        tags: ['readaloud'],
      };
    }
    case 'handwriting': {
      const char = HANDWRITE_PROBES[state.itemIndex % HANDWRITE_PROBES.length];
      const entry = lookupChar(char);
      return {
        id: `hw-${char}`,
        type: 'handwrite',
        skill: 'handwriting',
        band: entry?.band ?? 1,
        year: 1,
        payload: {
          stem: char,
          stemEn: `Write ${char}${entry ? ` — ${entry.gloss}` : ''}`,
          writeChar: char,
          hintEn: 'Stroke order matters. Tap the eye to watch it once.',
        },
        answer: { correct: char },
        source: 'seed',
        tags: [`handwrite:${char}`],
      };
    }
    case 'writing': {
      return {
        id: BASELINE_WRITING_PROMPT.id,
        type: 'writing',
        skill: 'writing',
        band,
        year: 1,
        payload: {
          stem: BASELINE_WRITING_PROMPT.promptZh,
          stemEn: BASELINE_WRITING_PROMPT.promptEn,
          minChars: BASELINE_WRITING_PROMPT.minChars,
          hintEn: BASELINE_WRITING_PROMPT.frames.join('  /  '),
        },
        answer: { rubric: 'essay' },
        source: 'seed',
        tags: ['writing:baseline'],
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Marking a single response
// ---------------------------------------------------------------------------

export interface MarkedResponse {
  correct: boolean | null;
  score: number;
  feedbackEn: string;
  feedbackZh?: string;
  detail?: unknown;
  /**
   * The reading, shown the instant an answer is committed.
   *
   * Attention is highest right after answering, and for a learner whose
   * recognition runs ahead of his pronunciation that is the moment 也 → yě is
   * worth most. Null for items where the useful feedback is the explanation.
   */
  reveal?: Reveal | null;
}

export function markResponse(item: Item, value: string): MarkedResponse {
  const reveal = buildReveal(item);

  switch (item.type) {
    case 'read-aloud': {
      const s = scoreTranscript(item.payload.stem, value);
      return {
        reveal,
        correct: s.overall >= 0.6,
        score: s.overall,
        feedbackEn:
          s.toneErrors.length > 0
            ? `Tones to work on: ${s.toneErrors.join(', ')}.`
            : s.overall >= 0.6
              ? 'Clear enough to understand.'
              : 'Some of that did not come through. Try it a bit slower.',
        detail: s,
      };
    }
    case 'handwrite': {
      // The canvas component reports a 0-1 stroke score; see HanziPad.
      const score = Math.max(0, Math.min(1, Number(value) || 0));
      return {
        reveal,
        correct: score >= 0.6,
        score,
        feedbackEn:
          score >= 0.8
            ? 'Strokes in the right order.'
            : score >= 0.6
              ? 'Right shape, but some strokes went out of order.'
              : 'Watch the animation once more and try again.',
      };
    }
    case 'writing': {
      const mark = markWritingByRule(value, { year: 1, kind: 'essay' });
      return {
        reveal,
        correct: null,
        score: mark.total / 100,
        feedbackEn: mark.nextStep,
        detail: mark,
      };
    }
    default: {
      // The client sends a positional id; map it back before comparing.
      const chosen = resolveOption(item, value);
      const key = item.answer.correct;
      const correct = Array.isArray(key) ? key.includes(chosen) : key === chosen;
      return {
        reveal,
        correct,
        score: correct ? 1 : 0,
        feedbackEn: item.answer.explainEn ?? (correct ? 'Correct.' : 'Not this time.'),
        feedbackZh: item.answer.explainZh,
      };
    }
  }
}

/** Apply a marked response to the run state. Pure - returns a new state. */
export function applyResponse(
  state: RunState,
  item: Item,
  value: string,
  marked: MarkedResponse,
  elapsedMs: number,
): RunState {
  const stage = STAGES[state.stageIndex];
  const response: Response = {
    stage: stage.id,
    itemId: item.id,
    value,
    correct: marked.correct,
    score: marked.score,
    elapsedMs,
    band: item.band,
    tags: item.tags,
  };

  const knownChars = [...state.knownChars];
  if (marked.correct && (item.type === 'char-recognise' || item.type === 'listen-char')) {
    // A correct recognition seeds the known set. This is the single most
    // important side effect of the baseline: it is what lets the story engine
    // serve a readable chapter on day one instead of guessing.
    if (!knownChars.includes(item.payload.stem)) knownChars.push(item.payload.stem);
  }

  const probe =
    stage.adaptive && marked.correct !== null
      ? advance(state.probe, marked.correct)
      : state.probe;

  let stageIndex = state.stageIndex;
  let itemIndex = state.itemIndex + 1;
  if (itemIndex >= stage.count) {
    stageIndex += 1;
    itemIndex = 0;
  }

  return {
    stageIndex,
    itemIndex,
    probe,
    // `item` is already at served[responses.length] - ensureItem put it there
    // when it was generated. Appending again would shift every later lookup.
    served: state.served,
    responses: [...state.responses, response],
    knownChars,
  };
}

/**
 * The item currently in front of the player, generating it once and pinning it.
 *
 * This has to be the ONLY way a route obtains an item. Generation draws
 * randomly from the lexicon, so calling nextItem twice produces two different
 * questions - which is exactly the bug this replaces: the start endpoint served
 * one character and the answer endpoint marked a different one.
 *
 * Returns the item plus the state to persist, which the caller must save even
 * when it is only reading, because generating the item IS a state change.
 */
export function ensureItem(state: RunState): { state: RunState; item: Item | null } {
  const at = state.responses.length;
  const existing = state.served[at];
  if (existing) return { state, item: existing };

  const item = nextItem(state, state.probe.band);
  if (!item) return { state, item: null };

  const served = [...state.served];
  served[at] = item;
  return { state: { ...state, served }, item };
}

export function isComplete(state: RunState): boolean {
  return state.stageIndex >= STAGES.length;
}

export function progress(state: RunState): { done: number; total: number; pct: number } {
  const total = STAGES.reduce((s, st) => s + st.count, 0);
  const done = state.responses.length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

// ---------------------------------------------------------------------------
// Finalising: state -> profile
// ---------------------------------------------------------------------------

export interface SkillResult {
  skill: Skill;
  hskLevel: number;
  percentOfTarget: number;
  accuracy: number;
  /** One sentence the player actually reads. */
  summaryEn: string;
}

export interface Gap {
  /** Error-log tag, e.g. "tone:2v3" or "standard:1.6.8-标点". */
  tag: string;
  skill: Skill;
  label: string;
  labelEn: string;
  /** How many times it went wrong in this run. */
  misses: number;
  /** Ranking weight - higher means fix this sooner. */
  priority: number;
}

export interface BaselineResult {
  skills: SkillResult[];
  /** Estimated characters recognised. */
  estimatedChars: number;
  /** Characters confirmed correct during the run - the seeded known set. */
  knownChars: string[];
  gaps: Gap[];
  storyBand: number;
  overallPercent: number;
  minutesTaken: number;
}

const GAP_LABELS: Record<string, { zh: string; en: string }> = {
  'standard:1.6.7-量词': { zh: '量词', en: 'Measure words' },
  'standard:1.6.7-词性': { zh: '词性', en: 'Word classes' },
  'standard:1.6.8-标点': { zh: '标点符号', en: 'Punctuation' },
  'standard:1.6.9-比喻': { zh: '修辞：比喻', en: 'Rhetoric: simile/metaphor' },
  'standard:1.6.9-比拟': { zh: '修辞：比拟', en: 'Rhetoric: personification' },
  'standard:1.6.9-夸张': { zh: '修辞：夸张', en: 'Rhetoric: hyperbole' },
  'standard:1.6.4': { zh: '多音字', en: 'Characters with more than one reading' },
  'standard:1.6.5': { zh: '一词多义', en: 'Words with more than one meaning' },
  'comprehension:中心思想': { zh: '归纳中心思想', en: 'Finding the central idea' },
  'comprehension:写作技巧': { zh: '写作技巧', en: 'Spotting writing technique' },
  'comprehension:说明方法': { zh: '说明方法', en: '说明文 methods' },
  'comprehension:人物描写': { zh: '人物描写', en: 'Reading character through action' },
  'comprehension:提取信息': { zh: '提取信息', en: 'Finding stated information' },
  'comprehension:词句含义': { zh: '词句含义', en: 'Meaning in context' },
  listening: { zh: '听力', en: 'Listening' },
  readaloud: { zh: '朗读', en: 'Reading aloud' },
};

/**
 * Gap priority.
 *
 * Misses alone would rank the gap with the most items served at the top, which
 * is an artefact of the test rather than a fact about the learner. So priority
 * is miss RATE weighted by how much the 统考 cares: 语文基础知识 and 阅读理解
 * are 45% of 试卷二 between them, and a tone problem propagates into everything.
 */
const SKILL_EXAM_WEIGHT: Record<Skill, number> = {
  recognition: 1.0,
  pinyinTone: 0.9,
  vocabulary: 0.8,
  readAloud: 0.5,
  comprehension: 1.0,
  handwriting: 0.4,
  languageKnowledge: 0.9,
  writing: 1.0,
};

export function finalise(state: RunState, elapsedMs: number): BaselineResult {
  const bySkill = new Map<Skill, Response[]>();
  for (const r of state.responses) {
    const stage = STAGES.find((s) => s.id === r.stage)!;
    const arr = bySkill.get(stage.skill) ?? [];
    arr.push(r);
    bySkill.set(stage.skill, arr);
  }

  const recognitionBand = estimateBand(state.probe);

  const skills: SkillResult[] = SKILLS.map((skill) => {
    const rs = bySkill.get(skill) ?? [];
    const scored = rs.filter((r) => r.correct !== null || r.score > 0);
    const accuracy = scored.length
      ? scored.reduce((a, r) => a + r.score, 0) / scored.length
      : 0;

    let hskLevel: number;
    if (skill === 'recognition') {
      hskLevel = recognitionBand;
    } else if (rs.length === 0) {
      hskLevel = 0;
    } else {
      // Band attempted, adjusted by how well they did at it. A learner who got
      // 100% at band 3 is probably above band 3; one who got 40% is below it.
      const meanBand = rs.reduce((a, r) => a + r.band, 0) / rs.length;
      hskLevel = Math.max(0, Math.min(7, meanBand + (accuracy - 0.6) * 2));
    }

    const percentOfTarget =
      skill === 'recognition'
        ? Math.min(100, (bandToChars(hskLevel) / YEAR1_CHAR_TARGET) * 100)
        : Math.min(100, (hskLevel / 4) * 100 * (0.5 + accuracy * 0.5));

    return {
      skill,
      hskLevel: Math.round(hskLevel * 10) / 10,
      percentOfTarget: Math.round(percentOfTarget * 10) / 10,
      accuracy: Math.round(accuracy * 100) / 100,
      summaryEn: summarise(skill, hskLevel, accuracy, rs.length),
    };
  });

  // --- gaps ---------------------------------------------------------------
  const missCounts = new Map<string, { misses: number; total: number; skill: Skill }>();
  for (const r of state.responses) {
    const stage = STAGES.find((s) => s.id === r.stage)!;
    for (const tag of r.tags) {
      if (tag.startsWith('char:') || tag.startsWith('word:') || tag.startsWith('band:')) continue;
      const cur = missCounts.get(tag) ?? { misses: 0, total: 0, skill: stage.skill };
      cur.total += 1;
      if (r.correct === false) cur.misses += 1;
      missCounts.set(tag, cur);
    }
  }

  const gaps: Gap[] = [...missCounts.entries()]
    .filter(([, v]) => v.misses > 0)
    .map(([tag, v]) => {
      const label = GAP_LABELS[tag] ?? { zh: tag, en: tag };
      return {
        tag,
        skill: v.skill,
        label: label.zh,
        labelEn: label.en,
        misses: v.misses,
        priority:
          Math.round((v.misses / v.total) * SKILL_EXAM_WEIGHT[v.skill] * 1000) / 1000,
      };
    })
    .sort((a, b) => b.priority - a.priority || b.misses - a.misses);

  // Tone confusions surfaced by read-aloud are gaps too, and usually the most
  // actionable ones, so they are merged in rather than reported separately.
  const estimatedChars = Math.round(bandToChars(recognitionBand));

  const overallPercent =
    Math.round(
      (skills.reduce((a, s) => a + s.percentOfTarget * SKILL_EXAM_WEIGHT[s.skill], 0) /
        skills.reduce((a, s) => a + SKILL_EXAM_WEIGHT[s.skill], 0)) *
        10,
    ) / 10;

  return {
    skills,
    estimatedChars,
    knownChars: state.knownChars,
    gaps: gaps.slice(0, 12),
    // Story starts one band BELOW measured recognition. Reading for pleasure has
    // to feel easy; the drills are where difficulty lives.
    storyBand: Math.max(1, Math.min(6, Math.round(recognitionBand) - 1 || 1)),
    overallPercent,
    minutesTaken: Math.round(elapsedMs / 60000),
  };
}

function summarise(skill: Skill, band: number, accuracy: number, count: number): string {
  if (count === 0) return 'Not measured in this run.';
  const b = band.toFixed(1);
  switch (skill) {
    case 'recognition':
      return `Reading at about HSK band ${b} — roughly ${bandToChars(band)} characters on sight.`;
    case 'pinyinTone':
      return accuracy >= 0.8
        ? 'Tones are mostly reliable.'
        : accuracy >= 0.5
          ? 'Tones are there but not automatic yet — this is the fastest thing to fix.'
          : 'Tones are the biggest single blocker right now.';
    case 'writing':
      return 'Writing sample recorded. Marked on length and mechanics; add a Claude key for real rubric marking.';
    case 'readAloud':
      return accuracy >= 0.7 ? 'Clear enough to be understood.' : 'Slow and effortful — worth daily practice.';
    case 'handwriting':
      return accuracy >= 0.7 ? 'Stroke order is mostly right.' : 'Stroke order needs work.';
    default:
      return `About HSK band ${b}, ${Math.round(accuracy * 100)}% correct.`;
  }
}

/** Seed the known-character set from the measured band plus confirmed hits. */
export function seedKnownSet(result: BaselineResult): string[] {
  const byBand = CHARS.filter((c) => c.band < Math.floor(result.storyBand + 1)).map((c) => c.c);
  return [...new Set([...byBand, ...result.knownChars])];
}

/** 多音字 among the seeded set, which the polyphone drills will target first. */
export function polyphonesIn(chars: string[]): string[] {
  return chars.filter((c) => isPolyphonic(c) && readingsOf(c).length > 1);
}

export { charsToBand };
