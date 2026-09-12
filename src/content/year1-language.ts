/**
 * 初一 语文基础知识 item bank — 课程标准 clauses 1.6.1 to 1.6.9.
 *
 * All original. Sentences are written for this app; none are taken from a
 * textbook. Malaysian settings where a setting is needed.
 *
 * Two reference numbers per item, because there are two documents:
 *   standardRef  课程标准 (2016) - what is being TAUGHT this year
 *   examRef      考试纲要 (2026) - how it is ASSESSED in the 统考
 * Mixing them was a real bug: the curriculum audit could not see that the
 * comprehension items covered 初一 clauses because they were tagged only with
 * 统考 numbers.
 *
 * Scope discipline: 初一 only. 短语结构 (2.6.6), 复句 (3.6.2), 句子成分 (3.6.1)
 * and the 初二/初三 修辞 devices are deliberately absent - see
 * src/content/curriculum-year1.ts NOT_YET.
 */
import type { Item } from '@/lib/items/types';

const mk = (i: Omit<Item, 'source'> & { source?: Item['source'] }): Item => ({
  source: 'seed',
  ...i,
});

export const YEAR1_LANGUAGE_ITEMS: Item[] = [
  // =========================================================================
  // 1.6.1 认识规范的汉字字形 — 错别字
  // =========================================================================
  mk({
    id: 'y1-cf-2',
    type: 'cloze',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.1',
    payload: {
      stem: '「我们要爱（　）公物。」应该填哪一个字？',
      stemEn: 'Which character is correct here? (爱＿公物 = to take care of public property)',
      options: [
        { id: 'a', zh: '护' },
        { id: 'b', zh: '户' },
        { id: 'c', zh: '互' },
        { id: 'd', zh: '沪' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '爱护 — 护 has the 扌 (hand) radical, because protecting is something you do. 户 (household), 互 (mutual) and 沪 (Shanghai) all sound similar and are the classic wrong picks.',
      explainZh: '“爱护”的“护”是提手旁，表示动作。“户、互、沪”读音相近，是常见的别字。',
    },
    tags: ['standard:1.6.1', 'char:护'],
  }),
  mk({
    id: 'y1-cf-3',
    type: 'cloze',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.1',
    payload: {
      stem: '「他做事很认（　）。」应该填哪一个字？',
      stemEn: 'Which character is correct? (认＿ = conscientious)',
      options: [
        { id: 'a', zh: '真' },
        { id: 'b', zh: '针' },
        { id: 'c', zh: '珍' },
        { id: 'd', zh: '斟' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '认真. All four are read zhēn, which is exactly why this one is missed. 针 is a needle, 珍 is precious, 斟 is to pour.',
      explainZh: '“认真”。四个字都读 zhēn，所以容易写错。',
    },
    tags: ['standard:1.6.1', 'char:真'],
  }),

  // =========================================================================
  // 1.6.3 音变规律 — 一 / 不 / 啊 / 上声连读
  // =========================================================================
  mk({
    id: 'y1-sandhi-yi-1',
    type: 'char-pinyin',
    skill: 'pinyinTone',
    band: 2,
    year: 1,
    standardRef: '1.6.3',
    examRef: '3.1.1',
    payload: {
      stem: '一起',
      stemEn: 'How is 一 read in 一起?',
      audioText: '一起',
      options: [
        { id: 'a', pinyin: 'yì' },
        { id: 'b', pinyin: 'yī' },
        { id: 'c', pinyin: 'yí' },
        { id: 'd', pinyin: 'yǐ' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '一 changes tone depending on what follows. Before a 1st, 2nd or 3rd tone it becomes yì (4th). 起 is 3rd tone, so: yìqǐ.',
      explainZh: '“一”在第一、二、三声前变第四声：一起 yìqǐ。',
    },
    tags: ['standard:1.6.3-一变调', 'tone:sandhi'],
  }),
  mk({
    id: 'y1-sandhi-yi-2',
    type: 'char-pinyin',
    skill: 'pinyinTone',
    band: 2,
    year: 1,
    standardRef: '1.6.3',
    examRef: '3.1.1',
    payload: {
      stem: '一定',
      stemEn: 'How is 一 read in 一定?',
      audioText: '一定',
      options: [
        { id: 'a', pinyin: 'yí' },
        { id: 'b', pinyin: 'yì' },
        { id: 'c', pinyin: 'yī' },
        { id: 'd', pinyin: 'yǐ' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        'Before a 4th tone, 一 becomes yí (2nd). 定 is 4th tone, so: yídìng. Compare 一起 yìqǐ — the rule flips depending on the next syllable.',
      explainZh: '“一”在第四声前变第二声：一定 yídìng。对比“一起 yìqǐ”。',
    },
    tags: ['standard:1.6.3-一变调', 'tone:sandhi'],
  }),
  mk({
    id: 'y1-sandhi-bu-1',
    type: 'char-pinyin',
    skill: 'pinyinTone',
    band: 2,
    year: 1,
    standardRef: '1.6.3',
    examRef: '3.1.1',
    payload: {
      stem: '不是',
      stemEn: 'How is 不 read in 不是?',
      audioText: '不是',
      options: [
        { id: 'a', pinyin: 'bú' },
        { id: 'b', pinyin: 'bù' },
        { id: 'c', pinyin: 'bǔ' },
        { id: 'd', pinyin: 'bū' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '不 is bù normally, but becomes bú before a 4th tone. 是 is 4th tone, so: búshì. Everywhere else it stays bù — 不好 bùhǎo, 不来 bùlái.',
      explainZh: '“不”在第四声前变第二声：不是 búshì；其他情况读 bù。',
    },
    tags: ['standard:1.6.3-不变调', 'tone:sandhi'],
  }),
  mk({
    id: 'y1-sandhi-third-1',
    type: 'char-pinyin',
    skill: 'pinyinTone',
    band: 2,
    year: 1,
    standardRef: '1.6.3',
    examRef: '3.1.1',
    payload: {
      stem: '你好',
      stemEn: 'Two third tones in a row. How is the FIRST one actually said?',
      audioText: '你好',
      options: [
        { id: 'a', pinyin: 'ní (第二声)' },
        { id: 'b', pinyin: 'nǐ (第三声)' },
        { id: 'c', pinyin: 'nì (第四声)' },
        { id: 'd', pinyin: 'nī (第一声)' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        'Third-tone sandhi: when two 3rd tones meet, the first is said as a 2nd tone — níhǎo. It is still WRITTEN nǐ hǎo. This is why your spoken Chinese can sound off even when your pinyin is right.',
      explainZh: '上声连读变调：两个三声相连，前一个读成二声。写作 nǐ hǎo，读作 ní hǎo。',
    },
    tags: ['standard:1.6.3-上声连读', 'tone:sandhi'],
  }),
  mk({
    id: 'y1-sandhi-a-1',
    type: 'cloze',
    skill: 'pinyinTone',
    band: 3,
    year: 1,
    standardRef: '1.6.3',
    examRef: '3.1.1',
    payload: {
      stem: '「你快来（　）！」句末的语气词，读音会受前一个字影响。这叫什么？',
      stemEn: 'The particle 啊 at the end of a sentence changes its sound depending on the syllable before it. What is this called?',
      options: [
        { id: 'a', zh: '音变', en: 'sound change (音变)' },
        { id: 'b', zh: '轻声', en: 'neutral tone' },
        { id: 'c', zh: '儿化', en: 'erhua' },
        { id: 'd', zh: '重音', en: 'stress' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '啊 assimilates to the sound before it: 来啊 → ya, 好啊 → wa, 快啊 → a. 轻声 and 儿化 are real things but they are 初二 topics (2.6.3).',
      explainZh: '“啊”受前字影响而变音，属于音变。轻声和儿化是初二的内容。',
    },
    tags: ['standard:1.6.3-啊变调'],
  }),

  // =========================================================================
  // 1.6.6 成语和格言
  // =========================================================================
  mk({
    id: 'y1-idiom-1',
    type: 'cloze',
    skill: 'vocabulary',
    band: 3,
    year: 1,
    standardRef: '1.6.6',
    examRef: '3.2.1',
    payload: {
      stem: '他做事从来不用心，总是（　）。',
      stemEn: 'Which 成语 fits? (He never puts his mind to anything…)',
      options: [
        { id: 'a', zh: '马马虎虎' },
        { id: 'b', zh: '一心一意' },
        { id: 'c', zh: '全力以赴' },
        { id: 'd', zh: '认真负责' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '马马虎虎 = careless, so-so. The other three all mean the opposite — wholehearted, all-out, conscientious. The sentence says 不用心, so only a negative fits.',
      explainZh: '“马马虎虎”指不认真。句中说“不用心”，只有它合适。',
    },
    tags: ['standard:1.6.6', 'idiom:马马虎虎'],
  }),
  mk({
    id: 'y1-idiom-2',
    type: 'word-meaning',
    skill: 'vocabulary',
    band: 3,
    year: 1,
    standardRef: '1.6.6',
    examRef: '3.2.1',
    payload: {
      stem: '一举两得',
      stemEn: 'What does this 成语 mean?',
      options: [
        { id: 'a', en: 'One action, two benefits — killing two birds with one stone' },
        { id: 'b', en: 'To lift something with both hands' },
        { id: 'c', en: 'To do two things badly at once' },
        { id: 'd', en: 'To win twice in a row' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '一举 = one action; 两得 = two gains. Literally "one move, two gains".',
      explainZh: '“一举”是一个动作，“两得”是两方面的好处。',
    },
    tags: ['standard:1.6.6', 'idiom:一举两得'],
  }),
  mk({
    id: 'y1-maxim-1',
    type: 'cloze',
    skill: 'vocabulary',
    band: 3,
    year: 1,
    standardRef: '1.6.6',
    examRef: '3.2.1',
    payload: {
      stem: '「一年之计在于春，一日之计在于（　）。」',
      stemEn: 'Complete the maxim. (The year’s plan lies in spring; the day’s plan lies in…)',
      options: [
        { id: 'a', zh: '晨' },
        { id: 'b', zh: '夜' },
        { id: 'c', zh: '午' },
        { id: 'd', zh: '昏' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '晨 = early morning. The maxim pairs the start of the year with the start of the day: do the important thing early.',
      explainZh: '“晨”指early morning。格言把一年之始和一日之始相对。',
    },
    tags: ['standard:1.6.6', 'maxim'],
  }),

  // =========================================================================
  // 1.6.7 词性 — the six 实词 and six 虚词
  // =========================================================================
  mk({
    id: 'y1-wc-noun',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '「桌子上有一本书。」句中的「桌子」是什么词？',
      stemEn: 'What word class is 桌子?',
      options: [
        { id: 'a', zh: '名词', en: 'noun' },
        { id: 'b', zh: '动词', en: 'verb' },
        { id: 'c', zh: '量词', en: 'measure word' },
        { id: 'd', zh: '代词', en: 'pronoun' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '桌子 names a thing, so it is 名词. 本 in the same sentence is the 量词.',
      explainZh: '“桌子”表示事物名称，是名词；句中的“本”才是量词。',
    },
    tags: ['standard:1.6.7-名词'],
  }),
  mk({
    id: 'y1-wc-verb',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '「弟弟正在写作业。」句中的「写」是什么词？',
      stemEn: 'What word class is 写?',
      options: [
        { id: 'a', zh: '动词', en: 'verb' },
        { id: 'b', zh: '名词', en: 'noun' },
        { id: 'c', zh: '副词', en: 'adverb' },
        { id: 'd', zh: '介词', en: 'preposition' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '写 is an action, so 动词. 正在 before it is the 副词.',
      explainZh: '“写”表示动作，是动词；前面的“正在”是副词。',
    },
    tags: ['standard:1.6.7-动词'],
  }),
  mk({
    id: 'y1-wc-pronoun',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '下面哪一个是代词？',
      stemEn: 'Which of these is a pronoun (代词)?',
      options: [
        { id: 'a', zh: '他们' },
        { id: 'b', zh: '跑步' },
        { id: 'c', zh: '美丽' },
        { id: 'd', zh: '三个' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '他们 stands in for people, so 代词. 跑步 is 动词, 美丽 is 形容词, 三 is 数词 and 个 is 量词.',
      explainZh: '“他们”代替人，是代词。',
    },
    tags: ['standard:1.6.7-代词'],
  }),
  mk({
    id: 'y1-wc-numeral',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '「他买了五支笔。」句中的「五」和「支」分别是什么词？',
      stemEn: 'What are 五 and 支 in this sentence?',
      options: [
        { id: 'a', zh: '数词、量词', en: 'numeral, measure word' },
        { id: 'b', zh: '量词、数词', en: 'measure word, numeral' },
        { id: 'c', zh: '名词、量词', en: 'noun, measure word' },
        { id: 'd', zh: '数词、名词', en: 'numeral, noun' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '五 is the number (数词), 支 is the measure word (量词). They always come in that order in Chinese: 数词 + 量词 + 名词.',
      explainZh: '数词在前，量词在后：五（数词）＋支（量词）＋笔（名词）。',
    },
    tags: ['standard:1.6.7-数词', 'standard:1.6.7-量词'],
  }),
  mk({
    id: 'y1-wc-adverb',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '「他非常喜欢画画。」句中的「非常」是什么词？',
      stemEn: 'What word class is 非常?',
      options: [
        { id: 'a', zh: '副词', en: 'adverb' },
        { id: 'b', zh: '形容词', en: 'adjective' },
        { id: 'c', zh: '连词', en: 'conjunction' },
        { id: 'd', zh: '助词', en: 'particle' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '非常 modifies the verb 喜欢, telling you how much. Words that modify verbs or adjectives are 副词 — 很, 也, 都, 就, 非常.',
      explainZh: '“非常”修饰动词“喜欢”，是副词。',
    },
    tags: ['standard:1.6.7-副词'],
  }),
  mk({
    id: 'y1-wc-conj',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '「我和弟弟一起去图书馆。」句中的「和」是什么词？',
      stemEn: 'What word class is 和 here?',
      options: [
        { id: 'a', zh: '连词', en: 'conjunction' },
        { id: 'b', zh: '介词', en: 'preposition' },
        { id: 'c', zh: '助词', en: 'particle' },
        { id: 'd', zh: '副词', en: 'adverb' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '和 joins 我 and 弟弟, two things of equal weight — that is 连词. Careful: 和 can also be a 介词 in other sentences, which is exactly why word class is tested in context.',
      explainZh: '“和”连接“我”和“弟弟”，是连词。（“和”在别的句子里也可以是介词。）',
    },
    tags: ['standard:1.6.7-连词'],
  }),
  mk({
    id: 'y1-wc-prep',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '「他在教室里做功课。」句中的「在」是什么词？',
      stemEn: 'What word class is 在 here?',
      options: [
        { id: 'a', zh: '介词', en: 'preposition' },
        { id: 'b', zh: '动词', en: 'verb' },
        { id: 'c', zh: '副词', en: 'adverb' },
        { id: 'd', zh: '连词', en: 'conjunction' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        'Here 在 introduces where the action happens, so 介词. In 他在家 (he is at home) the same character is the main verb. Context decides.',
      explainZh: '“在教室里”表示动作发生的地点，“在”是介词。在“他在家”中则是动词。',
    },
    tags: ['standard:1.6.7-介词'],
  }),
  mk({
    id: 'y1-wc-particle',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '「这是我的书。」句中的「的」是什么词？',
      stemEn: 'What word class is 的?',
      options: [
        { id: 'a', zh: '助词', en: 'particle' },
        { id: 'b', zh: '代词', en: 'pronoun' },
        { id: 'c', zh: '连词', en: 'conjunction' },
        { id: 'd', zh: '副词', en: 'adverb' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '的 carries no meaning of its own; it marks the relationship between 我 and 书. Words like that are 助词 — 的, 地, 得, 了, 着, 过.',
      explainZh: '“的”本身没有实在意义，只表示关系，是助词。',
    },
    tags: ['standard:1.6.7-助词'],
  }),
  mk({
    id: 'y1-wc-interj',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '「唉，又下雨了。」句中的「唉」是什么词？',
      stemEn: 'What word class is 唉?',
      options: [
        { id: 'a', zh: '叹词', en: 'interjection' },
        { id: 'b', zh: '拟声词', en: 'onomatopoeia' },
        { id: 'c', zh: '助词', en: 'particle' },
        { id: 'd', zh: '副词', en: 'adverb' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '唉 expresses a feeling, so 叹词. 拟声词 imitate a SOUND in the world (哗哗, 汪汪) rather than express an emotion — that is the distinction being tested.',
      explainZh: '“唉”表示感情，是叹词；拟声词模仿声音，如“哗哗”“汪汪”。',
    },
    tags: ['standard:1.6.7-叹词'],
  }),
  mk({
    id: 'y1-wc-onom',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '「雨哗哗地下着。」句中的「哗哗」是什么词？',
      stemEn: 'What word class is 哗哗?',
      options: [
        { id: 'a', zh: '拟声词', en: 'onomatopoeia' },
        { id: 'b', zh: '叹词', en: 'interjection' },
        { id: 'c', zh: '形容词', en: 'adjective' },
        { id: 'd', zh: '副词', en: 'adverb' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '哗哗 imitates the sound of rain, so 拟声词.',
      explainZh: '“哗哗”模仿雨声，是拟声词。',
    },
    tags: ['standard:1.6.7-拟声词'],
  }),
  mk({
    id: 'y1-wc-adj',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.7',
    examRef: '3.3.1',
    payload: {
      stem: '下面哪一个是形容词？',
      stemEn: 'Which of these is an adjective (形容词)?',
      options: [
        { id: 'a', zh: '干净' },
        { id: 'b', zh: '打扫' },
        { id: 'c', zh: '教室' },
        { id: 'd', zh: '已经' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '干净 describes a quality → 形容词. 打扫 is 动词, 教室 is 名词, 已经 is 副词.',
      explainZh: '“干净”表示性质，是形容词。',
    },
    tags: ['standard:1.6.7-形容词'],
  }),

  // =========================================================================
  // 1.6.8 标点符号 — the marks not already covered in baseline-items
  // =========================================================================
  mk({
    id: 'y1-pt-semicolon',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '哥哥喜欢打球（　）弟弟喜欢画画。',
      stemEn: 'Two balanced clauses. Which mark belongs between them?',
      options: [
        { id: 'a', zh: '；', en: 'semicolon (分号)' },
        { id: 'b', zh: '、', en: 'enumeration comma' },
        { id: 'c', zh: '：', en: 'colon' },
        { id: 'd', zh: '？', en: 'question mark' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        'Two complete clauses of equal weight, neither depending on the other, take a 分号. A 逗号 would be acceptable in speech but the 分号 shows the balance.',
      explainZh: '两个并列的分句之间用分号，表示两者地位相等。',
    },
    tags: ['standard:1.6.8-分号'],
  }),
  mk({
    id: 'y1-pt-quote',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '他说：（　）我明天不去。（　）',
      stemEn: 'Which pair of marks encloses the direct speech?',
      options: [
        { id: 'a', zh: '“　”', en: 'quotation marks (引号)' },
        { id: 'b', zh: '《　》', en: 'title marks' },
        { id: 'c', zh: '（　）', en: 'brackets' },
        { id: 'd', zh: '——', en: 'dash' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '引号 enclose direct speech. They also mark a word used in a special or ironic sense.',
      explainZh: '直接引用别人的话用引号，也可表示特殊含义。',
    },
    tags: ['standard:1.6.8-引号'],
  }),
  mk({
    id: 'y1-pt-dash',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '我最喜欢的水果（　）榴梿，终于上市了。',
      stemEn: 'Which mark introduces the explanation of 我最喜欢的水果?',
      options: [
        { id: 'a', zh: '——', en: 'dash (破折号)' },
        { id: 'b', zh: '、', en: 'enumeration comma' },
        { id: 'c', zh: '；', en: 'semicolon' },
        { id: 'd', zh: '……', en: 'ellipsis' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '破折号 introduces an explanation or a change of direction mid-sentence.',
      explainZh: '破折号用来解释说明前面的话。',
    },
    tags: ['standard:1.6.8-破折号'],
  }),
  mk({
    id: 'y1-pt-ellipsis',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '桌上放着苹果、香蕉、橙子（　）',
      stemEn: 'The list is not finished. Which mark shows that?',
      options: [
        { id: 'a', zh: '……', en: 'ellipsis (省略号)' },
        { id: 'b', zh: '。', en: 'full stop' },
        { id: 'c', zh: '——', en: 'dash' },
        { id: 'd', zh: '！', en: 'exclamation mark' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '省略号 shows something has been left out. Note it is six dots in Chinese (……), not three.',
      explainZh: '省略号表示列举未尽。中文的省略号是六个点。',
    },
    tags: ['standard:1.6.8-省略号'],
  }),
  mk({
    id: 'y1-pt-brackets',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '巴生（　）雪兰莪州的一个城市（　）是我出生的地方。',
      stemEn: 'Which pair of marks encloses the added note about 巴生?',
      options: [
        { id: 'a', zh: '（　）', en: 'brackets (括号)' },
        { id: 'b', zh: '“　”', en: 'quotation marks' },
        { id: 'c', zh: '《　》', en: 'title marks' },
        { id: 'd', zh: '［　］', en: 'square brackets' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '括号 enclose an explanatory note that could be removed without breaking the sentence.',
      explainZh: '括号里是注释性的话，去掉后句子仍然完整。',
    },
    tags: ['standard:1.6.8-括号'],
  }),
  mk({
    id: 'y1-pt-interpunct',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 4,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '《天净沙（　）秋思》是一首元曲。',
      stemEn: 'Which mark separates the tune name from the title?',
      options: [
        { id: 'a', zh: '·', en: 'interpunct (间隔号)' },
        { id: 'b', zh: '、', en: 'enumeration comma' },
        { id: 'c', zh: '：', en: 'colon' },
        { id: 'd', zh: '——', en: 'dash' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '间隔号 separates the 曲牌名 from the title. You have already met this one — it is in the relic 天净沙·秋思.',
      explainZh: '间隔号用于分隔曲牌名和篇名，如《天净沙·秋思》。',
    },
    tags: ['standard:1.6.8-间隔号'],
  }),

  mk({
    id: 'y1-pt-sentence-end',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 1,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '「你今天去不去学校（　）」应该用哪一个标点？',
      stemEn: 'Which mark ends this sentence?',
      options: [
        { id: 'a', zh: '？', en: 'question mark (问号)' },
        { id: 'b', zh: '。', en: 'full stop (句号)' },
        { id: 'c', zh: '！', en: 'exclamation mark (叹号)' },
        { id: 'd', zh: '，', en: 'comma (逗号)' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '去不去 is a question even without 吗, so it takes 问号. A statement takes 句号, strong feeling takes 叹号, and a 逗号 never ends a sentence.',
      explainZh: '“去不去”是疑问句，用问号。陈述句用句号，感叹句用叹号，逗号不能结束句子。',
    },
    tags: ['standard:1.6.8-问号', 'standard:1.6.8-句号', 'standard:1.6.8-叹号'],
  }),
  mk({
    id: 'y1-pt-comma',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '「下课以后（　）我们一起去图书馆。」应该用哪一个标点？',
      stemEn: 'Which mark separates the opening phrase from the main clause?',
      options: [
        { id: 'a', zh: '，', en: 'comma (逗号)' },
        { id: 'b', zh: '、', en: 'enumeration comma (顿号)' },
        { id: 'c', zh: '。', en: 'full stop' },
        { id: 'd', zh: '；', en: 'semicolon' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '逗号 marks a pause inside a sentence. 顿号 is only for items in a list — mixing the two up is the single most common punctuation error.',
      explainZh: '句子内部的停顿用逗号；顿号只用于并列的词语之间。',
    },
    tags: ['standard:1.6.8-逗号'],
  }),
  mk({
    id: 'y1-pt-hyphen',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 4,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '「吉隆坡（　）新加坡的火车」中间用哪一个标点表示「到」？',
      stemEn: 'Which mark links two points to mean "from … to …"?',
      options: [
        { id: 'a', zh: '－', en: 'hyphen / linking mark (连接号)' },
        { id: 'b', zh: '、', en: 'enumeration comma' },
        { id: 'c', zh: '·', en: 'interpunct' },
        { id: 'd', zh: '——', en: 'dash' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '连接号 joins two related points — a route, a date range, a number range. It is shorter than the 破折号, which explains rather than links.',
      explainZh: '连接号表示起止或关联，比破折号短。破折号是解释说明。',
    },
    tags: ['standard:1.6.8-连接号'],
  }),
  mk({
    id: 'y1-pt-emphasis',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 4,
    year: 1,
    standardRef: '1.6.8',
    examRef: '3.1.2',
    payload: {
      stem: '要提醒读者注意句子里的某几个字，在这些字下面加小圆点。这个标点叫什么？',
      stemEn: 'Small dots placed under certain characters to draw the reader’s attention. What is this mark called?',
      options: [
        { id: 'a', zh: '着重号', en: 'emphasis mark (着重号)' },
        { id: 'b', zh: '间隔号', en: 'interpunct' },
        { id: 'c', zh: '省略号', en: 'ellipsis' },
        { id: 'd', zh: '连接号', en: 'linking mark' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '着重号 is the Chinese equivalent of underlining or bolding for emphasis. It is rare in print but it is one of the fifteen marks on your syllabus.',
      explainZh: '着重号标在字下面，表示强调，是十五种标点之一。',
    },
    tags: ['standard:1.6.8-着重号'],
  }),

  // =========================================================================
  // 1.6.9 修辞 — the two not covered in baseline-items
  // =========================================================================
  mk({
    id: 'y1-rh-metonymy',
    type: 'rhetoric',
    skill: 'languageKnowledge',
    band: 4,
    year: 1,
    standardRef: '1.6.9',
    examRef: '3.4.1',
    payload: {
      stem: '「教室里的红领巾都站了起来。」这句用了什么修辞手法？',
      stemEn: 'Which device is used? (The red scarves in the classroom all stood up.)',
      options: [
        { id: 'a', zh: '借代', en: 'metonymy (借代)' },
        { id: 'b', zh: '比喻', en: 'simile / metaphor' },
        { id: 'c', zh: '比拟', en: 'personification' },
        { id: 'd', zh: '夸张', en: 'hyperbole' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '红领巾 stands for the children wearing them — naming a thing by something closely associated with it is 借代. The test against 比喻: there is no 像, and the two things are not being compared, one is simply standing in for the other.',
      explainZh: '用“红领巾”代替戴红领巾的人，是借代。借代不是比较，而是替换。',
    },
    tags: ['standard:1.6.9-借代'],
  }),
  mk({
    id: 'y1-rh-quotation',
    type: 'rhetoric',
    skill: 'languageKnowledge',
    band: 4,
    year: 1,
    standardRef: '1.6.9',
    examRef: '3.4.1',
    payload: {
      stem: '「正如古人所说：「一年之计在于春。」我们要珍惜时间。」这句用了什么修辞手法？',
      stemEn: 'Which device is used here?',
      options: [
        { id: 'a', zh: '引用', en: 'quotation (引用)' },
        { id: 'b', zh: '借代', en: 'metonymy' },
        { id: 'c', zh: '排比', en: 'parallelism' },
        { id: 'd', zh: '对偶', en: 'antithesis' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        'Bringing in a maxim or another person’s words to support your point is 引用. 排比 and 对偶 are 初三 devices (3.6.4) — they are not on your syllabus this year.',
      explainZh: '引用古人的话来加强说服力，是引用。排比、对偶是初三的内容。',
    },
    tags: ['standard:1.6.9-引用'],
  }),

  // =========================================================================
  // 1.2.3 记叙的要素与顺序 — the backbone of every 记叙文 he will read and write
  // =========================================================================
  mk({
    id: 'y1-narr-elements',
    type: 'comprehension',
    skill: 'comprehension',
    band: 2,
    year: 1,
    standardRef: '1.2.3',
    examRef: '4.3.1.1',
    payload: {
      stem: '记叙文的六要素是：人物、时间、地点、起因、经过和（　）。',
      stemEn: 'The six elements of a 记叙文 are: who, when, where, cause, course, and…?',
      options: [
        { id: 'a', zh: '结果', en: 'result' },
        { id: 'b', zh: '感想', en: 'reflection' },
        { id: 'c', zh: '道理', en: 'moral' },
        { id: 'd', zh: '题目', en: 'title' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        'The six are 人物、时间、地点、起因、经过、结果. 感想 often appears at the end of a 记叙文 but it is not one of the six — that distinction gets asked.',
      explainZh: '六要素：人物、时间、地点、起因、经过、结果。“感想”常出现在文末，但不属于六要素。',
    },
    tags: ['standard:1.2.3-记叙要素'],
  }),
  mk({
    id: 'y1-narr-shunxu',
    type: 'comprehension',
    skill: 'comprehension',
    band: 3,
    year: 1,
    standardRef: '1.2.3',
    examRef: '4.3.2.1',
    payload: {
      stem: '一篇文章从早上写到中午，再写到晚上。这是什么记叙顺序？',
      stemEn: 'A piece runs from morning to noon to evening. Which narrative order is that?',
      options: [
        { id: 'a', zh: '顺叙', en: 'chronological (顺叙)' },
        { id: 'b', zh: '倒叙', en: 'flashback opening (倒叙)' },
        { id: 'c', zh: '插叙', en: 'inserted episode (插叙)' },
        { id: 'd', zh: '补叙', en: 'supplementary account' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '顺叙 follows events in the order they happened. It is the default, and the easiest to write clearly.',
      explainZh: '按事情发生的先后次序来写，是顺叙。',
    },
    tags: ['standard:1.2.3-顺叙'],
  }),
  mk({
    id: 'y1-narr-daoxu',
    type: 'comprehension',
    skill: 'comprehension',
    band: 3,
    year: 1,
    standardRef: '1.2.3',
    examRef: '4.3.2.1',
    payload: {
      stem: '文章一开头就写出事情的结果，然后才从头说起。这是什么记叙顺序？',
      stemEn: 'A piece opens with the outcome, then goes back to the beginning. Which order is that?',
      options: [
        { id: 'a', zh: '倒叙', en: 'flashback opening (倒叙)' },
        { id: 'b', zh: '顺叙', en: 'chronological' },
        { id: 'c', zh: '插叙', en: 'inserted episode' },
        { id: 'd', zh: '平叙', en: 'parallel account' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '倒叙 puts the ending first to hook the reader, then returns to tell it in order. Useful in 作文: it makes a plain event feel like it matters.',
      explainZh: '把结果提到前面写，再回头叙述，是倒叙。作文中用来制造悬念。',
    },
    tags: ['standard:1.2.3-倒叙'],
  }),
  mk({
    id: 'y1-narr-chaxu',
    type: 'comprehension',
    skill: 'comprehension',
    band: 4,
    year: 1,
    standardRef: '1.2.3',
    examRef: '4.3.2.1',
    payload: {
      stem: '叙述到一半，忽然插入一段从前的事，说完再接回原来的事。这是什么记叙顺序？',
      stemEn: 'Mid-narrative, an earlier episode is inserted, then the main thread resumes. Which order is that?',
      options: [
        { id: 'a', zh: '插叙', en: 'inserted episode (插叙)' },
        { id: 'b', zh: '倒叙', en: 'flashback opening' },
        { id: 'c', zh: '顺叙', en: 'chronological' },
        { id: 'd', zh: '详叙', en: 'detailed account' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '插叙 breaks in mid-way and then rejoins. The difference from 倒叙: 倒叙 moves the ENDING to the front, 插叙 inserts a side episode in the MIDDLE.',
      explainZh: '插叙是中途插入，说完再接回；倒叙是把结果提到开头。两者常被混淆。',
    },
    tags: ['standard:1.2.3-插叙'],
  }),
];
