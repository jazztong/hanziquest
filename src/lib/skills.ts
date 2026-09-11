/**
 * The eight assessed skills, and what "100% of the 初一 target" means for each.
 *
 * The targets come from docs/research.md:
 *  - recognition: the SJKC exit expectation a 初一 textbook assumes (~2,500 chars).
 *  - comprehension: the 统考 passage lengths, scaled back for 初一.
 *  - writing: 初一 essays run ~300字; the 统考 floor of 400字 is the 初三 target.
 *  - languageKnowledge: the count of distinct 课程标准 clauses under 1.6.
 */

export const SKILLS = [
  'recognition',
  'pinyinTone',
  'vocabulary',
  'readAloud',
  'comprehension',
  'handwriting',
  'languageKnowledge',
  'writing',
] as const;

export type Skill = (typeof SKILLS)[number];

export interface SkillSpec {
  id: Skill;
  zh: string;
  en: string;
  /** One line the player sees on the radar. */
  blurb: string;
  /** What full marks against the 初一 standard looks like. */
  year1Target: string;
  /** Which 统考 component this skill feeds, for the parent view. */
  uecComponent: string;
  /** Weight when computing the single headline "初一 readiness" number. */
  weight: number;
}

/**
 * Weights are deliberately not equal.
 *
 * recognition is weighted highest because docs/research.md section 4.3 identifies
 * it as the binding constraint: every other skill is capped by it. writing and
 * comprehension follow because between them they are 60% of the 统考 paper.
 * handwriting is weighted lowest - it matters for 错别字 marks but a weak
 * handwriting score never blocks progress through the campaign.
 */
export const SKILL_SPECS: Record<Skill, SkillSpec> = {
  recognition: {
    id: 'recognition',
    zh: '识字',
    en: 'Character recognition',
    blurb: 'How many characters you can read on sight.',
    year1Target: '2,500 characters recognised (the SJKC exit level 初一 assumes)',
    uecComponent: 'Underlies every section',
    weight: 0.22,
  },
  pinyinTone: {
    id: 'pinyinTone',
    zh: '拼音声调',
    en: 'Pinyin & tones',
    blurb: 'Hearing and producing the right tone.',
    year1Target: '声韵调 secure; 一/不/啊 变调 and 上声连读 applied correctly',
    uecComponent: '试卷二 甲组 语文基础知识 3.1',
    weight: 0.1,
  },
  vocabulary: {
    id: 'vocabulary',
    zh: '词语',
    en: 'Vocabulary',
    blurb: 'Words you know by ear and by eye.',
    year1Target: 'HSK 3.0 band 4 (~3,200 words) plus 初一 成语与格言',
    uecComponent: '试卷二 甲组 3.2 词语',
    weight: 0.13,
  },
  readAloud: {
    id: 'readAloud',
    zh: '朗读',
    en: 'Reading aloud',
    blurb: 'Reading a passage out loud, fluently and in tune.',
    year1Target: '朗读诗文 at ~150 字/分钟 with correct tones',
    uecComponent: 'Not directly examined; feeds 语音 and 默写',
    weight: 0.1,
  },
  comprehension: {
    id: 'comprehension',
    zh: '阅读理解',
    en: 'Reading comprehension',
    blurb: 'Understanding what you read, not just decoding it.',
    year1Target: '500–600字 记叙文 unaided; 段意 and 中心思想',
    uecComponent: '试卷二 乙组 现代文阅读 (30%)',
    weight: 0.17,
  },
  handwriting: {
    id: 'handwriting',
    zh: '书写',
    en: 'Handwriting',
    blurb: 'Writing characters with the right strokes, in the right order.',
    year1Target: 'Top 800 characters written correctly from memory',
    uecComponent: '技术: 文字规范 (作文 and 应用文)',
    weight: 0.06,
  },
  languageKnowledge: {
    id: 'languageKnowledge',
    zh: '语文基础知识',
    en: 'Language knowledge',
    blurb: 'Word classes, punctuation, phrases, rhetoric, sentence repair.',
    year1Target: '课程标准 1.6.1–1.6.9 (词性, 标点15, 修辞5, 多音字, 一词多义)',
    uecComponent: '试卷二 甲组 (15%)',
    weight: 0.12,
  },
  writing: {
    id: 'writing',
    zh: '写作',
    en: 'Writing',
    blurb: 'Building a piece that says something, in order, in good Chinese.',
    year1Target: '300字 记叙文 with 提纲; 书信/便条 format correct',
    uecComponent: '试卷一 (40%)',
    weight: 0.1,
  },
};

export const SKILL_LIST: SkillSpec[] = SKILLS.map((s) => SKILL_SPECS[s]);

/** Weighted headline readiness, 0-100. */
export function overallReadiness(
  percentBySkill: Partial<Record<Skill, number>>,
): number {
  let total = 0;
  let weight = 0;
  for (const s of SKILLS) {
    const p = percentBySkill[s];
    if (p === undefined) continue;
    total += p * SKILL_SPECS[s].weight;
    weight += SKILL_SPECS[s].weight;
  }
  return weight === 0 ? 0 : Math.round((total / weight) * 10) / 10;
}

/**
 * Maps an HSK 3.0 band to a rough % of the 初一 recognition target.
 *
 * Band -> cumulative characters: 1:300 2:600 3:900 4:1200 5:1500 6:1800 7:3000.
 * The 初一 target is 2,500, so band 6 is ~72% and band 7 overshoots. Fractional
 * bands interpolate, which is what makes the radar move week to week instead of
 * jumping once a quarter.
 */
const BAND_CHARS = [0, 300, 600, 900, 1200, 1500, 1800, 3000];
export const YEAR1_CHAR_TARGET = 2500;

export function bandToChars(band: number): number {
  const lo = Math.floor(band);
  const hi = Math.min(lo + 1, 7);
  const frac = band - lo;
  const a = BAND_CHARS[Math.max(0, Math.min(lo, 7))] ?? 0;
  const b = BAND_CHARS[hi] ?? 3000;
  return Math.round(a + (b - a) * frac);
}

export function charsToBand(chars: number): number {
  for (let i = 1; i < BAND_CHARS.length; i++) {
    if (chars <= BAND_CHARS[i]) {
      const a = BAND_CHARS[i - 1];
      const b = BAND_CHARS[i];
      return i - 1 + (chars - a) / (b - a);
    }
  }
  return 7;
}
