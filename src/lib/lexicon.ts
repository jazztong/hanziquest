/**
 * The lexicon: character and word inventory, pinyin authority, and the
 * known-character coverage maths that gates every chapter served to the player.
 *
 * Everything here is pure and synchronous so it can be unit-tested and called
 * from both server routes and build scripts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pinyin } from 'pinyin-pro';

export interface CharEntry {
  c: string;
  py: string[];
  band: number;
  freq: number;
  radical: string;
  gloss: string;
  /** False when the dictionary offers no usable meaning - see build-glosses.ts. */
  teachable: boolean;
}

export interface WordEntry {
  w: string;
  py: string;
  band: number;
  freq: number;
  pos: string[];
  gloss: string;
}

/**
 * Read from disk rather than `import ... from '.json'`.
 *
 * The lexicon is ~3 MB. A static import would inline it into every bundle that
 * touches this module, including client bundles if one ever imports it by
 * accident. Reading it here keeps it server-side by construction: a client
 * component that imports this file fails to build instead of shipping 3 MB of
 * JSON to a phone.
 */
const data = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data', 'source', 'lexicon.json'), 'utf8'),
) as { chars: CharEntry[]; words: WordEntry[] };

export const CHARS: readonly CharEntry[] = data.chars;
export const WORDS: readonly WordEntry[] = data.words;

const CHAR_INDEX = new Map<string, CharEntry>(data.chars.map((c) => [c.c, c]));
const WORD_INDEX = new Map<string, WordEntry>(data.words.map((w) => [w.w, w]));

/** Matches a CJK ideograph. Punctuation and latin are excluded from coverage. */
export const HANZI_RE = /[一-鿿]/u;

export function isHanzi(ch: string): boolean {
  return HANZI_RE.test(ch);
}

export function lookupChar(c: string): CharEntry | undefined {
  return CHAR_INDEX.get(c);
}

export function lookupWord(w: string): WordEntry | undefined {
  return WORD_INDEX.get(w);
}

/** Every distinct 汉字 in a text, in first-appearance order. */
export function uniqueHanzi(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of text) {
    if (!isHanzi(ch) || seen.has(ch)) continue;
    seen.add(ch);
    out.push(ch);
  }
  return out;
}

/** Total 汉字 tokens (not types) in a text. */
export function hanziTokens(text: string): string[] {
  return [...text].filter(isHanzi);
}

// ---------------------------------------------------------------------------
// 多音字
// ---------------------------------------------------------------------------

/** True when the character has more than one dictionary reading. */
export function isPolyphonic(c: string): boolean {
  const e = CHAR_INDEX.get(c);
  if (e) return e.py.length > 1;
  const readings = pinyin(c, { multiple: true, toneType: 'symbol', type: 'array' }) as string[];
  return new Set(readings).size > 1;
}

/** All dictionary readings for a character, most common first. */
export function readingsOf(c: string): string[] {
  const e = CHAR_INDEX.get(c);
  if (e && e.py.length) return e.py;
  return [...new Set(pinyin(c, { multiple: true, toneType: 'symbol', type: 'array' }) as string[])];
}

/**
 * Longest word in the lexicon starting at `index`, if any.
 *
 * Used for pinyin segmentation. Capped at 6 characters: the longest entries in
 * the HSK list are 4-character 成语, and scanning further only costs time.
 */
const MAX_WORD = 6;

function longestWordAt(text: string, index: number): WordEntry | undefined {
  const chars = [...text];
  for (let len = Math.min(MAX_WORD, chars.length - index); len >= 2; len--) {
    const candidate = chars.slice(index, index + len).join('');
    const entry = WORD_INDEX.get(candidate);
    if (entry) return entry;
  }
  return undefined;
}

