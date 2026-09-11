import type { Item } from './types';

/**
 * The client-safe view of an item.
 *
 * Two things are hidden, not one:
 *
 * 1. The answer key never leaves the server.
 * 2. The option IDS never leave the server either. Authored items use
 *    a/b/c/d and generated ones use k/d0/d1/d2 - and `k` is a large arrow
 *    pointing at the correct answer for anyone who opens devtools. A
 *    13-year-old will absolutely find that, and it would break the only part of
 *    the app that teaches him anything.
 *
 * So options are re-keyed to positional `o0..oN` on the way out and mapped back
 * on the way in. Position leaks nothing: generated items shuffle their options
 * before they get here, and authored ones are marked through the same mapping.
 */
export interface PublicItem {
  id: string;
  type: Item['type'];
  skill: Item['skill'];
  band: number;
  stem: string;
  stemEn?: string;
  audioText?: string;
  passage?: string;
  passageTitle?: string;
  options?: { id: string; zh?: string; en?: string; pinyin?: string }[];
  writeChar?: string;
  minChars?: number;
  hintEn?: string;
}

export const publicOptionId = (index: number) => `o${index}`;

export function publicItem(item: Item): PublicItem {
  const p = item.payload;
  return {
    id: item.id,
    type: item.type,
    skill: item.skill,
    band: item.band,
    stem: p.stem,
    stemEn: p.stemEn,
    audioText: p.audioText,
    passage: p.passage,
    passageTitle: p.passageTitle,
    options: p.options?.map((o, i) => ({
      id: publicOptionId(i),
      zh: o.zh,
      en: o.en,
      pinyin: o.pinyin,
    })),
    writeChar: p.writeChar,
    minChars: p.minChars,
    hintEn: p.hintEn,
  };
}

/**
 * Map a client-supplied option id back to the real one.
 *
 * Returns the input unchanged when it is not a positional id, so open-answer
 * values (a transcript, an essay, a stroke score) pass through untouched.
 */
export function resolveOption(item: Item, value: string): string {
  const m = /^o(\d+)$/.exec(value);
  if (!m) return value;
  const index = Number(m[1]);
  return item.payload.options?.[index]?.id ?? value;
}
