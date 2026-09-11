import { describe, it, expect } from 'vitest';
import {
  countChars,
  checkTechnical,
  checkPracticalFormat,
  markWritingByRule,
  ESSAY_RUBRIC,
  PRACTICAL_RUBRIC,
  LENGTH_TARGET,
} from '@/lib/scoring/writing';
import { scoreTranscript, weakestTones } from '@/lib/scoring/pronunciation';

describe('作文 rubric', () => {
  it('matches the five criteria in the 统考 考试纲要', () => {
    expect(ESSAY_RUBRIC.map((r) => r.criterion)).toEqual([
      '内容',
      '语言',
      '结构',
      '技术',
      '篇幅',
    ]);
  });

  it('weights sum to 1', () => {
    const sum = (r: typeof ESSAY_RUBRIC) => r.reduce((a, b) => a + b.weight, 0);
    expect(sum(ESSAY_RUBRIC)).toBeCloseTo(1, 5);
    expect(sum(PRACTICAL_RUBRIC)).toBeCloseTo(1, 5);
  });

  it('holds 初三 to the 统考 400字 floor and scales back for 初一', () => {
    expect(LENGTH_TARGET[3]).toBe(400);
    expect(LENGTH_TARGET[1]).toBeLessThan(LENGTH_TARGET[3]);
  });
});

describe('character counting', () => {
  it('counts 汉字 only', () => {
    expect(countChars('我们去了学校。')).toBe(6);
    expect(countChars('abc 123 ，。！')).toBe(0);
  });
});

describe('技术 checks', () => {
  it('catches English punctuation in Chinese writing', () => {
    const t = checkTechnical('我去了学校, 然后回家.');
    expect(t.latinPunctuation).toContain(',');
    expect(t.latinPunctuation).toContain('.');
  });

  it('passes clean Chinese punctuation', () => {
    const t = checkTechnical('我去了学校，然后回家。');
    expect(t.latinPunctuation).toEqual([]);
    expect(t.missingFinalPunctuation).toBe(false);
  });

  it('flags a run of text with no punctuation', () => {
    const t = checkTechnical('我'.repeat(60) + '。');
    expect(t.runOnSpans.length).toBe(1);
  });

  it('flags a missing final full stop', () => {
    expect(checkTechnical('我去了学校').missingFinalPunctuation).toBe(true);
  });

  it('flags doubled punctuation', () => {
    expect(checkTechnical('我去了学校。。').doubledPunctuation).toContain('。。');
  });
});

describe('应用文 format checking', () => {
  const 通告 = [
    '2026年3月5日',
    '',
    '致：全体师生',
    '',
    '新书上架通告',
    '',
    '为了丰富图书馆藏书，本馆近期添购了新书两百余册。',
    '',
    '2. 所有新书均已上架供馆内阅读或外借。',
    '',
    '欢迎全校师生踊跃到图书馆来。',
    '',
    '',
    '图书馆主任',
    '李志强 启',
    '（李志强）',
  ].join('\n');

  it('accepts a correctly formatted 通告', () => {
    const r = checkPracticalFormat(通告, '通告');
    expect(r.missing).toEqual([]);
    expect(r.score).toBe(1);
  });

  it('notices a missing 致： line', () => {
    const r = checkPracticalFormat(通告.replace('致：全体师生', '全体师生'), '通告');
    expect(r.missing.join('')).toContain('通告对象');
    expect(r.score).toBeLessThan(1);
  });

  it('notices a missing date', () => {
    const r = checkPracticalFormat(通告.replace('2026年3月5日', ''), '通告');
    expect(r.missing.join('')).toContain('日期');
  });

  it('notices unnumbered middle paragraphs', () => {
    const r = checkPracticalFormat(通告.replace('2. 所有新书', '所有新书'), '通告');
    expect(r.missing.join('')).toContain('编号');
  });

  it('knows all three examinable formats and nothing else', () => {
    for (const f of ['公函', '通告', '启事'] as const) {
      expect(checkPracticalFormat('x', f).elements.length).toBeGreaterThan(3);
    }
  });

  it('requires a salutation with a colon in a 公函', () => {
    const 公函 = [
      '仁爱中学',
      '5, Jalan Bukit,',
      '43000 Kajang.',
      '',
      '方思明先生',
      '马来西亚书法协会会长',
      'No 6, Jalan 4,',
      'Taman Bukit Mewah,',
      '43000 Kajang.',
      '2026年1月15日',
      '',
      '方会长：',
      '',
      '请担任挥春比赛评审',
      '',
      '本校将举办一场挥春比赛，借此发扬中华文化。',
      '',
      '2. 比赛将于二月八日进行。',
      '',
      '敬请早日回复，谢谢。',
      '',
      '',
      '联课活动处主任',
      '李志强 启',
      '（李志强）',
    ].join('\n');
    expect(checkPracticalFormat(公函, '公函').missing).toEqual([]);
    expect(checkPracticalFormat(公函.replace('方会长：', '方会长'), '公函').missing.join('')).toContain(
      '称呼',
    );
  });
});