/**
 * Segment a text into words using the lexicon, longest match first.
 *
 * Returns one entry per 汉字 (and per non-汉字 character), each carrying the
 * reading that character takes in its word.
 *
 * Why not just call pinyin-pro on the whole string: its own segmenter is wrong
 * often enough to matter. `他在行走` comes back as `tā zài háng zǒu` - 行走 is
 * xíngzǒu - even though pinyin-pro gets the isolated word `行走` right. Since
 * 19% of the HSK character set is 多音字 and the reader is a beginner who
 * cannot spot the error, a wrong reading is worse than no reading. Matching
 * against our own 9,443-word list first, and only falling back to pinyin-pro
 * for characters no word covers, removes that whole class of mistake.
 */
export function segmentReadings(text: string): { char: string; reading: string; word?: string }[] {
  const chars = [...text];
  const out: { char: string; reading: string; word?: string }[] = [];
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];
    if (!isHanzi(ch)) {
      out.push({ char: ch, reading: '' });
      i += 1;
      continue;
    }

    const word = longestWordAt(text, i);
    if (word) {
      const syllables = word.py.trim().split(/\s+/);
      const wordChars = [...word.w];
      for (let k = 0; k < wordChars.length; k++) {
        out.push({ char: wordChars[k], reading: syllables[k] ?? '', word: word.w });
      }
      i += wordChars.length;
      continue;
    }

    // No word covers it: fall back to pinyin-pro on the character, using the
    // dominant reading. Flagged as ambiguous by isPolyphonic elsewhere.
    const single = pinyin(ch, { toneType: 'symbol', type: 'array' }) as string[];
    out.push({ char: ch, reading: single[0] ?? '' });
    i += 1;
  }
  return out;
}

/**
 * The reading a character actually takes inside a given phrase.
 *
 * This is the only correct way to pinyin a 多音字: 行 in 银行 is `háng`, in 行走
 * it is `xíng`. Asking for the character in isolation would always return the
 * dominant reading and would be wrong roughly a fifth of the time.
 *
 * `index` is a character offset into `context` (the value a UI gets from
 * iterating the string), not a byte offset.
 */
export function readingInContext(context: string, index: number): string {
  return segmentReadings(context)[index]?.reading ?? '';
}

/**
 * Validates a proposed pinyin against the dictionary.
 *
 * Used to check AI-generated content before it is ever shown. A 多音字 passes if
 * the proposal matches ANY dictionary reading, but the caller is told that the
 * character is ambiguous so it can require sentence context.
 */
export function validatePinyin(
  char: string,
  proposed: string,
): { ok: boolean; ambiguous: boolean; readings: string[] } {
  const readings = readingsOf(char);
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');
  const ok = readings.some((r) => norm(r) === norm(proposed));
  return { ok, ambiguous: readings.length > 1, readings };
}

/**
 * Pinyin for a whole run of text, resolved word by word against the lexicon.
 *
 * Punctuation is dropped rather than transliterated, so the result lines up
 * syllable-for-character with the 汉字 in the input - which is what the karaoke
 * highlighter and the relic line display both need.
 *
 * `overrides` exists for classical readings the modern dictionary cannot know.
 * 见 in 风吹草低见牛羊 is xiàn, not jiàn - it is 通假 for 现 - and no amount of
 * word-level lookup will find that, because 见牛羊 is not a word. The poems
 * declare these in their `polyphonic` field, and this is where that declaration
 * is applied. Without it the app renders a wrong reading on the single most
 * commonly-failed character of the 默写 list.
 */
export function pinyinOf(text: string, overrides: Record<string, string> = {}): string {
  return segmentReadings(text)
    .filter((s) => s.reading)
    .map((s) => overrides[s.char] ?? s.reading)
    .join(' ');
}

/** The tone number (1-4, 5 = neutral) of a single pinyin syllable. */
export function toneOf(syllable: string): number {
  const num = pinyin(syllable, { toneType: 'num', type: 'array' }) as string[];
  const m = num[0]?.match(/([1-5])$/);
  return m ? Number(m[1]) : 5;
}

