/**
 * The 初一 curriculum, as data.
 *
 * Transcribed from 《马来西亚华文独立中学 初中华文课程标准》(董教总, 2016年5月),
 * section 四·课程内容·1. 初中一, clauses 1.1 through 1.6.9. This is a published
 * curriculum specification - the factual scope of what is taught - and it is
 * what everything the app serves is checked against.
 *
 * Why it exists as data rather than prose in a doc: the app has to be able to
 * answer "is this item on the 初一 syllabus, and which part?" mechanically.
 * scripts/curriculum-audit.ts reports coverage against it, so a gap in the item
 * bank is visible instead of theoretical.
 *
 * Deliberately 初一 ONLY. 短语结构 and 说明文 are 初二 (2.6.6, 2.3.1); 复句,
 * 句子成分 and 议论文 are 初三 (3.6.1, 3.6.2, 3.3.1). Serving those to him now
 * would be teaching next year's syllabus before this year's.
 */

export type Strand =
  | 'listening-speaking'
  | 'reading'
  | 'writing'
  | 'thinking'
  | 'literature-culture'
  | 'language-knowledge';

export interface Clause {
  /** Clause number exactly as printed in the standard, e.g. "1.6.9". */
  ref: string;
  strand: Strand;
  zh: string;
  en: string;
  /** Sub-topics that each deserve their own items, where the clause enumerates them. */
  topics?: { key: string; zh: string; en: string }[];
  /** Whether the app is expected to assess this directly. */
  assessable: boolean;
  /** Why, when it is not. */
  note?: string;
}

