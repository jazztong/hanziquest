import { describe, it, expect } from 'vitest';
import {
  CHARS,
  WORDS,
  coverage,
  splitCoverage,
  verifyCoverage,
  COVERAGE_BANDS,
  isPolyphonic,
  readingsOf,
  readingInContext,
  validatePinyin,
  toneOf,
  rarityOf,
  uniqueHanzi,
  lookupChar,
  pinyinOf,
} from '@/lib/lexicon';
import { charRecogniseItem } from '@/lib/items/generate';

describe('lexicon data', () => {
  it('loads the HSK 3.0 inventories', () => {
    expect(CHARS.length).toBeGreaterThan(2900);
    expect(WORDS.length).toBeGreaterThan(9000);
  });

  it('assigns every character a band in 1-7', () => {
    for (const c of CHARS) expect(c.band).toBeGreaterThanOrEqual(1);
    for (const c of CHARS) expect(c.band).toBeLessThanOrEqual(7);
  });

  it('gives every character at least one reading', () => {
    const missing = CHARS.filter((c) => c.py.length === 0);
    expect(missing.map((c) => c.c)).toEqual([]);
  });
});

describe('多音字 handling', () => {
  it('detects characters with more than one reading', () => {
    expect(isPolyphonic('行')).toBe(true);
    expect(isPolyphonic('重')).toBe(true);
    expect(isPolyphonic('长')).toBe(true);
  });

  it('does not flag single-reading characters', () => {
    expect(isPolyphonic('我')).toBe(false);
    expect(isPolyphonic('学')).toBe(false);
  });

  it('resolves the reading from context, not in isolation', () => {
    // 行 is háng in 银行 and xíng in 行走. A context-free lookup gets one of
    // them wrong, which is the whole reason readingInContext exists.
    const bank = readingInContext('我去银行', 3);
    const walk = readingInContext('他在行走', 2);
    expect(bank).toContain('háng');
    expect(walk).toContain('xíng');
    expect(bank).not.toEqual(walk);
  });

  it('accepts any dictionary reading but reports ambiguity', () => {
    const v = validatePinyin('行', 'xíng');
    expect(v.ok).toBe(true);
    expect(v.ambiguous).toBe(true);
    expect(v.readings.length).toBeGreaterThan(1);

    const w = validatePinyin('行', 'zzz');
    expect(w.ok).toBe(false);
  });

  it('knows the classical reading of 见 in 敕勒歌 is not the default', () => {
    // 风吹草低见牛羊 - 见 is xiàn here. The dictionary must at least KNOW xiàn,
    // otherwise the relic cannot teach the exception.
    expect(readingsOf('见').join(' ')).toMatch(/xiàn/);
  });
});

describe('tones', () => {
  it('reads tone numbers off syllables', () => {
    expect(toneOf('妈')).toBe(1);
    expect(toneOf('麻')).toBe(2);
    expect(toneOf('马')).toBe(3);
    expect(toneOf('骂')).toBe(4);
  });

  it('produces context-resolved pinyin for a phrase', () => {
    expect(pinyinOf('你好')).toMatch(/nǐ\s+hǎo/);
  });
});

describe('coverage', () => {
  const known = new Set(['我', '们', '去', '了', '学', '校']);

  it('counts tokens, not just types', () => {
    const r = coverage('我我我去校', known);
    expect(r.tokens).toBe(5);
    expect(r.types).toBe(3);
    expect(r.tokenCoverage).toBe(1);
  });

  it('ignores punctuation and latin text', () => {
    const r = coverage('我们去了学校。OK!', known);
    expect(r.tokens).toBe(6);
    expect(r.tokenCoverage).toBe(1);
  });

  it('lists unknown characters most-frequent first', () => {
    const r = coverage('猫猫猫狗', known);
    expect(r.unknown[0].c).toBe('猫');
    expect(r.unknown[0].count).toBe(3);
  });
});