describe('rule-only marking', () => {
  it('scores 篇幅 honestly against the year target', () => {
    const short = markWritingByRule('我去了学校。', { year: 1, kind: 'essay' });
    const long = markWritingByRule('我'.repeat(400) + '。', { year: 1, kind: 'essay' });
    const shortLen = short.criteria.find((c) => c.criterion === '篇幅')!;
    const longLen = long.criteria.find((c) => c.criterion === '篇幅')!;
    expect(shortLen.score).toBeLessThan(longLen.score);
    expect(longLen.score).toBe(1);
  });

  it('does not pretend to have judged 内容 without a key', () => {
    const m = markWritingByRule('我去了学校。', { year: 1, kind: 'essay' });
    const content = m.criteria.find((c) => c.criterion === '内容')!;
    expect(content.en).toMatch(/not judged/i);
    expect(m.markedBy).toBe('rule');
  });

  it('penalises English punctuation under 技术', () => {
    const clean = markWritingByRule('我去了学校，然后回家。', { year: 1, kind: 'essay' });
    const dirty = markWritingByRule('我去了学校, 然后回家.', { year: 1, kind: 'essay' });
    const t = (m: typeof clean) => m.criteria.find((c) => c.criterion === '技术')!.score;
    expect(t(dirty)).toBeLessThan(t(clean));
  });

  it('marks 应用文 structure deterministically from the format', () => {
    const m = markWritingByRule('致：全体师生\n\n通知\n\n内容。', {
      year: 2,
      kind: 'practical',
      format: '通告',
    });
    const structure = m.criteria.find((c) => c.criterion === '结构')!;
    expect(structure.en).toMatch(/missing|present/i);
    expect(structure.score).toBeGreaterThan(0);
    expect(structure.score).toBeLessThan(1);
  });
});

describe('pronunciation scoring from a transcript', () => {
  it('gives full marks for an exact match', () => {
    const s = scoreTranscript('我去学校', '我去学校');
    expect(s.overall).toBe(1);
    expect(s.accuracy).toBe(1);
  });

  it('scores zero-ish for nothing said', () => {
    const s = scoreTranscript('我去学校', '');
    expect(s.overall).toBeLessThan(0.2);
    expect(s.completeness).toBe(0);
  });

  it('treats a same-syllable substitution as a tone slip, not a miss', () => {
    // 买 mǎi vs 卖 mài - same syllable, different tone.
    const tone = scoreTranscript('我买书', '我卖书');
    const wrong = scoreTranscript('我买书', '我跑书');
    expect(tone.toneErrors.length).toBeGreaterThan(0);
    expect(tone.accuracy).toBeGreaterThan(wrong.accuracy);
  });

  it('survives a dropped character without zeroing everything after it', () => {
    const s = scoreTranscript('我今天去学校', '我今去学校');
    expect(s.accuracy).toBeGreaterThan(0.7);
  });

  it('always says the fallback is a fallback', () => {
    expect(scoreTranscript('我', '我').caveat).toBeTruthy();
    expect(scoreTranscript('我', '我').backend).toBe('webspeech');
  });

  it('ranks tone confusions by frequency', () => {
    const ranked = weakestTones(['2v3', '2v3', '1v4']);
    expect(ranked[0]).toEqual({ pair: '2v3', count: 2 });
  });
});
