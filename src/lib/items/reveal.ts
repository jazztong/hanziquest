/**
 * The "here is what it actually says" card shown after an answer.
 *
 * Built server-side because it needs the lexicon, and the lexicon is 3 MB and
 * stays on the server. The client only ever receives the finished reveal.
 *
 * Why it exists: the reading is the single most useful thing to show at the
 * moment of feedback. Attention is highest right after committing to an answer,
 * and for a learner whose recognition runs ahead of his pronunciation, seeing
 * 也 → yě at that instant is worth more than the same information buried in a
 * sentence of English explanation.
 */
import {
  isHanzi,
  isPolyphonic,
  lookupChar,
  lookupWord,
  pinyinOf,
  readingInContext,
  readingsOf,
  segmentReadings,
  toneOf,
} from '../lexicon';
import type { Item } from './types';

export interface Reveal {
  /** The Chinese being revealed - a character, a word, or a short phrase. */
  zh: string;
  /** Its reading, context-resolved where the item supplies context. */
  pinyin: string;
  /** English meaning, if the dictionary has one. */
  gloss: string;
  /** Per-character breakdown, so a two-character word shows both readings. */
  parts: { char: string; pinyin: string; gloss: string }[];
  /** Set when the character has more than one reading. */
  polyphonic?: { readings: string[]; note: string };
  /** Tone numbers, for the tone bar under the pinyin. */
  tones: number[];
  /** What the client should speak on reveal. */
  speak: string;
  /** HSK band, when known. */
  band: number | null;
  radical: string;
}

/** The Chinese this item is really about, if any. */
function subjectOf(item: Item): { zh: string; context?: string; index?: number } | null {
  const p = item.payload;

  switch (item.type) {
    case 'char-recognise':
    case 'char-pinyin':
    case 'handwrite':
      return { zh: p.writeChar ?? p.stem };

    case 'listen-char':
    case 'word-listen':
    case 'tone-discriminate':
      // The stem is the generic instruction; the audio text is the subject.
      return p.audioText ? { zh: p.audioText } : null;

    case 'word-meaning':
      return { zh: p.stem };

    case 'polyphone': {
      // The stem marks the character as 【X】 inside its sentence.
      const m = /【(.)】/.exec(p.stem);
      if (!m) return null;
      const context = p.audioText ?? p.stem.replace(/【|】/g, '');
      const index = [...context].indexOf(m[1]);
      return { zh: m[1], context, index };
    }

    case 'read-aloud':
      return { zh: p.stem };

    default:
      return null;
  }
}

/**
 * Build the reveal for an item, or null when there is nothing worth revealing.
 *
 * Comprehension and 语文基础知识 items return null: the useful feedback there is
 * the explanation, and stacking a pinyin card on top of it is noise.
 */
export function buildReveal(item: Item): Reveal | null {
  const subject = subjectOf(item);
  if (!subject) return null;

  const zh = subject.zh.trim();
  if (!zh || ![...zh].some(isHanzi)) return null;

  const chars = [...zh].filter(isHanzi);
  const single = chars.length === 1;

  // Context-resolved reading where the item gives us a sentence to resolve in.
  const pinyin =
    subject.context !== undefined && subject.index !== undefined && subject.index >= 0
      ? readingInContext(subject.context, subject.index)
      : pinyinOf(zh);

  const wordEntry = !single ? lookupWord(zh) : undefined;
  const charEntry = single ? lookupChar(zh) : undefined;

  const segments = segmentReadings(zh).filter((s) => isHanzi(s.char));
  const parts = segments.map((s) => ({
    char: s.char,
    pinyin: s.reading,
    gloss: lookupChar(s.char)?.gloss ?? '',
  }));

  let polyphonic: Reveal['polyphonic'];
  if (single && isPolyphonic(zh)) {
    const all = readingsOf(zh);
    const others = all.filter((r) => r !== pinyin);
    polyphonic = {
      readings: all,
      note: others.length
        ? `多音字 — also read ${others.join(', ')}. Which one depends on the word it is in.`
        : '多音字',
    };
  }

  return {
    zh,
    pinyin,
    gloss: charEntry?.gloss ?? wordEntry?.gloss ?? parts.map((p) => p.gloss).filter(Boolean).join(' + '),
    // A single character needs no breakdown - it would just repeat itself.
    parts: single ? [] : parts,
    polyphonic,
    tones: chars.map((c) => toneOf(c)),
    speak: subject.context ?? zh,
    band: charEntry?.band ?? wordEntry?.band ?? null,
    radical: charEntry?.radical ?? '',
  };
}
