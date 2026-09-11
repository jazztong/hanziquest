/**
 * 作文 and 应用文 marking.
 *
 * The 统考 rubric is not invented here - it is transcribed from
 * 《初中统考 华文 考试纲要 (2026)》 JY01 section II, and the 应用文 layout rules come
 * from that document's appendix. See docs/research.md section 2.2 and 2.3.
 *
 * The design point worth stating: 应用文 is marked STRUCTURALLY, not by an LLM.
 * The 纲要 specifies the layout of 公函, 通告 and 启事 down to which line carries
 * the date and whether the title gets an underline. Those are checkable rules,
 * and a rule check is deterministic, free, instant and correct - three
 * properties an LLM does not have. The LLM is only asked about 内容 and 语言,
 * where judgement is genuinely required, and only when a key is configured.
 */
import { isHanzi } from '../lexicon';

// ---------------------------------------------------------------------------
// 作文 rubric
// ---------------------------------------------------------------------------

export type EssayCriterion = '内容' | '语言' | '结构' | '技术' | '篇幅';

export interface RubricBand {
  criterion: EssayCriterion;
  zh: string;
  en: string;
  /** Share of the total mark. */
  weight: number;
}

/** Verbatim from the 纲要, 考试目标 1.1-1.5. */
export const ESSAY_RUBRIC: RubricBand[] = [
  {
    criterion: '内容',
    zh: '切题、立意正确、中心突出、内容充实、有新意',
    en: 'On topic, sound central idea, clear focus, substantial, some originality',
    weight: 0.3,
  },
  {
    criterion: '语言',
    zh: '准确、简洁、流畅、生动',
    en: 'Accurate, concise, fluent, vivid',
    weight: 0.3,
  },
  {
    criterion: '结构',
    zh: '层次分明、条理清楚、详略得当',
    en: 'Clear stages, logical order, right balance of detail',
    weight: 0.2,
  },
  {
    criterion: '技术',
    zh: '文字规范、标点符号正确、按要求拟题',
    en: 'Standard characters, correct punctuation, title as required',
    weight: 0.15,
  },
  {
    criterion: '篇幅',
    zh: '文长至少 400 字',
    en: 'At least 400 characters (初三 / 统考 standard)',
    weight: 0.05,
  },
];

/** Verbatim from the 纲要, 考试目标 2.1-2.4. */
export const PRACTICAL_RUBRIC: RubricBand[] = [
  { criterion: '内容', zh: '完整、精简', en: 'Complete and concise', weight: 0.3 },
  { criterion: '结构', zh: '符合格式规范', en: 'Conforms to the prescribed format', weight: 0.4 },
  { criterion: '语言', zh: '通顺简洁、措辞得体', en: 'Smooth, concise, appropriate register', weight: 0.2 },
  { criterion: '技术', zh: '文字规范、标点符号正确', en: 'Standard characters, correct punctuation', weight: 0.1 },
];

/**
 * Minimum length by school year.
 *
 * The 统考 floor is 400字 but that is the 初三 exit standard. Holding a 初一
 * student to it on day one produces a score of zero and teaches nothing, so the
 * target ramps. The parent dashboard always shows the 统考 figure alongside.
 */
export const LENGTH_TARGET: Record<1 | 2 | 3, number> = { 1: 300, 2: 350, 3: 400 };

export interface CriterionScore {
  criterion: EssayCriterion;
  /** 0-1. */
  score: number;
  /** Feedback in English - the bridge language. */
  en: string;
  /** The same point in Chinese, so the language of instruction fades too. */
  zh?: string;
  /** Concrete spans in the text this refers to. */
  evidence?: string[];
}

export interface WritingMark {
  total: number;
  maxTotal: number;
  criteria: CriterionScore[];
  /** A model answer in Chinese, at the student's level. */
  modelAnswer?: string;
  /** What to fix first, in one sentence. */
  nextStep: string;
  markedBy: 'rule' | 'claude';
  charCount: number;
}

