/**
 * Reports coverage of every seed chapter against a few synthetic learners.
 * Authoring aid: run it after editing a chapter, before committing.
 *
 *   npx tsx scripts/check-coverage.ts
 */
import { CHARS, splitCoverage } from '../src/lib/lexicon';
import { chapterText, choiceText, validateScript } from '../src/lib/story/types';
import { gateChapter, targetChars, nameChars } from '../src/lib/story/engine';
import { ALL_SEED_CHAPTERS } from '../src/content/chapters';

/** Learner profiles, defined as "knows the top N characters by HSK band then frequency". */
const PROFILES: { name: string; size: number }[] = [
  { name: 'weak    (300)', size: 300 },
  { name: 'typical (600)', size: 600 },
  { name: 'ok     (1000)', size: 1000 },
];

function knownSet(size: number): Set<string> {
  return new Set(CHARS.slice(0, size).map((c) => c.c));
}

const pad = (s: string, n: number) => s.padEnd(n);

for (const ch of ALL_SEED_CHAPTERS) {
  const errors = validateScript(ch.script);
  console.log(`\n${ch.id}  band ${ch.band}  ${ch.title}`);
  if (errors.length) {
    console.log('  STRUCTURE ERRORS:');
    for (const e of errors) console.log('    - ' + e);
  }
  const body = chapterText(ch.script);
  const choices = choiceText(ch.script);
  console.log(`  ${body.length} chars of prose, ${choices.length} in choices`);

  for (const p of PROFILES) {
    const known = knownSet(p.size);
    const tg = targetChars(ch.script);
    const nm = nameChars(ch.script);
    const c = splitCoverage(body, known, tg, nm);
    const cc = choices ? splitCoverage(choices, known, new Set(), nm) : null;
    const gate = gateChapter(ch.script, known);
    const pre =
      gate.decision === 'pre-teach' ? ` preteach ${gate.preTeach.map((x) => x.c).join('')}` : '';
    const why = gate.decision === 'reject' ? ` (${gate.reason})` : '';
    console.log(
      `    ${pad(p.name, 14)} known ${(c.knownShare * 100).toFixed(1)}% tgt ${(c.targetShare * 100).toFixed(1)}% inc ${(c.incidentalShare * 100).toFixed(1)}%` +
        (cc ? `  choice ${(cc.knownShare * 100).toFixed(1)}%` : '') +
        `  -> ${gate.decision}${pre}${why}`,
    );
  }
  const inc600 = splitCoverage(body, knownSet(600), targetChars(ch.script), nameChars(ch.script))
    .incidental;
  if (inc600.length) {
    console.log(
      '    incidental@600: ' + inc600.map((u) => `${u.c}(${u.count},b${u.band})`).join(' '),
    );
  }
}