// ---------------------------------------------------------------------------
// Coverage
// ---------------------------------------------------------------------------

export interface UnknownChar {
  c: string;
  count: number;
  band: number;
  gloss: string;
}

export interface CoverageReport {
  /** Distinct 汉字 in the text. */
  types: number;
  /** Total 汉字 occurrences. */
  tokens: number;
  /** Share of TOKENS that the learner already knows. 0-1. */
  tokenCoverage: number;
  /** Share of TYPES that the learner already knows. 0-1. */
  typeCoverage: number;
  /** Unknown characters, most frequent-in-this-text first. */
  unknown: UnknownChar[];
}

/**
 * Known-character coverage of a text.
 *
 * Coverage is measured over characters rather than words on purpose. Character
 * recognition is the binding constraint for an English-dominant learner: a
 * reader who knows 银 and 行 can usually infer 银行 from context and audio, but a
 * reader who cannot decode 银 is stopped dead. The research band (docs/research.md
 * section 5.1) is therefore expressed in characters too.
 *
 * Token coverage is the number that matters for comprehension - one unknown
 * character repeated ten times costs the reader far less than ten different ones.
 */
export function coverage(text: string, known: ReadonlySet<string>): CoverageReport {
  const tokens = hanziTokens(text);
  const counts = new Map<string, number>();
  for (const ch of tokens) counts.set(ch, (counts.get(ch) ?? 0) + 1);

  let knownTokens = 0;
  let knownTypes = 0;
  const unknown: CoverageReport['unknown'] = [];

  for (const [ch, count] of counts) {
    if (known.has(ch)) {
      knownTokens += count;
      knownTypes += 1;
    } else {
      const e = CHAR_INDEX.get(ch);
      unknown.push({ c: ch, count, band: e?.band ?? 9, gloss: e?.gloss ?? '' });
    }
  }
  unknown.sort((a, b) => b.count - a.count || a.band - b.band);

  return {
    types: counts.size,
    tokens: tokens.length,
    tokenCoverage: tokens.length === 0 ? 1 : knownTokens / tokens.length,
    typeCoverage: counts.size === 0 ? 1 : knownTypes / counts.size,
    unknown,
  };
}

// ---------------------------------------------------------------------------
// Coverage bands (docs/research.md section 5.1)
// ---------------------------------------------------------------------------

export type ContentKind = 'chapter' | 'choice' | 'passage';

export interface CoverageBand {
  /** Floor/ceiling on the share of tokens the learner ALREADY knows. */
  min: number;
  max: number;
  target: number;
  /** Max declared teaching targets (words, not characters). */
  maxTargets: number;
  /** Max share of tokens taken up by declared targets. */
  maxTargetShare: number;
  /**
   * Max share of tokens that are unknown AND undeclared. These are the ones
   * that actually break a reader, because nothing in the UI is prepared to
   * help with them.
   */
  maxIncidental: number;
}

/**
 * Why each band is what it is.
 *
 * The important design decision is that coverage is a THREE-way split, not a
 * two-way one. Every 汉字 in a piece of content is:
 *
 *   known       - the learner reads it on sight
 *   target      - deliberately new: it has a card, a gloss, audio, and it is
 *                 introduced in context before it is needed
 *   incidental  - unknown and undeclared: nobody planned for it, nothing helps
 *
 * Treating targets as "unknown" (the naive two-way split) makes the brief's own
 * numbers impossible: 5-10 new words inside a 250-character chapter is already
 * 5% of the text, so a 95% floor would reject every chapter that teaches
 * anything. Treating them as "known" would make the number meaningless.
 * Counting them separately is what makes both constraints hold at once.
 *
 * - `chapter` known 0.90-0.97, targets <= 10 words and <= 8% of tokens,
 *   incidental <= 2%. Narrative prose, fully voiced and tap-glossed. The
 *   literature puts unassisted narrative comprehension at 98% coverage
 *   (docs/research.md 5.1); audio + gloss + illustration buys the difference.
 *   The 0.97 ceiling stops a chapter being so familiar it teaches nothing - but
 *   see gateChapter, which downgrades that to a warning for authored chapters
 *   rather than refusing to tell the story.
 * - `choice` known >= 0.97, no targets, no incidental. A branch point must turn
 *   on comprehension; if the player cannot read the option, the branch measures
 *   luck rather than understanding.
 * - `passage` known >= 0.93, up to 6 targets. 阅读理解 deliberately sits
 *   slightly above comfort, which is what the real exam does.
 */
