/**
 * Audits the character-recognition items ("The Wall of Names") for correctness.
 *
 *   npx tsx scripts/audit-recognition.ts [sampleSize]
 *
 * Three failure modes worth finding, in order of how bad they are:
 *
 *  1. AMBIGUOUS - a distractor is also a valid meaning of the target character.
 *     The item then has two right answers and marks a correct answer wrong.
 *     This is the only one that actively teaches something false.
 *  2. USELESS KEY - the "meaning" is a dictionary artefact rather than a
 *     meaning: "surname Zhang", "variant of X", "used in 恶心", a bare
 *     classifier note. The item is answerable but teaches nothing.
 *  3. WEAK - empty gloss, or a key so long it is unreadable on a phone.
 */
import { CHARS, charsInBand, lookupChar } from '../src/lib/lexicon';
import { charRecogniseItem } from '../src/lib/items/generate';

const SAMPLE = Number(process.argv[2] ?? 400);

/** Dictionary artefacts that are not meanings a learner can use. */
const ARTEFACT = [
  /^surname\b/i,
  /^variant of/i,
  /^used in\b/i,
  /^old variant/i,
  /^see \b/i,
  /^abbr\.? for/i,
  /^\(old\)/i,
  /^phonetic\b/i,
  /^radical\b/i,
  /^Japanese variant/i,
  /^erroneous variant/i,
  /^also written/i,
];

const isArtefact = (g: string) => ARTEFACT.some((r) => r.test(g.trim()));

/** All senses of a character, lowercased, for overlap checking. */
function sensesOf(ch: string): string[] {
  const e = lookupChar(ch);
  if (!e?.gloss) return [];
  return e.gloss
    .split(/[;,]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Do two glosses mean the same thing closely enough to confuse a learner? */
function overlaps(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/^to\s+/, '')
      .replace(/^\(.*?\)\s*/, '')
      .replace(/[^a-z\s]/g, '')
      .trim();
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  // One contained in the other, when the shorter is a real word not a fragment.
  if (x.length > 3 && y.length > 3 && (x.includes(y) || y.includes(x))) return true;
  return false;
}

let generated = 0;
let nullItems = 0;
const ambiguous: string[] = [];
const uselessKey: string[] = [];
const weak: string[] = [];

const pool = CHARS.slice(0, SAMPLE);
for (const entry of pool) {
  const item = charRecogniseItem(entry);
  if (!item) {
    nullItems++;
    continue;
  }
  generated++;

  const opts = item.payload.options ?? [];
  const key = opts.find((o) => o.id === 'k')?.en ?? '';
  const distractors = opts.filter((o) => o.id !== 'k').map((o) => o.en ?? '');

  if (!key.trim()) {
    weak.push(`${entry.c}  (empty key)`);
    continue;
  }
  if (isArtefact(key)) {
    uselessKey.push(`${entry.c}  key="${key}"`);
  }
  if (key.length > 48) {
    weak.push(`${entry.c}  key too long (${key.length}): "${key.slice(0, 50)}…"`);
  }

  // The serious one: is any distractor also a meaning of the target character?
  const targetSenses = sensesOf(entry.c);
  for (const d of distractors) {
    const clash = targetSenses.some((s) => overlaps(s, d));
    if (clash) {
      ambiguous.push(`${entry.c}  key="${key}"  but distractor "${d}" is also a sense of ${entry.c}`);
    }
  }
}

const pct = (n: number) => `${((n / Math.max(1, generated)) * 100).toFixed(1)}%`;

console.log(`CHARACTER RECOGNITION AUDIT — first ${SAMPLE} characters by band/frequency`);
console.log('='.repeat(78));
console.log(`generated          ${generated}`);
console.log(`could not generate ${nullItems} (too few same-band distractors)`);
console.log('');
console.log(`AMBIGUOUS (two right answers)  ${ambiguous.length}  ${pct(ambiguous.length)}`);
ambiguous.slice(0, 15).forEach((a) => console.log('   ' + a));
console.log('');
console.log(`USELESS KEY (dictionary artefact) ${uselessKey.length}  ${pct(uselessKey.length)}`);
uselessKey.slice(0, 20).forEach((a) => console.log('   ' + a));
console.log('');
console.log(`WEAK (empty or unreadable) ${weak.length}  ${pct(weak.length)}`);
weak.slice(0, 10).forEach((a) => console.log('   ' + a));

// How many characters in the whole set have an artefact as their first gloss?
const allArtefacts = CHARS.filter((c) => c.gloss && isArtefact(c.gloss.split(/[;,]/)[0]));
console.log('');
console.log('='.repeat(78));
console.log(`Across all ${CHARS.length} characters, ${allArtefacts.length} have a dictionary artefact as their leading gloss.`);
console.log('Examples: ' + allArtefacts.slice(0, 12).map((c) => `${c.c}="${c.gloss.split(';')[0]}"`).join('  '));
const noGloss = CHARS.filter((c) => !c.gloss?.trim());
console.log(`${noGloss.length} characters have no gloss at all${noGloss.length ? ': ' + noGloss.slice(0, 20).map((c) => c.c).join(' ') : ''}`);
void charsInBand;
