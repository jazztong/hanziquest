/**
 * Builds the runtime lexicon from the vendored HSK 3.0 sources.
 *
 * Inputs  (data/source/)
 *   hsk-complete.min.json  - drizzle of HSK 2.0/3.0 entries (MIT, drkameleon)
 *   hsk-hanzi.json         - HSK 3.0 per-band character inventories (krmanik)
 *
 * Output  (data/source/lexicon.json)
 *   { chars: CharEntry[], words: WordEntry[] }
 *
 * Pinyin is NOT taken from the source files. It is resolved through pinyin-pro,
 * which carries the full 汉语拼音 dictionary and knows every reading of a
 * 多音字. The constraint in the brief is "validate pinyin and tones against the
 * dictionary, not LLM output" - this script is where that rule is enforced, once,
 * at build time.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pinyin } from 'pinyin-pro';

const SRC = path.join(process.cwd(), 'data', 'source');

/** Raw shape of an entry in hsk-complete.min.json. */
interface RawEntry {
  s: string; // simplified
  r?: string; // radical
  l?: string[]; // level tags: n1..n7 (HSK 3.0), o1..o6 (HSK 2.0), t1..t7
  q?: number; // corpus frequency rank (lower = more frequent)
  p?: string[]; // parts of speech
  f?: { t: string; i: { y: string }; m: string[] }[];
}

export interface CharEntry {
  c: string;
  /** Every dictionary reading, most common first. Length > 1 means 多音字. */
  py: string[];
  /** HSK 3.0 band 1-7 (7 = the 7-9 advanced band). */
  band: number;
  /** Corpus frequency rank; 99999 when unknown. */
  freq: number;
  radical: string;
  gloss: string;
  /**
   * False when the dictionary has no usable meaning for this character - only
   * surnames, variants and cross-references. Recognition items skip these:
   * asking "what does 兮 mean?" with the key "variant of X" is a question with
   * no real answer.
   */
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

/** `n3` -> 3, `n7` -> 7. Returns null for HSK 2.0 / traditional-only tags. */
function hsk30Band(tags: string[] | undefined): number | null {
  if (!tags) return null;
  const bands = tags
    .filter((t) => /^n[1-7]$/.test(t))
    .map((t) => Number(t.slice(1)));
  return bands.length ? Math.min(...bands) : null;
}

function firstGloss(e: RawEntry): string {
  const m = e.f?.[0]?.m ?? [];
  return m.slice(0, 2).join('; ');
}

function build() {
  const raw: RawEntry[] = JSON.parse(
    fs.readFileSync(path.join(SRC, 'hsk-complete.min.json'), 'utf8'),
  );
  const hanziByBand: Record<string, string[]> = JSON.parse(
    fs.readFileSync(path.join(SRC, 'hsk-hanzi.json'), 'utf8'),
  );
  // Character glosses come from CC-CEDICT via scripts/build-glosses.ts, NOT
  // from the HSK word file. The word file is a vocabulary list: it covers only
  // about half the character set, and where it does cover a character its first
  // form is often the surname reading (也 → "surname Ye").
  const glosses: Record<string, { gloss: string; teachable: boolean }> = JSON.parse(
    fs.readFileSync(path.join(SRC, 'char-glosses.json'), 'utf8'),
  );

  // ---- characters ---------------------------------------------------------
  // Band comes from the official 汉字表, which is authoritative for characters.
  const bandOf = new Map<string, number>();
  for (const [key, chars] of Object.entries(hanziByBand)) {
    const band = key === '7-9' ? 7 : Number(key);
    for (const c of chars) if (!bandOf.has(c)) bandOf.set(c, band);
  }

  // Frequency, radical and gloss come from the word file's single-char entries.
  const singleChar = new Map<string, RawEntry>();
  for (const e of raw) {
    if ([...e.s].length === 1 && !singleChar.has(e.s)) singleChar.set(e.s, e);
  }

  const chars: CharEntry[] = [];
  for (const [c, band] of bandOf) {
    const e = singleChar.get(c);
    const readings = pinyin(c, {
      multiple: true,
      toneType: 'symbol',
      type: 'array',
    }) as string[];
    const g = glosses[c];
    chars.push({
      c,
      py: [...new Set(readings)].filter(Boolean),
      band,
      freq: e?.q ?? 99999,
      radical: e?.r ?? '',
      gloss: g?.gloss ?? (e ? firstGloss(e) : ''),
      teachable: g?.teachable ?? false,
    });
  }
  chars.sort((a, b) => a.band - b.band || a.freq - b.freq);

  // ---- words --------------------------------------------------------------
  const words: WordEntry[] = [];
  for (const e of raw) {
    const band = hsk30Band(e.l);
    if (band === null) continue;
    if ([...e.s].length < 2) continue;
    words.push({
      w: e.s,
      // Word-level pinyin uses the non-multiple mode: pinyin-pro resolves
      // 多音字 from context, which is the whole point of asking it per word
      // rather than concatenating per-character readings.
      py: pinyin(e.s, { toneType: 'symbol' }),
      band,
      freq: e.q ?? 99999,
      pos: e.p ?? [],
      gloss: firstGloss(e),
    });
  }
  words.sort((a, b) => a.band - b.band || a.freq - b.freq);

  const out = { chars, words };
  const file = path.join(SRC, 'lexicon.json');
  fs.writeFileSync(file, JSON.stringify(out));

  const poly = chars.filter((c) => c.py.length > 1).length;
  const noGloss = chars.filter((c) => !c.gloss).length;
  const unteachable = chars.filter((c) => !c.teachable).length;
  console.log(`lexicon.json written -> ${file}`);
  console.log(`  characters : ${chars.length}  (${poly} 多音字)`);
  console.log(`  no gloss   : ${noGloss}`);
  console.log(`  unteachable: ${unteachable} (skipped by recognition items)`);
  console.log(`  words      : ${words.length}`);
  for (let b = 1; b <= 7; b++) {
    const cc = chars.filter((c) => c.band === b).length;
    const wc = words.filter((w) => w.band === b).length;
    console.log(`  band ${b}: ${String(cc).padStart(4)} chars, ${String(wc).padStart(5)} words`);
  }
}

build();