export const COVERAGE_BANDS: Record<ContentKind, CoverageBand> = {
  chapter: {
    min: 0.9,
    max: 0.97,
    target: 0.94,
    maxTargets: 10,
    maxTargetShare: 0.08,
    maxIncidental: 0.02,
  },
  choice: {
    min: 0.97,
    max: 1.0,
    target: 0.99,
    maxTargets: 0,
    maxTargetShare: 0,
    maxIncidental: 0.0,
  },
  passage: {
    min: 0.93,
    max: 1.0,
    target: 0.96,
    maxTargets: 6,
    maxTargetShare: 0.05,
    maxIncidental: 0.02,
  },
};

export interface CoverageSplit {
  tokens: number;
  knownTokens: number;
  targetTokens: number;
  incidentalTokens: number;
  /** Proper-noun tokens, excluded from the denominator entirely. */
  nameTokens: number;
  knownShare: number;
  targetShare: number;
  incidentalShare: number;
  targetTypes: string[];
  incidental: UnknownChar[];
}

/**
 * Split a text three ways against one learner.
 *
 * `names` are proper-noun characters (a character's name, a place). They are
 * removed from the denominator rather than counted as unknown: 林阿姨 is three
 * band-4 characters, and charging a chapter 12% of its coverage budget for
 * naming its own cast is nonsense. Names are taught once, permanently glossed
 * in the cast list, and never asked about.
 */
export function splitCoverage(
  text: string,
  known: ReadonlySet<string>,
  targets: ReadonlySet<string> = new Set(),
  names: ReadonlySet<string> = new Set(),
): CoverageSplit {
  const counts = new Map<string, number>();
  let nameTokens = 0;
  for (const ch of hanziTokens(text)) {
    if (names.has(ch)) {
      nameTokens++;
      continue;
    }
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
  }

  let knownTokens = 0;
  let targetTokens = 0;
  let incidentalTokens = 0;
  const targetTypes: string[] = [];
  const incidental: UnknownChar[] = [];

  for (const [ch, count] of counts) {
    if (known.has(ch)) {
      knownTokens += count;
    } else if (targets.has(ch)) {
      targetTokens += count;
      targetTypes.push(ch);
    } else {
      incidentalTokens += count;
      const e = CHAR_INDEX.get(ch);
      incidental.push({ c: ch, count, band: e?.band ?? 9, gloss: e?.gloss ?? '' });
    }
  }
  incidental.sort((a, b) => b.count - a.count || a.band - b.band);

  const tokens = knownTokens + targetTokens + incidentalTokens;
  const share = (n: number) => (tokens === 0 ? (n === 0 ? 1 : 0) : n / tokens);

  return {
    tokens,
    knownTokens,
    targetTokens,
    incidentalTokens,
    nameTokens,
    knownShare: tokens === 0 ? 1 : knownTokens / tokens,
    targetShare: share(targetTokens),
    incidentalShare: share(incidentalTokens),
    targetTypes,
    incidental,
  };
}

export type CoverageFailure =
  | 'incidental'
  | 'too-hard'
  | 'too-easy'
  | 'target-count'
  | 'target-share';