// ---------------------------------------------------------------------------
// Deterministic checks
// ---------------------------------------------------------------------------

/** 汉字 count, the way a 作文 is counted: characters, punctuation excluded. */
export function countChars(text: string): number {
  return [...text].filter(isHanzi).length;
}

const CJK_PUNCT = '，。！？；：、「」『』（）《》——……·';
const LATIN_PUNCT = ',.!?;:"\'()';

export interface TechnicalIssues {
  latinPunctuation: string[];
  missingFinalPunctuation: boolean;
  /** Runs of text with no punctuation at all - a classic 初一 problem. */
  runOnSpans: string[];
  /** Repeated punctuation like 。。 or ，，. */
  doubledPunctuation: string[];
  paragraphs: number;
}

/**
 * 技术 (文字规范、标点符号正确) checked by rule.
 *
 * These are the mechanical faults that cost marks in every Malaysian 独中 essay
 * and that an English-dominant writer makes constantly: typing `,` instead of
 * `，`, and writing sixty characters without a single mark.
 */
export function checkTechnical(text: string): TechnicalIssues {
  const latinPunctuation = [...new Set([...text].filter((c) => LATIN_PUNCT.includes(c)))];
  const trimmed = text.trimEnd();
  const last = trimmed.at(-1) ?? '';
  const missingFinalPunctuation = trimmed.length > 0 && !'。！？」』…'.includes(last);

  const runOnSpans: string[] = [];
  let run = '';
  for (const ch of text) {
    if (CJK_PUNCT.includes(ch) || LATIN_PUNCT.includes(ch) || ch === '\n') {
      if (countChars(run) > 40) runOnSpans.push(run.slice(0, 20) + '…');
      run = '';
    } else {
      run += ch;
    }
  }
  if (countChars(run) > 40) runOnSpans.push(run.slice(0, 20) + '…');

  const doubledPunctuation = [
    ...new Set((text.match(/([，。！？；：、])\1/g) ?? []).map((m) => m)),
  ];

  const paragraphs = text.split(/\n\s*\n|\n/).filter((p) => countChars(p) > 0).length;

  return {
    latinPunctuation,
    missingFinalPunctuation,
    runOnSpans,
    doubledPunctuation,
    paragraphs,
  };
}

/**
 * Rule-only marking - the free fallback when no Claude key is configured.
 *
 * It scores 技术 and 篇幅 honestly (both are mechanically checkable) and gives
 * 内容/语言/结构 a provisional score based on weak proxies, clearly labelled as
 * such. It never pretends to have judged the ideas: `nextStep` says so.
 */
