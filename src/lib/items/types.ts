import type { Skill } from '../skills';

export type ItemType =
  | 'char-recognise' // see a character, pick its meaning
  | 'char-pinyin' // see a character, pick its reading
  | 'listen-char' // hear a syllable, pick the character
  | 'tone-discriminate' // hear a word, pick the tone pattern
  | 'word-meaning' // see a word, pick its meaning
  | 'word-listen' // hear a word, pick it in writing
  | 'read-aloud' // read a line, scored on pronunciation
  | 'comprehension' // passage + question
  | 'cloze' // fill the gap
  | 'handwrite' // write the character on a canvas
  | 'word-class' // 词性
  | 'measure-word' // 量词
  | 'punctuation' // 标点符号
  | 'rhetoric' // 修辞
  | 'phrase-structure' // 短语结构 (初二)
  | 'sentence-repair' // 病句
  | 'clause-type' // 复句类型 (初三)
  | 'polyphone' // 多音字 in context
  | 'recite-cloze' // 默写 gap fill
  | 'writing' // 作文
  | 'practical-writing'; // 应用文

export interface Option {
  id: string;
  zh?: string;
  en?: string;
  pinyin?: string;
}

export interface ItemPayload {
  /** The question stem, in Chinese where the item is testing Chinese. */
  stem: string;
  /** English scaffold. Fades out as the skill level rises. */
  stemEn?: string;
  /** Text to speak for listening items. */
  audioText?: string;
  /** Passage for comprehension items. */
  passage?: string;
  passageTitle?: string;
  options?: Option[];
  /** Character to write, for handwriting items. */
  writeChar?: string;
  /** Word count target for writing items. */
  minChars?: number;
  /** Free-form hint shown on request; costs the "no hint" bonus. */
  hintEn?: string;
}

export interface ItemAnswer {
  /** Option id, or the expected string for open items. */
  correct?: string | string[];
  /** Marking rubric name for open items. */
  rubric?: 'essay' | 'practical' | 'short-answer';
  /** Model answer in Chinese. */
  model?: string;
  /** Why, in English. */
  explainEn?: string;
  explainZh?: string;
  /** Format for 应用文. */
  format?: '公函' | '通告' | '启事';
}

export interface Item {
  id: string;
  type: ItemType;
  skill: Skill;
  band: number;
  year: number;
  /**
   * Clause from the 课程标准 (2016) - what is being TAUGHT, e.g. "1.6.9".
   * This is the 初一/初二/初三 syllabus numbering.
   */
  standardRef?: string;
  /**
   * Clause from the 考试纲要 (2026) - how it is ASSESSED in the 统考, e.g. "3.4.1".
   *
   * Two documents, two numbering systems. Carrying both lets the parent
   * dashboard say "初一 syllabus 1.6.9, examined as 统考 3.4 修辞" - and it was a
   * real bug to conflate them: the curriculum audit could not see that the
   * comprehension items covered 初一 clauses because they carried only 统考 refs.
   */
  examRef?: string;
  payload: ItemPayload;
  answer: ItemAnswer;
  source: 'seed' | 'claude' | 'lesson';
  prompt?: string;
  /** Error-log tags applied when this item is answered wrongly. */
  tags: string[];
}

/** Items whose answer is a single option id and can be marked instantly. */
export const AUTO_MARKED: ItemType[] = [
  'char-recognise',
  'char-pinyin',
  'listen-char',
  'tone-discriminate',
  'word-meaning',
  'word-listen',
  'comprehension',
  'cloze',
  'word-class',
  'measure-word',
  'punctuation',
  'rhetoric',
  'phrase-structure',
  'sentence-repair',
  'clause-type',
  'polyphone',
];

export function isAutoMarked(t: ItemType): boolean {
  return AUTO_MARKED.includes(t);
}