export const YEAR1: Clause[] = [
  // --- 1.1 聆听与说话 -----------------------------------------------------
  { ref: '1.1.1', strand: 'listening-speaking', zh: '通过聆听，辨别读音。', en: 'Discriminate pronunciation by ear.', assessable: true },
  { ref: '1.1.2', strand: 'listening-speaking', zh: '通过聆听，辨别语调。', en: 'Discriminate intonation by ear.', assessable: true },
  { ref: '1.1.3', strand: 'listening-speaking', zh: '通过聆听，理解对话、提问、指示、故事、诗文等内容。', en: 'Understand dialogue, questions, instructions, stories and verse by ear.', assessable: true },
  { ref: '1.1.4', strand: 'listening-speaking', zh: '进行提问、回答问题、给予指示、提出要求、表达意见等活动。', en: 'Ask, answer, instruct, request and give opinions.', assessable: true },
  { ref: '1.1.5', strand: 'listening-speaking', zh: '学习复述听讲内容。', en: 'Retell what was heard.', assessable: false, note: 'Needs open-ended speech marking; deferred.' },
  { ref: '1.1.6', strand: 'listening-speaking', zh: '练习自我介绍、交谈、讲述故事、朗读诗文、念绕口令、说明游戏规则。', en: 'Self-introduction, conversation, storytelling, reading verse aloud, tongue-twisters, explaining rules.', assessable: true },

  // --- 1.2 阅读 ------------------------------------------------------------
  { ref: '1.2.1', strand: 'reading', zh: '略读或精读各类文章，体会作者的情思。', en: 'Skim or read closely; sense the writer’s feeling.', assessable: true },
  { ref: '1.2.2', strand: 'reading', zh: '归纳段意，把握文章的中心思想。', en: 'Summarise paragraphs; grasp the central idea.', assessable: true },
  {
    ref: '1.2.3',
    strand: 'reading',
    zh: '通过阅读记叙文，了解记叙的要素，把握记叙的顺序。',
    en: 'In 记叙文: the six elements, and narrative order.',
    assessable: true,
    topics: [
      { key: '记叙要素', zh: '人物、时间、地点、起因、经过、结果', en: 'Who, when, where, cause, course, result' },
      { key: '顺叙', zh: '顺叙', en: 'Chronological order' },
      { key: '倒叙', zh: '倒叙', en: 'Flashback opening' },
      { key: '插叙', zh: '插叙', en: 'Inserted episode' },
    ],
  },
  { ref: '1.2.4', strand: 'reading', zh: '通过阅读现代文学作品，理解其体裁、内容及中心思想。', en: 'Modern literary works: genre, content, central idea.', assessable: true },
  { ref: '1.2.5', strand: 'reading', zh: '通过阅读古代诗文，理解其内容与中心思想，并能背诵其中的名篇。', en: 'Classical verse: meaning, central idea, and recitation of set pieces.', assessable: true },
  { ref: '1.2.6', strand: 'reading', zh: '使用工具书辅助阅读。', en: 'Use reference works while reading.', assessable: true },

  // --- 1.3 写作 ------------------------------------------------------------
  {
    ref: '1.3.1',
    strand: 'writing',
    zh: '习写记叙文、日记、周记、阅读报告、应用文（书信、便条）。',
    en: 'Write 记叙文, diary, weekly journal, reading report, and 应用文 (letter, note).',
    assessable: true,
    topics: [
      { key: '记叙文', zh: '记叙文', en: 'Narrative' },
      { key: '日记', zh: '日记', en: 'Diary entry' },
      { key: '周记', zh: '周记', en: 'Weekly journal' },
      { key: '阅读报告', zh: '阅读报告', en: 'Reading report' },
      { key: '书信', zh: '书信', en: 'Personal letter' },
      { key: '便条', zh: '便条', en: 'Short note' },
    ],
  },
  { ref: '1.3.2', strand: 'writing', zh: '了解应用文的写作要点（格式正确、行文简洁、措辞得体）。', en: '应用文 essentials: correct format, concise, appropriate register.', assessable: true },
  { ref: '1.3.3', strand: 'writing', zh: '学习审题的要领。', en: 'Reading the question before writing.', assessable: true },
  { ref: '1.3.4', strand: 'writing', zh: '学习编写提纲。', en: 'Build an outline.', assessable: true },
  { ref: '1.3.5', strand: 'writing', zh: '学习提炼文章的中心思想。', en: 'Distil a central idea.', assessable: true },
  { ref: '1.3.6', strand: 'writing', zh: '清楚交代记叙的要素。', en: 'State the narrative elements clearly.', assessable: true },
  { ref: '1.3.7', strand: 'writing', zh: '视情况选用不同的记事顺序（顺叙、倒叙、插叙）。', en: 'Choose a narrative order to suit the piece.', assessable: true },
  { ref: '1.3.8', strand: 'writing', zh: '通过写作表达真情实感。', en: 'Write from real feeling.', assessable: false, note: 'Judged in 作文 feedback, not as an item.' },
  { ref: '1.3.9', strand: 'writing', zh: '养成观察的习惯，积累写作素材。', en: 'Build the habit of observing; gather material.', assessable: false, note: 'A habit, not a testable point.' },
  { ref: '1.3.10', strand: 'writing', zh: '学习续写。', en: 'Continue a given opening.', assessable: true },

  // --- 1.4 思维 ------------------------------------------------------------
  { ref: '1.4.1', strand: 'thinking', zh: '学习听说读写的思维方法（概括、比较）。', en: 'Summarising and comparing.', assessable: true },
  { ref: '1.4.2', strand: 'thinking', zh: '学习深入思考，准确表达。', en: 'Think it through; say it precisely.', assessable: false, note: 'Cuts across everything rather than sitting in one item.' },

  // --- 1.5 文学与文化 ------------------------------------------------------
  { ref: '1.5.1', strand: 'literature-culture', zh: '了解现代散文的特点。', en: 'Features of the modern essay.', assessable: true },
  { ref: '1.5.2', strand: 'literature-culture', zh: '了解民间故事、寓言和神话的特点。', en: 'Features of folk tale, fable and myth.', assessable: true },
  { ref: '1.5.3', strand: 'literature-culture', zh: '了解古代诗文的特点。', en: 'Features of classical verse and prose.', assessable: true },
  { ref: '1.5.4', strand: 'literature-culture', zh: '认识与课文相关的作者和作品。', en: 'Authors and works behind the lessons.', assessable: true },
  { ref: '1.5.5', strand: 'literature-culture', zh: '学习与课文相关的文化知识（天文、服饰、饮食、节庆、建筑、童玩）。', en: 'Cultural knowledge around the lessons.', assessable: true },

  // --- 1.6 语文基础知识 ----------------------------------------------------
  { ref: '1.6.1', strand: 'language-knowledge', zh: '认识规范的汉字字形。', en: 'Standard character forms (错别字).', assessable: true },
  {
    ref: '1.6.2',
    strand: 'language-knowledge',
    zh: '了解华语的声韵调知识（声母、韵母、声调）。',
    en: 'Initials, finals and tones.',
    assessable: true,
    topics: [
      { key: '声母', zh: '声母', en: 'Initials' },
      { key: '韵母', zh: '韵母', en: 'Finals' },
      { key: '声调', zh: '声调', en: 'Tones' },
    ],
  },
  {
    ref: '1.6.3',
    strand: 'language-knowledge',
    zh: '了解华语的音变规律（“一”“不”“啊”的变调和上声连读变调）。',
    en: 'Tone sandhi: 一, 不, 啊, and third-tone sandhi.',
    assessable: true,
    topics: [
      { key: '一变调', zh: '“一”的变调', en: 'Tone change on 一' },
      { key: '不变调', zh: '“不”的变调', en: 'Tone change on 不' },
      { key: '啊变调', zh: '“啊”的音变', en: 'Sound change on 啊' },
      { key: '上声连读', zh: '上声连读变调', en: 'Third-tone sandhi' },
    ],
  },
  { ref: '1.6.4', strand: 'language-knowledge', zh: '学习多音多义字。', en: 'Characters with several readings and meanings.', assessable: true },
  { ref: '1.6.5', strand: 'language-knowledge', zh: '了解一词多义现象及多义词的应用情况。', en: 'Words with several meanings.', assessable: true },
  { ref: '1.6.6', strand: 'language-knowledge', zh: '学习成语和格言。', en: '成语 and maxims.', assessable: true },
  {
    ref: '1.6.7',
    strand: 'language-knowledge',
    zh: '认识实词（名词、动词、形容词、代词、数词、量词）与虚词（副词、连词、介词、助词、叹词、拟声词）。',
    en: 'Word classes: six 实词 and six 虚词.',
    assessable: true,
    topics: [
      { key: '名词', zh: '名词', en: 'Noun' },
      { key: '动词', zh: '动词', en: 'Verb' },
      { key: '形容词', zh: '形容词', en: 'Adjective' },
      { key: '代词', zh: '代词', en: 'Pronoun' },
      { key: '数词', zh: '数词', en: 'Numeral' },
      { key: '量词', zh: '量词', en: 'Measure word' },
      { key: '副词', zh: '副词', en: 'Adverb' },
      { key: '连词', zh: '连词', en: 'Conjunction' },
      { key: '介词', zh: '介词', en: 'Preposition' },
      { key: '助词', zh: '助词', en: 'Particle' },
      { key: '叹词', zh: '叹词', en: 'Interjection' },
      { key: '拟声词', zh: '拟声词', en: 'Onomatopoeia' },
    ],
  },
  {
    ref: '1.6.8',
    strand: 'language-knowledge',
    zh: '了解标点符号的用法（15种）。',
    en: 'The fifteen punctuation marks.',
    assessable: true,
    topics: [
      { key: '句号', zh: '句号 。', en: 'Full stop' },
      { key: '问号', zh: '问号 ？', en: 'Question mark' },
      { key: '叹号', zh: '叹号 ！', en: 'Exclamation mark' },
      { key: '逗号', zh: '逗号 ，', en: 'Comma' },
      { key: '顿号', zh: '顿号 、', en: 'Enumeration comma' },
      { key: '分号', zh: '分号 ；', en: 'Semicolon' },
      { key: '冒号', zh: '冒号 ：', en: 'Colon' },
      { key: '引号', zh: '引号 “ ”', en: 'Quotation marks' },
      { key: '括号', zh: '括号 （ ）', en: 'Brackets' },
      { key: '书名号', zh: '书名号 《 》', en: 'Title marks' },
      { key: '破折号', zh: '破折号 ——', en: 'Dash' },
      { key: '连接号', zh: '连接号 －', en: 'Hyphen' },
      { key: '省略号', zh: '省略号 ……', en: 'Ellipsis' },
      { key: '间隔号', zh: '间隔号 ·', en: 'Interpunct' },
      { key: '着重号', zh: '着重号', en: 'Emphasis mark' },
    ],
  },
  {
    ref: '1.6.9',
    strand: 'language-knowledge',
    zh: '学习修辞法（比喻、比拟、借代、引用、夸张）。',
    en: 'Five rhetorical devices.',
    assessable: true,
    topics: [
      { key: '比喻', zh: '比喻', en: 'Simile / metaphor' },
      { key: '比拟', zh: '比拟', en: 'Personification' },
      { key: '借代', zh: '借代', en: 'Metonymy' },
      { key: '引用', zh: '引用', en: 'Quotation' },
      { key: '夸张', zh: '夸张', en: 'Hyperbole' },
    ],
  },
];

