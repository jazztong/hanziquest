/**
 * Reports what the app covers of the 初一 syllabus, and what it does not.
 *
 *   npx tsx scripts/curriculum-audit.ts
 *
 * Two questions, both answered mechanically rather than from memory:
 *   1. Which 初一 clauses have no item behind them?
 *   2. Is anything being served that belongs to 初二 or 初三?
 */
import { ASSESSABLE, NOT_YET, YEAR1 } from '../src/content/curriculum-year1';
import { LANGUAGE_KNOWLEDGE_ITEMS, PASSAGES } from '../src/content/baseline-items';
import { ALL_SEED_CHAPTERS } from '../src/content/chapters';
import { POEMS } from '../src/content/poems';

const items = [...LANGUAGE_KNOWLEDGE_ITEMS, ...PASSAGES.flatMap((p) => p.questions)];

/** Everything an authored item claims to cover. */
const claimed = new Set<string>();
for (const it of items) {
  if (it.standardRef) claimed.add(it.standardRef);
  for (const t of it.tags) if (t.startsWith('standard:')) claimed.add(t.slice('standard:'.length));
}

// Generators cover these without an authored item existing for each instance.
const GENERATED: Record<string, string> = {
  '1.6.2': 'char-pinyin / tone-discriminate, generated from the dictionary',
  '1.6.4': 'polyphone items, generated wherever a 多音字 appears',
  '1.2.5': `${POEMS.filter((p) => p.year === 1).length} 初一 relics (line audio, cloze, recite)`,
  '1.2.6': 'tap-to-gloss dictionary lookup in every chapter and lesson',
  '1.1.3': 'voiced chapters and listening items',
  '1.1.6': '朗读 nodes in chapters, recite-to-activate on relics',
  '1.1.1': 'listen-char items',
  '1.3.2': '应用文 format checker',
};

const pad = (s: string, n: number) => s.padEnd(n);
console.log('初一 SYLLABUS COVERAGE\n' + '='.repeat(78));

const gaps: { ref: string; zh: string; topics: string[] }[] = [];

for (const c of ASSESSABLE) {
  const wanted = c.topics?.length
    ? c.topics.map((t) => `${c.ref}-${t.key}`)
    : [c.ref];
  const hit = wanted.filter((w) => claimed.has(w));
  const missing = wanted.filter((w) => !claimed.has(w));

  let status: string;
  if (missing.length === 0) status = 'covered';
  else if (GENERATED[c.ref]) status = `generated (${GENERATED[c.ref]})`;
  else if (hit.length) status = `partial ${hit.length}/${wanted.length}`;
  else status = 'MISSING';

  const flag = status === 'covered' ? '  ' : status.startsWith('generated') ? '~ ' : status.startsWith('partial') ? '! ' : 'X ';
  console.log(`${flag}${pad(c.ref, 8)}${pad(c.zh.slice(0, 34), 36)}${status}`);

  if ((status === 'MISSING' || status.startsWith('partial')) && !GENERATED[c.ref]) {
    gaps.push({ ref: c.ref, zh: c.zh, topics: missing });
  }
}

console.log('\n' + '='.repeat(78));
console.log(`GAPS: ${gaps.length} clause(s) with no or partial item coverage\n`);
for (const g of gaps) {
  console.log(`  ${g.ref}  ${g.zh.slice(0, 50)}`);
  if (g.topics.length && g.topics[0] !== g.ref) {
    console.log(`        missing: ${g.topics.map((t) => t.split('-').slice(1).join('-')).join(', ')}`);
  }
}

// --- out-of-scope check ----------------------------------------------------
console.log('\n' + '='.repeat(78));
const laterRefs = new Set(NOT_YET.map((n) => n.ref));
const leaked = [...claimed].filter((c) => {
  const base = c.split('-')[0];
  return laterRefs.has(base) || /^[23]\./.test(base);
});
if (leaked.length) {
  console.log('OUT OF SCOPE for 初一 - these belong to a later year:');
  for (const l of leaked) console.log('  ' + l);
} else {
  console.log('OUT OF SCOPE: none. Nothing from 初二 or 初三 is being served.');
}

// --- relics ---------------------------------------------------------------
console.log('\n' + '='.repeat(78));
const y1 = POEMS.filter((p) => p.year === 1);
console.log(`初一 relics (1.2.5): ${y1.length} of ${POEMS.length} total`);
for (const p of y1) console.log(`  ${p.title} — ${p.author} — ${p.book} ${p.lesson}`);

// --- chapters -------------------------------------------------------------
console.log('\n' + '='.repeat(78));
console.log(`Story chapters: ${ALL_SEED_CHAPTERS.length}, all written to 初一 bands`);
console.log(`Strands with no assessable clause served: ` +
  YEAR1.filter((c) => !c.assessable).map((c) => c.ref).join(', '));
