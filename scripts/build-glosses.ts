/**
 * Builds a compact character-gloss file from CC-CEDICT.
 *
 *   npx tsx scripts/build-glosses.ts
 *
 * Why this exists: the HSK vocabulary file we were using is a WORD list, so
 * only 1,571 of the 2,999 HSK characters appear in it as standalone entries -
 * 儿, 房, 工, 果, 明 and 1,437 others simply had no gloss. Worse, for the
 * characters it did cover, the first form is frequently the SURNAME reading, so
 * 也 came out as "surname Ye" rather than "also" and 都 as "surname Du" rather
 * than "all". Both bugs landed squarely on the recognition stage of the
 * prologue, which is the single highest-weighted skill in the profile.
 *
 * CC-CEDICT covers every character, so this extracts just the entries for the
 * HSK character set and picks a *teachable* sense by rule.
 *
 * Licence: CC-CEDICT is CC BY-SA 4.0. The extracted subset is a derivative and
 * carries the same terms; attribution is vendored beside the output.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pinyin } from 'pinyin-pro';

const SRC = path.join(process.cwd(), 'data', 'source');
const CEDICT_URL =
  'https://raw.githubusercontent.com/krmanik/HSK-3.0/main/Scripts%20and%20data/all_cedict.json';

interface CedictEntry {
  simplified: string;
  traditional: string;
  pinyin: string[];
  definitions: Record<string, string>;
}

/**
 * Senses that are dictionary bookkeeping rather than meanings a learner can
 * use. A recognition item keyed on "variant of 从" teaches nothing and cannot
 * be answered by understanding.
 */
const ARTEFACT = [
  /^surname\b/i,
  /^variant of/i,
  /^old variant/i,
  /^japanese variant/i,
  /^erroneous variant/i,
  /^used in\b/i,
  /^see\b/i,
  /^abbr\.? for/i,
  /^also written/i,
  /^phonetic\b/i,
  /^radical\b/i,
  /^\(old\)/i,
  /^\(archaic\)/i,
  /^\(bound form\)/i,
  /^\(surname\)/i,
  /^CL:/,
];

const isArtefact = (s: string) => ARTEFACT.some((r) => r.test(s.trim()));

/** Cut at a word boundary rather than mid-word, which reads as a typo. */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s(,;]+$/, '') + '…';
}

/** CC-CEDICT capitalises the pinyin of proper nouns: Ye3, Fang2, Ming2. */
const isProperNoun = (reading: string) => /^[A-Z]/.test(reading.trim());

/** Strip the cross-reference clutter CC-CEDICT embeds in definitions. */
function clean(sense: string): string {
  return sense
    .replace(/\[[^\]]*\]/g, '') // [pin1 yin1]
    .replace(/[一-鿿|]+/g, '') // embedded hanzi and 繁|简 pairs
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*;\s*$/, '')
    .trim();
}

export interface GlossEntry {
  /** Two or three short senses, semicolon separated. */
  gloss: string;
  /** The reading those senses belong to. */
  reading: string;
  /**
   * False when CC-CEDICT has nothing teachable for this character - only
   * surnames, variants and cross-references. Recognition items skip these
   * rather than asking a question with no real answer.
   */
  teachable: boolean;
}

/**
 * Pick the sense set a learner should see.
 *
 * Order of preference, and every step here exists because of a real wrong
 * answer found by scripts/audit-recognition.ts:
 *   1. the reading pinyin-pro considers dominant (so 明 gets ming2, not Ming2)
 *   2. any non-proper-noun reading
 *   3. anything at all, marked not teachable
 * Within the chosen reading, artefact senses are dropped, and what is left is
 * trimmed to something that fits on a phone.
 */