/** Everything the app is expected to assess directly. */
export const ASSESSABLE = YEAR1.filter((c) => c.assessable);

/** Every tag an item may carry to claim it covers part of the 初一 syllabus. */
export function expectedTags(): string[] {
  const out: string[] = [];
  for (const c of ASSESSABLE) {
    if (c.topics?.length) {
      for (const t of c.topics) out.push(`standard:${c.ref}-${t.key}`);
    } else {
      out.push(`standard:${c.ref}`);
    }
  }
  return out;
}

/**
 * Topics that belong to LATER years and must not be served in 初一.
 * Used as a negative check: an item carrying one of these is out of scope.
 */
export const NOT_YET: { ref: string; zh: string; year: 2 | 3 }[] = [
  { ref: '2.6.6', zh: '短语结构类型', year: 2 },
  { ref: '2.3.1', zh: '说明文写作', year: 2 },
  { ref: '2.6.1', zh: '汉字造字法', year: 2 },
  { ref: '2.6.3', zh: '轻声与儿化', year: 2 },
  { ref: '2.6.5', zh: '谚语和歇后语', year: 2 },
  { ref: '2.6.7', zh: '修辞：回文、顶真、设问、反问', year: 2 },
  { ref: '3.6.1', zh: '句子成分', year: 3 },
  { ref: '3.6.2', zh: '复句类型', year: 3 },
  { ref: '3.3.1', zh: '议论文写作', year: 3 },
  { ref: '3.6.4', zh: '修辞：排比、反复、对偶、对比', year: 3 },
];