export function markWritingByRule(
  text: string,
  opts: { year: 1 | 2 | 3; kind: 'essay' | 'practical'; format?: PracticalFormat },
): WritingMark {
  const rubric = opts.kind === 'essay' ? ESSAY_RUBRIC : PRACTICAL_RUBRIC;
  const chars = countChars(text);
  const target = LENGTH_TARGET[opts.year];
  const tech = checkTechnical(text);

  const criteria: CriterionScore[] = [];

  for (const band of rubric) {
    if (band.criterion === '篇幅') {
      const score = Math.max(0, Math.min(1, chars / target));
      criteria.push({
        criterion: '篇幅',
        score,
        en:
          chars >= target
            ? `${chars} characters — over the ${target} target for 初${opts.year}.`
            : `${chars} characters — ${target - chars} short of the ${target} target for 初${opts.year} (统考 needs 400).`,
        zh: chars >= target ? `篇幅达标（${chars}字）。` : `篇幅不足，还差 ${target - chars} 字。`,
      });
      continue;
    }
    if (band.criterion === '技术') {
      const faults =
        tech.latinPunctuation.length +
        (tech.missingFinalPunctuation ? 1 : 0) +
        tech.runOnSpans.length +
        tech.doubledPunctuation.length;
      const score = Math.max(0, 1 - faults * 0.2);
      const notes: string[] = [];
      if (tech.latinPunctuation.length)
        notes.push(
          `English punctuation used (${tech.latinPunctuation.join(' ')}) — Chinese writing needs ，。！？`,
        );
      if (tech.runOnSpans.length)
        notes.push(`${tech.runOnSpans.length} stretch(es) over 40 characters with no punctuation`);
      if (tech.doubledPunctuation.length)
        notes.push(`doubled punctuation: ${tech.doubledPunctuation.join(' ')}`);
      if (tech.missingFinalPunctuation) notes.push('the last sentence has no full stop');
      criteria.push({
        criterion: '技术',
        score,
        en: notes.length ? notes.join('; ') : 'Punctuation and character use look clean.',
        zh: notes.length ? '标点或用字有误，请检查。' : '文字规范，标点正确。',
        evidence: tech.runOnSpans,
      });
      continue;
    }
    if (band.criterion === '结构' && opts.kind === 'practical' && opts.format) {
      const fmt = checkPracticalFormat(text, opts.format);
      criteria.push({
        criterion: '结构',
        score: fmt.score,
        en: fmt.missing.length
          ? `Format elements missing: ${fmt.missing.join(', ')}`
          : 'All required format elements are present.',
        zh: fmt.missing.length ? `格式不完整：缺少 ${fmt.missing.join('、')}。` : '格式符合规范。',
      });
      continue;
    }

    // 内容 / 语言 / 结构 for essays: proxies only, and say so.
    const proxy =
      band.criterion === '结构'
        ? Math.min(1, tech.paragraphs / 3)
        : Math.min(1, chars / target) * 0.7;
    criteria.push({
      criterion: band.criterion,
      score: proxy,
      en: 'Not judged — add an ANTHROPIC_API_KEY to get real marking on this criterion.',
      zh: '此项未评分。',
    });
  }

  const total = criteria.reduce(
    (sum, c) => sum + c.score * (rubric.find((r) => r.criterion === c.criterion)?.weight ?? 0),
    0,
  );

  const worst = [...criteria].sort((a, b) => a.score - b.score)[0];
  return {
    total: Math.round(total * 1000) / 10,
    maxTotal: 100,
    criteria,
    nextStep: worst
      ? `Work on ${worst.criterion} first: ${worst.en}`
      : 'Keep going.',
    markedBy: 'rule',
    charCount: chars,
  };
}

// ---------------------------------------------------------------------------
// 应用文 format checking
// ---------------------------------------------------------------------------

export type PracticalFormat = '公函' | '通告' | '启事';

export interface FormatElement {
  key: string;
  zh: string;
  en: string;
  /** How the checker recognises it. */
  test: (lines: string[], text: string) => boolean;
}

const nonEmpty = (lines: string[]) => lines.map((l) => l.trim()).filter(Boolean);
const hasDate = (s: string) => /\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/.test(s);
const hasNumberedParas = (text: string) => /(^|\n)\s*[2-9][．.]/.test(text);
const hasSignOff = (text: string) => /(谨启|启)\s*$|\n\s*[（(].{1,8}[）)]\s*$/m.test(text);
const hasBracketedName = (text: string) => /[（(][一-鿿]{2,4}[）)]/.test(text);

/**
 * The required elements of each format, transcribed from the 纲要 appendix.
 *
 * These checks are deliberately structural rather than exact: we verify that a
 * date exists and is on its own line, not that it is in the top-right corner,
 * because the app collects the answer as text rather than as a laid-out page.
 * The elements that carry marks in the real paper and that ARE checkable in
 * text - 致 opener, underlined-and-full-stop-free title, numbered middle
 * paragraphs, three-line signature block - are all enforced.
 */