describe('three-way coverage split', () => {
  const known = new Set([...'我们去了学校门口有水']);

  it('separates known, target and incidental characters', () => {
    const s = splitCoverage('我们去了学校，门口有伞和猫', known, new Set(['伞']));
    expect(s.targetTypes).toEqual(['伞']);
    expect(s.incidental.map((i) => i.c)).toContain('猫');
    expect(s.knownShare + s.targetShare + s.incidentalShare).toBeCloseTo(1, 5);
  });

  it('excludes proper nouns from the denominator entirely', () => {
    const withName = splitCoverage('林阿姨去了学校', known, new Set(), new Set([...'林阿姨']));
    const withoutName = splitCoverage('去了学校', known);
    expect(withName.tokens).toBe(withoutName.tokens);
    expect(withName.nameTokens).toBe(3);
    expect(withName.knownShare).toBeCloseTo(withoutName.knownShare, 5);
  });

  it('does not punish a chapter for repeating its own target word', () => {
    // 伞 x8 in a short text: as an incidental unknown this would fail hard; as a
    // declared target it is inside budget. This is the exact bug the three-way
    // split was introduced to fix.
    const text = '伞伞伞伞伞伞伞伞' + '我们去了学校门口有水'.repeat(12);
    const asTarget = verifyCoverage(text, known, 'chapter', new Set(['伞']), new Set(), 1);
    const asIncidental = verifyCoverage(text, known, 'chapter', new Set(), new Set(), 0);
    expect(asTarget.ok).toBe(true);
    expect(asIncidental.ok).toBe(false);
    expect(asIncidental.failure).toBe('incidental');
  });
});

describe('the coverage gate', () => {
  const known = new Set(CHARS.slice(0, 600).map((c) => c.c));

  it('rejects text with too many unplanned unknowns', () => {
    const v = verifyCoverage('翡翠玳瑁琥珀珊瑚', known, 'chapter');
    expect(v.ok).toBe(false);
    expect(v.failure).toBe('incidental');
  });

  it('flags text the learner already knows completely as too easy', () => {
    const easy = CHARS.slice(0, 40).map((c) => c.c).join('');
    const v = verifyCoverage(easy, known, 'chapter');
    expect(v.ok).toBe(false);
    expect(v.failure).toBe('too-easy');
  });

  it('enforces a stricter floor for choice text than for prose', () => {
    expect(COVERAGE_BANDS.choice.min).toBeGreaterThan(COVERAGE_BANDS.chapter.min);
    expect(COVERAGE_BANDS.choice.maxIncidental).toBe(0);
  });

  it('caps the number of target words', () => {
    const targets = new Set([...'一二三四五六七八九十百千万亿']);
    const text = '一二三四五六七八九十百千万亿' + '我们去学校'.repeat(30);
    const v = verifyCoverage(text, known, 'chapter', targets, new Set(), 14);
    expect(v.ok).toBe(false);
    expect(['target-count', 'target-share']).toContain(v.failure);
  });
});

describe('rarity', () => {
  it('maps HSK band to rarity monotonically', () => {
    const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const byBand = [1, 2, 3, 5, 7].map((b) => {
      const c = CHARS.find((x) => x.band === b)!;
      return order.indexOf(rarityOf(c.c));
    });
    for (let i = 1; i < byBand.length; i++) {
      expect(byBand[i]).toBeGreaterThanOrEqual(byBand[i - 1]);
    }
  });
});