export function pickGloss(entry: CedictEntry, char: string): GlossEntry {
  const dominant = (pinyin(char, { toneType: 'num', type: 'array' }) as string[])[0]
    ?.toLowerCase()
    .replace(/\s/g, '');

  const readings = entry.pinyin ?? Object.keys(entry.definitions ?? {});
  const ordered = [
    ...readings.filter((r) => r.toLowerCase().replace(/\s/g, '') === dominant && !isProperNoun(r)),
    ...readings.filter((r) => !isProperNoun(r)),
    ...readings,
  ];

  for (const reading of ordered) {
    const raw = entry.definitions?.[reading];
    if (!raw) continue;
    const senses = raw
      .split(';')
      .map(clean)
      .filter((s) => s.length > 1 && !isArtefact(s));
    if (!senses.length) continue;

    // Two senses is enough to disambiguate without becoming a paragraph.
    //
    // Short senses are preferred over long ones even when the long one comes
    // first: 个's leading sense is "(classifier used before a noun that has no
    // specific classifier)", which truncates to nonsense, while its second
    // sense "individual" is both shorter and more useful on a card.
    const BUDGET = 46;
    const ordered = [...senses].sort((a, b) => {
      const short = (x: string) => (x.length <= 28 ? 0 : 1);
      return short(a) - short(b);
    });

    const picked: string[] = [];
    for (const s of ordered) {
      if (picked.length && picked.join('; ').length + 2 + s.length > BUDGET) continue;
      // The first sense goes in even if it is over budget - a truncated real
      // meaning beats no meaning - but it still gets cut at a word boundary.
      picked.push(truncate(s, BUDGET));
      if (picked.length === 2) break;
    }
    if (!picked.length) picked.push(truncate(senses[0], BUDGET));

    return { gloss: picked.join('; '), reading, teachable: true };
  }

  // Nothing usable: keep the least-bad string so the card still shows something.
  const fallbackReading = readings[0] ?? '';
  const fallback = clean((entry.definitions?.[fallbackReading] ?? '').split(';')[0] ?? '');
  return { gloss: fallback.slice(0, 46), reading: fallbackReading, teachable: false };
}

async function main() {
  const cachePath = path.join(SRC, 'cedict-raw.json');
  let text: string;
  if (fs.existsSync(cachePath)) {
    console.log('using cached CC-CEDICT');
    text = fs.readFileSync(cachePath, 'utf8');
  } else {
    console.log('fetching CC-CEDICT…');
    const res = await fetch(CEDICT_URL);
    if (!res.ok) throw new Error(`CC-CEDICT fetch failed: ${res.status}`);
    text = await res.text();
    fs.writeFileSync(cachePath, text);
  }

  const dict = JSON.parse(text) as Record<string, CedictEntry>;
  const hanzi: Record<string, string[]> = JSON.parse(
    fs.readFileSync(path.join(SRC, 'hsk-hanzi.json'), 'utf8'),
  );
  const chars = [...new Set(Object.values(hanzi).flat())];

  const out: Record<string, GlossEntry> = {};
  let missing = 0;
  let unteachable = 0;

  for (const c of chars) {
    const entry = dict[c];
    if (!entry) {
      missing++;
      continue;
    }
    const g = pickGloss(entry, c);
    if (!g.teachable) unteachable++;
    out[c] = g;
  }

  fs.writeFileSync(path.join(SRC, 'char-glosses.json'), JSON.stringify(out));

  fs.writeFileSync(
    path.join(SRC, 'LICENSE-cc-cedict.txt'),
    [
      'char-glosses.json is derived from CC-CEDICT.',
      '',
      'CC-CEDICT is licensed under the Creative Commons Attribution-ShareAlike 4.0',
      'International License (CC BY-SA 4.0).',
      '  https://creativecommons.org/licenses/by-sa/4.0/',
      '  https://cc-cedict.org/',
      '',
      'This file contains an extracted and reformatted subset: one short English',
      'gloss for each of the characters in the HSK 3.0 character list. As a',
      'derivative work it is distributed under the same CC BY-SA 4.0 terms.',
      '',
      `Extracted ${Object.keys(out).length} character entries on ${new Date().toISOString().slice(0, 10)}.`,
    ].join('\n'),
  );

  console.log(`char-glosses.json: ${Object.keys(out).length} of ${chars.length} characters`);
  console.log(`  not in CC-CEDICT : ${missing}`);
  console.log(`  no teachable sense: ${unteachable} (recognition items will skip these)`);
  for (const c of ['也', '都', '过', '个', '儿', '房', '工', '果', '明', '朋', '从']) {
    if (out[c]) console.log(`  ${c} → ${out[c].reading}  "${out[c].gloss}"${out[c].teachable ? '' : '  [not teachable]'}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