export interface CoverageVerdict {
  ok: boolean;
  kind: ContentKind;
  split: CoverageSplit;
  band: CoverageBand;
  /** Which rule failed, so callers can react differently per rule. */
  failure?: CoverageFailure;
  /** Human-readable, for the parent dashboard and generation retries. */
  reason: string;
  /** Characters generation should be told to remove, or that need pre-teaching. */
  offenders: string[];
}

/**
 * The gate. No chapter, choice or passage is read below its floor.
 *
 * Rules are checked in order of how badly they break the reader:
 * incidental unknowns first (fatal), then too-hard, then target budget, then
 * too-easy (which is a content-quality problem, not a reading problem).
 */
export function verifyCoverage(
  text: string,
  known: ReadonlySet<string>,
  kind: ContentKind,
  targets: ReadonlySet<string> = new Set(),
  names: ReadonlySet<string> = new Set(),
  targetWordCount = 0,
): CoverageVerdict {
  const band = COVERAGE_BANDS[kind];
  const split = splitCoverage(text, known, targets, names);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const base = { kind, split, band } as const;

  if (split.incidentalShare > band.maxIncidental) {
    return {
      ...base,
      ok: false,
      failure: 'incidental',
      reason: `${pct(split.incidentalShare)} of tokens are unknown and undeclared (cap ${pct(band.maxIncidental)}): ${split.incidental.map((i) => i.c).join('')}`,
      offenders: split.incidental.map((i) => i.c),
    };
  }
  if (split.knownShare < band.min) {
    return {
      ...base,
      ok: false,
      failure: 'too-hard',
      reason: `known-character share ${pct(split.knownShare)} is below the ${pct(band.min)} floor for ${kind}`,
      offenders: [...split.incidental.map((i) => i.c), ...split.targetTypes],
    };
  }
  if (targetWordCount > band.maxTargets) {
    return {
      ...base,
      ok: false,
      failure: 'target-count',
      reason: `teaches ${targetWordCount} target words, budget is ${band.maxTargets}`,
      offenders: split.targetTypes,
    };
  }
  if (split.targetShare > band.maxTargetShare) {
    return {
      ...base,
      ok: false,
      failure: 'target-share',
      reason: `target words take up ${pct(split.targetShare)} of the text, cap is ${pct(band.maxTargetShare)} - either cut targets or lengthen the prose`,
      offenders: split.targetTypes,
    };
  }
  if (split.knownShare > band.max) {
    return {
      ...base,
      ok: false,
      failure: 'too-easy',
      reason: `known-character share ${pct(split.knownShare)} is above the ${pct(band.max)} ceiling - little here is new`,
      offenders: [],
    };
  }
  return {
    ...base,
    ok: true,
    reason: `known ${pct(split.knownShare)}, targets ${pct(split.targetShare)}, incidental ${pct(split.incidentalShare)}`,
    offenders: [],
  };
}

// ---------------------------------------------------------------------------
// Frequency bands -> card rarity
// ---------------------------------------------------------------------------

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * Rarity tracks HSK band, not raw corpus frequency.
 *
 * Using the band keeps rarity stable and legible: every HSK 1 character is
 * always "common", so a set is never half-upgraded by a corpus refresh. It also
 * means the rare cards are genuinely the ones worth showing off - a 初三-level
 * character is a real achievement for this learner.
 */
export function rarityOf(c: string): Rarity {
  const band = CHAR_INDEX.get(c)?.band ?? 7;
  if (band <= 1) return 'common';
  if (band <= 2) return 'uncommon';
  if (band <= 4) return 'rare';
  if (band <= 6) return 'epic';
  return 'legendary';
}

/** Characters in a band, most frequent first - used to build adaptive probes. */
export function charsInBand(band: number): CharEntry[] {
  return data.chars.filter((c) => c.band === band);
}

/** Words that are made only of characters the learner already knows. */
export function wordsWithin(known: ReadonlySet<string>, band: number): WordEntry[] {
  return data.words.filter(
    (w) => w.band <= band && [...w.w].every((ch) => !isHanzi(ch) || known.has(ch)),
  );
}