describe('character glosses', () => {
  // These guard a real bug. Glosses originally came from the HSK *word* file,
  // which covers only half the character set and lists the surname reading
  // first - so 也 was keyed "surname Ye" and 1,442 characters had no gloss at
  // all, on the highest-weighted stage of the whole prologue.
  it('gives almost every character a gloss', () => {
    const missing = CHARS.filter((c) => !c.gloss?.trim());
    expect(missing.length).toBeLessThanOrEqual(2);
  });

  it('gives common characters their common meaning, not their surname', () => {
    const expected: Record<string, RegExp> = {
      也: /also|too/i,
      都: /all|both/i,
      过: /cross|pass|go over/i,
      儿: /child|son/i,
      房: /house|room/i,
      工: /work|labor|labour/i,
      明: /bright/i,
      朋: /friend/i,
      年: /year/i,
      车: /car|vehicle|cart/i,
    };
    for (const [ch, re] of Object.entries(expected)) {
      const gloss = lookupChar(ch)?.gloss ?? '';
      expect({ ch, gloss, ok: re.test(gloss) }).toEqual({ ch, gloss, ok: true });
    }
  });

  it('marks characters with no usable meaning as unteachable', () => {
    const artefact = /^(surname|variant of|old variant|used in|see |abbr)/i;
    const wrong = CHARS.filter((c) => c.teachable && artefact.test(c.gloss));
    expect(wrong.map((c) => `${c.c}="${c.gloss}"`)).toEqual([]);
  });

  it('keeps glosses short enough to read on a phone', () => {
    const tooLong = CHARS.filter((c) => c.gloss.length > 50);
    expect(tooLong.map((c) => c.c)).toEqual([]);
  });
});

describe('recognition items are answerable and have one right answer', () => {
  const sample = CHARS.slice(0, 400);

  it('never keys an item on a dictionary artefact', () => {
    const artefact = /^(surname|variant of|old variant|used in|see |abbr)/i;
    for (const entry of sample) {
      const item = charRecogniseItem(entry);
      if (!item) continue;
      const key = item.payload.options!.find((o) => o.id === 'k')!.en!;
      expect({ c: entry.c, key, ok: !artefact.test(key) }).toEqual({ c: entry.c, key, ok: true });
    }
  });

  it('never offers a distractor that is also a meaning of the target', () => {
    // Parenthetical qualifiers come off first. 水 is glossed
    // "water; (after a name) ... River"; leaving the qualifier in made that
    // sense read as containing the word "name", which then collided with a
    // perfectly good distractor "name" and failed a correct item.
    const norm = (x: string) =>
      x
        .toLowerCase()
        .replace(/\([^)]*\)?/g, ' ')
        .replace(/^to\s+/, '')
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    for (const entry of sample) {
      const item = charRecogniseItem(entry);
      if (!item) continue;
      const opts = item.payload.options!;
      const senses = entry.gloss.split(/[;,]/).map((s) => norm(s)).filter(Boolean);
      for (const o of opts.filter((x) => x.id !== 'k')) {
        const d = norm(o.en ?? '');
        const clash = senses.some((s) => s === d || (s.length > 3 && d.length > 3 && (s.includes(d) || d.includes(s))));
        expect({ c: entry.c, distractor: o.en, clash }).toEqual({ c: entry.c, distractor: o.en, clash: false });
      }
    }
  });

  // Repeated, because distractors are drawn at random. A duplicate pair turned
  // up in roughly one item per thousand, so a single pass over the sample missed
  // it nine times out of ten and the failure looked like flake rather than a bug.
  it('always offers exactly four distinct options', () => {
    for (let pass = 0; pass < 10; pass++) {
      for (const entry of sample) {
        const item = charRecogniseItem(entry);
        if (!item) continue;
        const ens = item.payload.options!.map((o) => o.en);
        expect({ c: entry.c, n: ens.length, distinct: new Set(ens).size }).toEqual({
          c: entry.c,
          n: 4,
          distinct: 4,
        });
      }
    }
  });
});

describe('helpers', () => {
  it('returns unique hanzi in first-appearance order', () => {
    expect(uniqueHanzi('我我你你他, ok!')).toEqual(['我', '你', '他']);
  });

  it('looks up a character entry', () => {
    const e = lookupChar('学');
    expect(e).toBeDefined();
    expect(e!.band).toBeLessThanOrEqual(2);
  });
});
