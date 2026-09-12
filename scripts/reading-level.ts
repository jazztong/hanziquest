/**
 * Measures the reading level of what we actually ship, side by side.
 *
 * Authoring aid. The question it answers is not "does it pass the coverage
 * gate" (tests already cover that) but "does this read like something written
 * for a thirteen-year-old, or like something written for a beginner".
 * Those are different failures and only the first one is tested.
 */
import { ALL_SEED_CHAPTERS } from '../src/content/chapters';
import { SAMPLE_LESSONS } from '../src/content/sample-lessons';
import { PASSAGES } from '../src/content/baseline-items';
import { chapterText } from '../src/lib/story/types';
import { isHanzi, lookupChar } from '../src/lib/lexicon';

interface Profile {
  label: string;
  text: string;
  /** Sentences, split on 。！？ */
  sentences: string[];
}

function sentencesOf(text: string): string[] {
  return text
    .split(/[。！？]/)
    .map((s) => s.replace(/[^一-鿿]/g, ''))
    .filter((s) => s.length > 0);
}

function analyse(p: Profile) {
  const chars = [...p.text].filter(isHanzi);
  const bands = chars.map((c) => lookupChar(c)?.band ?? 8);
  const sentLens = p.sentences.map((s) => [...s].length);

  const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const pct = (n: number) => `${((n / chars.length) * 100).toFixed(0)}%`;

  return {
    label: p.label,
    total: chars.length,
    sentences: p.sentences.length,
    meanSentence: mean(sentLens).toFixed(1),
    maxSentence: Math.max(0, ...sentLens),
    meanBand: mean(bands).toFixed(2),
    band12: pct(bands.filter((b) => b <= 2).length),
    band45plus: pct(bands.filter((b) => b >= 4).length),
    distinct: new Set(chars).size,
    /** Type/token ratio - higher means more varied vocabulary. */
    ttr: (new Set(chars).size / chars.length).toFixed(2),
  };
}

const rows = [
  ...ALL_SEED_CHAPTERS.map((c) => ({
    label: `chapter ${c.id}`,
    text: chapterText(c.script),
    sentences: sentencesOf(chapterText(c.script)),
  })),
  ...SAMPLE_LESSONS.map((l) => ({
    label: `LESSON ${l.id.replace('lesson-sample-', '')} (初一 textbook register)`,
    text: l.text,
    sentences: sentencesOf(l.text),
  })),
  ...PASSAGES.map((p) => ({
    label: `PASSAGE ${p.id} (${p.genre})`,
    text: p.text,
    sentences: sentencesOf(p.text),
  })),
].map(analyse);

const head = [
  'content',
  'chars',
  'sent',
  'len',
  'max',
  'band',
  '≤b2',
  '≥b4',
  'uniq',
  'ttr',
];
const w = [44, 6, 5, 6, 5, 6, 5, 5, 5, 5];
console.log(head.map((h, i) => h.padEnd(w[i])).join(''));
console.log('-'.repeat(w.reduce((a, b) => a + b, 0)));
for (const r of rows) {
  const cells = [
    r.label,
    r.total,
    r.sentences,
    r.meanSentence,
    r.maxSentence,
    r.meanBand,
    r.band12,
    r.band45plus,
    r.distinct,
    r.ttr,
  ];
  console.log(cells.map((c, i) => String(c).padEnd(w[i])).join(''));
}

console.log(`
Reference points
  统考 现代文阅读 记叙类 passage            800-900 chars
  初一 textbook 课文 (our sample lessons)   see LESSON rows above
  A chapter is ONE sitting of ~8-10 minutes, so it will always be
  shorter than a 课文 - but sentence length and band mix should be
  in the same neighbourhood, not a different one.`);
