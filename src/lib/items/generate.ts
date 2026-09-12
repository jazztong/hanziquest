/**
 * Item generation from the dictionary.
 *
 * Everything in here is built from the vendored HSK lexicon and pinyin-pro, not
 * from an LLM. That is a correctness decision, not a cost decision: the brief
 * says "validate pinyin and tones against the dictionary, not LLM output", and
 * the surest way to honour that is to never let an LLM near the items where
 * pinyin is the answer.
 *
 * Distractors are the part that is easy to get wrong. A multiple-choice item is
 * only as good as its wrong answers: if they are random, the item measures
 * elimination rather than knowledge. So distractors are drawn from the same
 * band as the key and, for pinyin items, share the key's initial or final so
 * the learner has to actually hear the difference.
 */
import {
  CHARS,
  WORDS,
  charsInBand,
  isPolyphonic,
  lookupChar,
  readingsOf,
  toneOf,
  type CharEntry,
  type WordEntry,
} from '../lexicon';
import { pinyin } from 'pinyin-pro';
import type { Item, Option } from './types';

let counter = 0;
function id(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function shuffle<T>(arr: T[], rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: readonly T[], n: number): T[] {
  return shuffle([...arr]).slice(0, n);
}

const glossOf = (e: CharEntry | WordEntry) => (e.gloss || '').split(';')[0].trim();

// ---------------------------------------------------------------------------
// Character recognition
// ---------------------------------------------------------------------------

/** Senses of a character, for checking that a distractor is not also correct. */
function sensesOf(entry: CharEntry): string[] {
  return (entry.gloss ?? '')
    .split(/[;,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Three distractors whose glosses are distinct from each other.
 *
 * Picking three distinct *characters* is not enough: two different characters
 * can carry the same English gloss, and an item that offers "dialect" twice has
 * a choice that cannot be made. This was intermittent - roughly one item in a
 * thousand - so it survived every single-pass test run.
 *
 * Greedy over a shuffled pool rather than de-duplicating the pool up front:
 * each candidate is compared against at most three accepted glosses, instead of
 * every band-mate against every other.
 */
function pickDistinctDistractors(pool: CharEntry[], n: number): CharEntry[] {
  const chosen: CharEntry[] = [];
  for (const c of shuffle(pool)) {
    if (chosen.length === n) break;
    const g = glossOf(c);
    if (chosen.some((x) => meansTheSame(glossOf(x), g))) continue;
    chosen.push(c);
  }
  return chosen;
}

/** Close enough that a learner could not tell them apart. */
function meansTheSame(a: string, b: string): boolean {
  const norm = (x: string) =>
    x.toLowerCase().replace(/^to\s+/, '').replace(/^\(.*?\)\s*/, '').replace(/[^a-z\s]/g, '').trim();
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return x.length > 3 && y.length > 3 && (x.includes(y) || y.includes(x));
}

/**
 * See a character, pick its English meaning.
 *
 * Two correctness rules, both added after scripts/audit-recognition.ts found
 * real wrong items:
 *
 *  - Characters with no teachable meaning are skipped. A question keyed on
 *    "variant of 从" has no answer a learner can reason to.
 *  - A distractor is rejected if it is ALSO a sense of the target character.
 *    Otherwise the item has two right answers and marks a correct one wrong -
 *    the only failure here that actively teaches something false.
 *
 * Distractors otherwise come from the same band, so the item tests recognition
 * of THIS character rather than "which of these looks like a beginner word".
 */
export function charRecogniseItem(entry: CharEntry): Item | null {
  if (!entry.teachable) return null;
  const key = glossOf(entry);
  if (!key) return null;

  const targetSenses = sensesOf(entry);
  const pool = charsInBand(entry.band).filter((c) => {
    if (c.c === entry.c || !c.teachable) return false;
    const g = glossOf(c);
    if (!g || g === key) return false;
    // Reject any distractor that is also a meaning of the target.
    return !targetSenses.some((s) => meansTheSame(s, g));
  });
  if (pool.length < 3) return null;

  const distractors = pickDistinctDistractors(pool, 3);
  // A band with fewer than three distinguishable meanings cannot make an item.
  if (distractors.length < 3) return null;
  const options: Option[] = shuffle([
    { id: 'k', en: key, zh: entry.c },
    ...distractors.map((d, i) => ({ id: `d${i}`, en: glossOf(d), zh: d.c })),
  ]);

  return {
    id: id('chr'),
    type: 'char-recognise',
    skill: 'recognition',
    band: entry.band,
    year: 1,
    payload: {
      stem: entry.c,
      stemEn: 'What does this character mean?',
      options: options.map((o) => ({ id: o.id, en: o.en })),
    },
    answer: {
      correct: 'k',
      explainEn: `${entry.c} (${readingsOf(entry.c)[0] ?? ''}) — ${entry.gloss}`,
    },
    source: 'seed',
    tags: [`char:${entry.c}`, `band:${entry.band}`],
  };
}

/**
 * See a character, pick its reading.
 *
 * 多音字 are excluded: a character with two correct readings has no single
 * correct answer out of context, and asking anyway teaches the wrong thing.
 * They get their own item type (`polyphoneItem`) with a sentence around them.
 */
export function charPinyinItem(entry: CharEntry): Item | null {
  if (isPolyphonic(entry.c)) return null;
  const key = entry.py[0];
  if (!key) return null;

  const base = pinyin(entry.c, { toneType: 'none' });
  const keyTone = toneOf(entry.c);

  // Two distractors that differ only in tone, one that differs in segment.
  // Tone confusions are this learner's actual failure mode, so most of the
  // choice set has to sit on that axis or the item is trivially easy.
  const toneVariants = [1, 2, 3, 4]
    .filter((t) => t !== keyTone)
    .map((t) => addTone(base, t))
    .filter(Boolean) as string[];

  const segmental = CHARS.filter(
    (c) =>
      c.band <= entry.band + 1 &&
      c.py[0] &&
      pinyin(c.c, { toneType: 'none' }) !== base &&
      pinyin(c.c, { toneType: 'none' }).length === base.length,
  );
  const seg = pick(segmental, 1)[0];
  if (!seg || toneVariants.length < 2) return null;

  const options = shuffle([
    { id: 'k', pinyin: key },
    { id: 'd0', pinyin: toneVariants[0] },
    { id: 'd1', pinyin: toneVariants[1] },
    { id: 'd2', pinyin: seg.py[0] },
  ]);

  return {
    id: id('cpy'),
    type: 'char-pinyin',
    skill: 'pinyinTone',
    band: entry.band,
    year: 1,
    standardRef: '1.6.2',
    payload: {
      stem: entry.c,
      stemEn: 'How is this character read?',
      audioText: entry.c,
      options,
    },
    answer: { correct: 'k', explainEn: `${entry.c} is ${key} — ${entry.gloss}` },
    source: 'seed',
    tags: [`char:${entry.c}`, `tone:${keyTone}`],
  };
}

const TONE_MARKS: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
};

/** Place a tone mark using the standard rule (a/o/e first, else last vowel). */
function addTone(base: string, tone: number): string | null {
  if (tone < 1 || tone > 4) return base;
  const order = ['a', 'o', 'e'];
  let idx = -1;
  for (const v of order) {
    idx = base.indexOf(v);
    if (idx !== -1) break;
  }
  if (idx === -1) {
    for (let i = base.length - 1; i >= 0; i--) {
      if ('iuü'.includes(base[i])) {
        idx = i;
        break;
      }
    }
  }
  if (idx === -1) return null;
  const marks = TONE_MARKS[base[idx]];
  if (!marks) return null;
  return base.slice(0, idx) + marks[tone - 1] + base.slice(idx + 1);
}

/** Hear a syllable, pick the character. */
export function listenCharItem(entry: CharEntry): Item | null {
  if (isPolyphonic(entry.c) || !entry.teachable) return null;
  const base = pinyin(entry.c, { toneType: 'none' });
  const homophones = CHARS.filter(
    (c) => c.c !== entry.c && c.band <= entry.band + 1 && pinyin(c.c, { toneType: 'none' }) === base,
  );
  const others = charsInBand(entry.band).filter((c) => c.c !== entry.c);
  const distractors = [...pick(homophones, 2), ...pick(others, 3)].slice(0, 3);
  if (distractors.length < 3) return null;

  const options = shuffle([
    { id: 'k', zh: entry.c },
    ...distractors.map((d, i) => ({ id: `d${i}`, zh: d.c })),
  ]);

  return {
    id: id('lch'),
    type: 'listen-char',
    skill: 'recognition',
    band: entry.band,
    year: 1,
    payload: {
      stem: '听一听，选出你听到的字。',
      stemEn: 'Listen, then choose the character you heard.',
      audioText: entry.c,
      options,
    },
    answer: { correct: 'k', explainEn: `${entry.c} — ${entry.py[0]} — ${entry.gloss}` },
    source: 'seed',
    tags: [`char:${entry.c}`, 'listening'],
  };
}

/**
 * Tone discrimination: hear a two-syllable word, pick its tone pattern.
 *
 * Patterns rather than characters, because the skill being measured is hearing
 * the contour - and a pattern question cannot be answered by recognising the
 * word, which is what makes it a clean measure of tone perception.
 */
export function toneDiscriminateItem(word: WordEntry): Item | null {
  const chars = [...word.w];
  if (chars.length !== 2) return null;
  const tones = chars.map((c) => toneOf(c));
  if (tones.some((t) => t === 0)) return null;

  const key = tones.join('-');
  const all: string[] = [];
  for (let a = 1; a <= 4; a++) for (let b = 1; b <= 4; b++) all.push(`${a}-${b}`);
  const distractors = pick(
    all.filter((p) => p !== key),
    3,
  );

  const label = (p: string) => p.split('-').map((t) => `第${t}声`).join(' + ');

  return {
    id: id('tone'),
    type: 'tone-discriminate',
    skill: 'pinyinTone',
    band: word.band,
    year: 1,
    standardRef: '1.6.2',
    payload: {
      stem: '这个词的声调是什么？',
      stemEn: 'What is the tone pattern of this word?',
      audioText: word.w,
      options: shuffle([
        { id: 'k', zh: label(key), en: key },
        ...distractors.map((d, i) => ({ id: `d${i}`, zh: label(d), en: d })),
      ]),
    },
    answer: {
      correct: 'k',
      explainEn: `${word.w} is ${word.py} — ${label(key)}.`,
    },
    source: 'seed',
    tags: [`tonepattern:${key}`, `word:${word.w}`],
  };
}

/** See a word, pick its meaning. */
export function wordMeaningItem(word: WordEntry): Item | null {
  const key = glossOf(word);
  if (!key) return null;
  const pool = WORDS.filter(
    (w) => w.band === word.band && w.w !== word.w && glossOf(w) && glossOf(w) !== key,
  );
  if (pool.length < 3) return null;
  const options = shuffle([
    { id: 'k', en: key },
    ...pick(pool, 3).map((d, i) => ({ id: `d${i}`, en: glossOf(d) })),
  ]);
  return {
    id: id('wm'),
    type: 'word-meaning',
    skill: 'vocabulary',
    band: word.band,
    year: 1,
    payload: { stem: word.w, stemEn: 'What does this word mean?', options },
    answer: { correct: 'k', explainEn: `${word.w} (${word.py}) — ${word.gloss}` },
    source: 'seed',
    tags: [`word:${word.w}`, `band:${word.band}`],
  };
}

/** Hear a word, pick it in writing. */
export function wordListenItem(word: WordEntry): Item | null {
  const pool = WORDS.filter((w) => w.band === word.band && w.w !== word.w && [...w.w].length === [...word.w].length);
  if (pool.length < 3) return null;
  const options = shuffle([
    { id: 'k', zh: word.w },
    ...pick(pool, 3).map((d, i) => ({ id: `d${i}`, zh: d.w })),
  ]);
  return {
    id: id('wl'),
    type: 'word-listen',
    skill: 'vocabulary',
    band: word.band,
    year: 1,
    payload: {
      stem: '听一听，选出你听到的词。',
      stemEn: 'Listen, then choose the word you heard.',
      audioText: word.w,
      options,
    },
    answer: { correct: 'k', explainEn: `${word.w} — ${word.py} — ${word.gloss}` },
    source: 'seed',
    tags: [`word:${word.w}`, 'listening'],
  };
}

/**
 * 多音字 in context.
 *
 * The whole point is that the character alone has no answer: the sentence
 * decides. 课程标准 1.6.4 names this explicitly for 初一, and it is a reliable
 * source of lost marks, so it gets its own generator rather than being folded
 * into pinyin items.
 */
export function polyphoneItem(
  char: string,
  contexts: { sentence: string; index: number }[],
): Item | null {
  if (!isPolyphonic(char) || contexts.length === 0) return null;
  const readings = readingsOf(char);
  if (readings.length < 2) return null;

  const ctx = contexts[0];
  const syllables = pinyin(ctx.sentence, { toneType: 'symbol', type: 'array' }) as string[];
  const correct = syllables[ctx.index];
  if (!correct) return null;

  const options = shuffle([
    { id: 'k', pinyin: correct },
    ...readings
      .filter((r) => r !== correct)
      .slice(0, 3)
      .map((r, i) => ({ id: `d${i}`, pinyin: r })),
  ]);
  if (options.length < 2) return null;

  const marked =
    ctx.sentence.slice(0, ctx.index) + `【${char}】` + ctx.sentence.slice(ctx.index + 1);

  return {
    id: id('poly'),
    type: 'polyphone',
    skill: 'languageKnowledge',
    band: lookupChar(char)?.band ?? 3,
    year: 1,
    standardRef: '1.6.4',
    payload: {
      stem: marked,
      stemEn: `In this sentence, how is 【${char}】 read?`,
      audioText: ctx.sentence,
      options,
      hintEn: `${char} has ${readings.length} readings: ${readings.join(' / ')}. The sentence decides which.`,
    },
    answer: {
      correct: 'k',
      explainEn: `Here 【${char}】 is ${correct}. Its other readings (${readings.filter((r) => r !== correct).join(', ')}) belong to different words.`,
      explainZh: `“${char}”是多音字，在本句中读 ${correct}。`,
    },
    source: 'seed',
    tags: [`polyphone:${char}`, 'standard:1.6.4'],
  };
}

// ---------------------------------------------------------------------------
// Adaptive probe sequencing
// ---------------------------------------------------------------------------

export interface ProbeState {
  band: number;
  asked: number;
  correct: number;
  /** Consecutive results at the current band, for the staircase. */
  streak: number;
  history: { band: number; correct: boolean }[];
}

export function newProbeState(startBand = 2): ProbeState {
  return { band: startBand, asked: 0, correct: 0, streak: 0, history: [] };
}

/**
 * A 2-down-1-up staircase.
 *
 * Two correct in a row moves up a band; one wrong moves down. That converges on
 * roughly the 70% -correct point, which is where a proficiency estimate is most
 * informative, and it gets there in far fewer items than a fixed-form test -
 * which matters when the whole baseline has to fit in 40 minutes across eight
 * skills.
 */
export function advance(state: ProbeState, correct: boolean): ProbeState {
  const history = [...state.history, { band: state.band, correct }];
  let band = state.band;
  let streak = correct ? state.streak + 1 : 0;

  if (correct && streak >= 2) {
    band = Math.min(7, band + 1);
    streak = 0;
  } else if (!correct) {
    band = Math.max(1, band - 1);
    streak = 0;
  }

  return {
    band,
    asked: state.asked + 1,
    correct: state.correct + (correct ? 1 : 0),
    streak,
    history,
  };
}

/**
 * Estimate the learner's band from the staircase history.
 *
 * The reversal-average is the standard readout for an adaptive staircase: take
 * the bands at which the direction changed and average them. It is far more
 * stable than "the band you finished at", which is hostage to the last answer.
 */
export function estimateBand(state: ProbeState): number {
  const h = state.history;
  if (h.length === 0) return 0;

  const reversals: number[] = [];
  for (let i = 1; i < h.length; i++) {
    if (h[i].correct !== h[i - 1].correct) reversals.push(h[i - 1].band);
  }
  if (reversals.length >= 2) {
    const useful = reversals.slice(-6);
    return useful.reduce((a, b) => a + b, 0) / useful.length;
  }

  // Too few reversals to average: fall back to accuracy-weighted mean band.
  const accuracy = state.correct / Math.max(1, state.asked);
  const meanBand = h.reduce((a, b) => a + b.band, 0) / h.length;
  return Math.max(0, meanBand + (accuracy - 0.5) * 2);
}

/** Build a pool of recognition probes spread across bands. */
export function recognitionProbePool(): Map<number, Item[]> {
  const byBand = new Map<number, Item[]>();
  for (let band = 1; band <= 7; band++) {
    const entries = pick(charsInBand(band), 40);
    const items = entries
      .map((e) => charRecogniseItem(e))
      .filter((i): i is Item => i !== null);
    byBand.set(band, items);
  }
  return byBand;
}