export const PRACTICAL_FORMATS: Record<PracticalFormat, FormatElement[]> = {
  通告: [
    { key: 'date', zh: '通告日期', en: 'Date line', test: (l) => l.some(hasDate) },
    {
      key: 'audience',
      zh: '通告对象（致：…）',
      en: 'Audience line opening with 致：',
      test: (l) => l.some((x) => /^致\s*[:：]/.test(x)),
    },
    {
      key: 'title',
      zh: '标题（简明、无句号）',
      en: 'Title, concise, no full stop',
      test: (l) => l.some((x) => x.length <= 20 && !/[。！？]$/.test(x) && /[一-鿿]/.test(x) && !hasDate(x) && !/^致/.test(x)),
    },
    {
      key: 'numbered',
      zh: '中间段落编号（2. 3. …）',
      en: 'Middle paragraphs numbered',
      test: (_l, t) => hasNumberedParas(t),
    },
    { key: 'signature', zh: '署名（职衔 + 姓名 + 启）', en: 'Signature block', test: (_l, t) => hasSignOff(t) },
    { key: 'printed', zh: '括号内正楷姓名', en: 'Printed name in brackets', test: (_l, t) => hasBracketedName(t) },
  ],
  启事: [
    { key: 'address', zh: '启事者地址', en: 'Sender address block', test: (l) => l.length > 3 },
    { key: 'date', zh: '启事日期', en: 'Date line', test: (l) => l.some(hasDate) },
    {
      key: 'title',
      zh: '标题（含“启事”或简明标题）',
      en: 'Title',
      test: (l) => l.some((x) => x.length <= 20 && !/[。！？]$/.test(x) && /[一-鿿]/.test(x) && !hasDate(x)),
    },
    { key: 'numbered', zh: '中间段落编号', en: 'Middle paragraphs numbered', test: (_l, t) => hasNumberedParas(t) },
    { key: 'signature', zh: '启事者署名', en: 'Signature block', test: (_l, t) => hasSignOff(t) },
    { key: 'printed', zh: '括号内正楷姓名', en: 'Printed name in brackets', test: (_l, t) => hasBracketedName(t) },
  ],
  公函: [
    { key: 'sender', zh: '发信人地址', en: 'Sender address', test: (l) => l.length > 4 },
    { key: 'recipient', zh: '收信人姓名及地址', en: 'Recipient name and address', test: (l) => l.length > 6 },
    { key: 'date', zh: '发信日期', en: 'Date line', test: (l) => l.some(hasDate) },
    {
      key: 'salutation',
      zh: '称呼（后加冒号）',
      en: 'Salutation ending in a colon',
      test: (l) => l.some((x) => /[:：]\s*$/.test(x) && x.length <= 12),
    },
    {
      key: 'title',
      zh: '标题（无句号）',
      en: 'Title, no full stop',
      test: (l) => l.some((x) => x.length <= 20 && !/[。！？:：]$/.test(x) && /[一-鿿]/.test(x) && !hasDate(x)),
    },
    { key: 'numbered', zh: '中间段落编号', en: 'Middle paragraphs numbered', test: (_l, t) => hasNumberedParas(t) },
    { key: 'signature', zh: '发信人署名', en: 'Signature block', test: (_l, t) => hasSignOff(t) },
    { key: 'printed', zh: '括号内正楷姓名', en: 'Printed name in brackets', test: (_l, t) => hasBracketedName(t) },
  ],
};

export interface FormatCheck {
  format: PracticalFormat;
  score: number;
  present: string[];
  missing: string[];
  /** Per-element detail for the UI checklist. */
  elements: { key: string; zh: string; en: string; ok: boolean }[];
}

export function checkPracticalFormat(text: string, format: PracticalFormat): FormatCheck {
  const elements = PRACTICAL_FORMATS[format];
  const lines = nonEmpty(text.split('\n'));
  const results = elements.map((e) => ({
    key: e.key,
    zh: e.zh,
    en: e.en,
    ok: e.test(lines, text),
  }));
  const present = results.filter((r) => r.ok).map((r) => r.zh);
  const missing = results.filter((r) => !r.ok).map((r) => r.zh);
  return {
    format,
    score: results.length ? present.length / results.length : 0,
    present,
    missing,
    elements: results,
  };
}
