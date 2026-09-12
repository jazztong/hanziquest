/**
 * Hand-authored baseline material: 语文基础知识 items, graded reading passages,
 * read-aloud lines and the writing prompt.
 *
 * All original. Passages are set in Malaysia (Klang, Penang, a kampung, a
 * kopitiam) because the brief asks for Malaysian contexts and because a student
 * reading about something he recognises spends his effort on the Chinese rather
 * than on the setting.
 *
 * Passage lengths follow the 统考 spec scaled for 初一: the exam uses 800-900字
 * 记叙文, and a baseline probe at that length would just measure stamina, so
 * these run 120-320字 across three difficulty steps.
 */
import type { Item } from '@/lib/items/types';
import { YEAR1_LANGUAGE_ITEMS } from './year1-language';

const mk = (i: Omit<Item, 'source'> & { source?: Item['source'] }): Item => ({
  source: 'seed',
  ...i,
});

// ---------------------------------------------------------------------------
// 语文基础知识 — 课程标准 1.6.x
// ---------------------------------------------------------------------------

const CORE_LANGUAGE_ITEMS: Item[] = [
  // --- 量词 -----------------------------------------------------------------
  mk({
    id: 'lk-mw-1',
    type: 'measure-word',
    skill: 'languageKnowledge',
    band: 1,
    year: 1,
    standardRef: '1.6.7',
    payload: {
      stem: '妈妈买了一（　）鱼。',
      stemEn: 'Choose the correct measure word.',
      options: [
        { id: 'a', zh: '条' },
        { id: 'b', zh: '只' },
        { id: 'c', zh: '本' },
        { id: 'd', zh: '张' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '条 is for long, thin things — fish, roads, trousers, rivers. 只 is for animals you could hold, 本 for books, 张 for flat things.',
      explainZh: '“条”用于细长的东西，如鱼、路、裤子、河。',
    },
    tags: ['standard:1.6.7-量词', 'mw:条'],
  }),
  mk({
    id: 'lk-mw-2',
    type: 'measure-word',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.7',
    payload: {
      stem: '他送了我一（　）花。',
      stemEn: 'Choose the correct measure word.',
      options: [
        { id: 'a', zh: '束' },
        { id: 'b', zh: '件' },
        { id: 'c', zh: '匹' },
        { id: 'd', zh: '座' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '束 is for bunches — flowers, light. 件 is for clothes and matters, 匹 for horses and cloth, 座 for buildings and mountains.',
      explainZh: '“束”用于成把的东西，如一束花、一束光。',
    },
    tags: ['standard:1.6.7-量词', 'mw:束'],
  }),
  mk({
    id: 'lk-mw-3',
    type: 'measure-word',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.7',
    payload: {
      stem: '巴生河上有一（　）新桥。',
      stemEn: 'Choose the correct measure word. (巴生 = Klang)',
      options: [
        { id: 'a', zh: '座' },
        { id: 'b', zh: '条' },
        { id: 'c', zh: '个' },
        { id: 'd', zh: '把' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '座 is for large fixed structures — bridges, mountains, buildings. 条 would be right for the river itself (一条河), not the bridge.',
      explainZh: '“座”用于体积大而固定的东西，如桥、山、大楼。',
    },
    tags: ['standard:1.6.7-量词', 'mw:座'],
  }),

  // --- 词性 -----------------------------------------------------------------
  mk({
    id: 'lk-wc-1',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.7',
    payload: {
      stem: '“他跑得很快。”句中的“快”是什么词？',
      stemEn: 'What word class is 快 in this sentence?',
      options: [
        { id: 'a', zh: '形容词', en: 'adjective' },
        { id: 'b', zh: '动词', en: 'verb' },
        { id: 'c', zh: '名词', en: 'noun' },
        { id: 'd', zh: '副词', en: 'adverb' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        '快 describes a quality, so it is 形容词. The trap: in English "fast" here feels adverbial, but in Chinese it sits after 得 as a complement and stays an adjective.',
      explainZh: '“快”表示性质状态，是形容词。它在“得”后面作补语。',
    },
    tags: ['standard:1.6.7-形容词', 'wc:形容词'],
  }),
  mk({
    id: 'lk-wc-2',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.7',
    payload: {
      stem: '下面哪一个是量词？',
      stemEn: 'Which of these is a measure word (量词)?',
      options: [
        { id: 'a', zh: '张' },
        { id: 'b', zh: '和' },
        { id: 'c', zh: '走' },
        { id: 'd', zh: '很' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '张 is 量词. 和 is 连词 (conjunction), 走 is 动词 (verb), 很 is 副词 (adverb).',
      explainZh: '“张”是量词；“和”是连词，“走”是动词，“很”是副词。',
    },
    tags: ['standard:1.6.7-量词', 'wc:量词'],
  }),
  mk({
    id: 'lk-wc-3',
    type: 'word-class',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.7',
    payload: {
      stem: '“忽然下起大雨来。”句中的“忽然”是什么词？',
      stemEn: 'What word class is 忽然?',
      options: [
        { id: 'a', zh: '副词', en: 'adverb' },
        { id: 'b', zh: '形容词', en: 'adjective' },
        { id: 'c', zh: '连词', en: 'conjunction' },
        { id: 'd', zh: '助词', en: 'particle' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '忽然 modifies the verb 下, so it is 副词. Compare 突然, which can be either 副词 or 形容词 — 忽然 can only be 副词.',
      explainZh: '“忽然”修饰动词，是副词。（“突然”则可作副词，也可作形容词。）',
    },
    tags: ['standard:1.6.7-副词', 'wc:副词'],
  }),

  // --- 标点符号 -------------------------------------------------------------
  mk({
    id: 'lk-pt-1',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.8',
    payload: {
      stem: '我买了苹果（　）香蕉和橙。',
      stemEn: 'Which punctuation mark belongs in the gap?',
      options: [
        { id: 'a', zh: '、', en: 'enumeration comma (顿号)' },
        { id: 'b', zh: '，', en: 'comma (逗号)' },
        { id: 'c', zh: '；', en: 'semicolon (分号)' },
        { id: 'd', zh: '：', en: 'colon (冒号)' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn:
        'Chinese uses 、 (顿号) between items in a list, not ，. This is one of the most common marks lost by students who write Chinese with English punctuation habits.',
      explainZh: '并列的词语之间用顿号“、”，不用逗号。',
    },
    tags: ['standard:1.6.8-顿号', 'punct:顿号'],
  }),
  mk({
    id: 'lk-pt-2',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 2,
    year: 1,
    standardRef: '1.6.8',
    payload: {
      stem: '老师说（　）“明天不用来学校。”',
      stemEn: 'Which punctuation mark belongs in the gap?',
      options: [
        { id: 'a', zh: '：', en: 'colon (冒号)' },
        { id: 'b', zh: '，', en: 'comma' },
        { id: 'c', zh: '。', en: 'full stop' },
        { id: 'd', zh: '、', en: 'enumeration comma' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: 'A colon introduces direct speech after 说. The quote itself uses 「」 or “”.',
      explainZh: '“说”后面引出直接引语，用冒号。',
    },
    tags: ['standard:1.6.8-冒号', 'punct:冒号'],
  }),
  mk({
    id: 'lk-pt-3',
    type: 'punctuation',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.8',
    payload: {
      stem: '我读了（　）西游记（　）这本书。',
      stemEn: 'Which pair of marks belongs in the gaps?',
      options: [
        { id: 'a', zh: '《　》', en: 'title marks (书名号)' },
        { id: 'b', zh: '“　”', en: 'quotation marks' },
        { id: 'c', zh: '（　）', en: 'brackets' },
        { id: 'd', zh: '——', en: 'dash' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: 'Book, film and article titles take 书名号《》. Quotation marks are for speech and for words used in a special sense.',
      explainZh: '书名、篇名、影片名用书名号《》。',
    },
    tags: ['standard:1.6.8-书名号', 'punct:书名号'],
  }),

  // --- 修辞 -----------------------------------------------------------------
  mk({
    id: 'lk-rh-1',
    type: 'rhetoric',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.9',
    payload: {
      stem: '“月亮像一只小船。”这句用了什么修辞手法？',
      stemEn: 'Which rhetorical device is used?',
      options: [
        { id: 'a', zh: '比喻', en: 'simile / metaphor' },
        { id: 'b', zh: '夸张', en: 'hyperbole' },
        { id: 'c', zh: '排比', en: 'parallelism' },
        { id: 'd', zh: '拟人', en: 'personification' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: 'The 像 signals a 比喻: 本体 (moon) + 喻词 (像) + 喻体 (boat). All three parts present = 明喻.',
      explainZh: '有本体“月亮”、喻词“像”、喻体“小船”，是比喻（明喻）。',
    },
    tags: ['standard:1.6.9-比喻'],
  }),
  mk({
    id: 'lk-rh-2',
    type: 'rhetoric',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.9',
    payload: {
      stem: '“风儿轻轻地唱着歌。”这句用了什么修辞手法？',
      stemEn: 'Which rhetorical device is used?',
      options: [
        { id: 'a', zh: '比拟', en: 'personification (比拟/拟人)' },
        { id: 'b', zh: '比喻', en: 'simile' },
        { id: 'c', zh: '借代', en: 'metonymy' },
        { id: 'd', zh: '引用', en: 'quotation' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: 'The wind is given a human action (singing) with no 像. That is 比拟 — specifically 拟人.',
      explainZh: '把风当作人来写，赋予它“唱歌”的行为，是比拟中的拟人。',
    },
    tags: ['standard:1.6.9-比拟'],
  }),
  mk({
    id: 'lk-rh-3',
    type: 'rhetoric',
    skill: 'languageKnowledge',
    band: 4,
    year: 1,
    standardRef: '1.6.9',
    payload: {
      stem: '“我等了你一千年。”这句用了什么修辞手法？',
      stemEn: 'Which rhetorical device is used?',
      options: [
        { id: 'a', zh: '夸张', en: 'hyperbole' },
        { id: 'b', zh: '比喻', en: 'simile' },
        { id: 'c', zh: '反问', en: 'rhetorical question' },
        { id: 'd', zh: '对偶', en: 'antithesis' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: 'Deliberate exaggeration for effect — nobody waited a thousand years. That is 夸张.',
      explainZh: '故意把时间说得极长，以突出感情，是夸张。',
    },
    tags: ['standard:1.6.9-夸张'],
  }),

  // --- 一词多义 / 词语 ------------------------------------------------------
  mk({
    id: 'lk-wm-1',
    type: 'cloze',
    skill: 'languageKnowledge',
    band: 3,
    year: 1,
    standardRef: '1.6.5',
    payload: {
      stem: '他的成绩（　）了，老师很高兴。',
      stemEn: 'Choose the word that fits.',
      options: [
        { id: 'a', zh: '进步' },
        { id: 'b', zh: '进来' },
        { id: 'c', zh: '进去' },
        { id: 'd', zh: '进入' },
      ],
    },
    answer: {
      correct: 'a',
      explainEn: '进步 = to improve. The others are all about physically moving in.',
      explainZh: '“进步”指变得更好；其余三个都表示空间上的移动。',
    },
    tags: ['standard:1.6.5', 'word:进步'],
  }),
];

// ---------------------------------------------------------------------------
// Reading passages — graded
// ---------------------------------------------------------------------------

export interface Passage {
  id: string;
  title: string;
  titleEn: string;
  band: number;
  genre: '记叙文' | '说明文' | '议论文';
  text: string;
  questions: Item[];
}

export const PASSAGES: Passage[] = [
  {
    id: 'p-easy',
    title: '放学以后',
    titleEn: 'After School',
    band: 2,
    genre: '记叙文',
    text:
      '放学了，天忽然下起雨来。我没有带伞，只好站在学校门口等。\n' +
      '等了很久，雨还是很大。我想：今天要很晚才能回家了。\n' +
      '这时候，一个同学走过来。他说：“我家就在前面，你先用我的伞吧。”\n' +
      '我说：“那你怎么办？”他笑了笑，跑进雨里，一下子就不见了。\n' +
      '我拿着那把伞，心里很暖。',
    questions: [
      {
        id: 'p-easy-q1',
        type: 'comprehension',
        skill: 'comprehension',
        band: 2,
        year: 1,
        standardRef: '1.2.3',
        examRef: '4.3.1.1',
        payload: {
          stem: '“我”为什么要站在学校门口等？',
          stemEn: 'Why did the narrator have to wait at the school gate?',
          options: [
            { id: 'a', zh: '因为他没有带伞。' },
            { id: 'b', zh: '因为他在等同学。' },
            { id: 'c', zh: '因为他不想回家。' },
            { id: 'd', zh: '因为学校还没有放学。' },
          ],
        },
        answer: { correct: 'a', explainEn: 'Line 1: 我没有带伞，只好站在学校门口等。' },
        source: 'seed',
        tags: ['comprehension:提取信息'],
      },
      {
        id: 'p-easy-q2',
        type: 'comprehension',
        skill: 'comprehension',
        band: 2,
        year: 1,
        standardRef: '1.2.1',
        examRef: '4.3.4.1',
        payload: {
          stem: '“他笑了笑，跑进雨里”——从这句话可以看出那个同学是怎样的人？',
          stemEn: 'What does this line tell you about the classmate?',
          options: [
            { id: 'a', zh: '他很热心，愿意帮助别人。' },
            { id: 'b', zh: '他很喜欢下雨。' },
            { id: 'c', zh: '他跑得很快。' },
            { id: 'd', zh: '他忘了带伞。' },
          ],
        },
        answer: {
          correct: 'a',
          explainEn:
            'This is a 动作描写 question. He gives away his own umbrella and runs into the rain rather than let the narrator wait — the action shows the character, which is what 记叙文 questions usually ask.',
          explainZh: '这是动作描写。他把伞让给别人，自己冒雨跑走，可见他热心助人。',
        },
        source: 'seed',
        tags: ['comprehension:人物描写'],
      },
    ],
  },
  {
    id: 'p-mid',
    title: '巴生的老街',
    titleEn: 'The Old Street in Klang',
    band: 3,
    genre: '记叙文',
    text:
      '外婆家在巴生的一条老街上。那条街不宽，两边都是旧店屋，屋前有走廊，下雨的时候也不会淋湿。\n' +
      '小时候，我最喜欢在走廊下跑来跑去。卖菜的阿姨会叫我的名字，修鞋的老伯会给我一颗糖。\n' +
      '后来我们搬走了，很多年没有回去。\n' +
      '上个月，我又走过那条街。店屋还在，走廊还在，可是卖菜的阿姨不见了，修鞋的老伯也不见了。\n' +
      '我站在走廊下，忽然明白：我想念的不是那条街，是街上的那些人。',
    questions: [
      {
        id: 'p-mid-q1',
        type: 'comprehension',
        skill: 'comprehension',
        band: 3,
        year: 1,
        standardRef: '1.2.3',
        examRef: '4.3.3.1',
        payload: {
          stem: '文中反复写“走廊还在”，作用是什么？',
          stemEn: 'Why does the writer repeat that the veranda is still there?',
          options: [
            { id: 'a', zh: '用不变的景物，衬托出人的改变。' },
            { id: 'b', zh: '说明走廊很坚固。' },
            { id: 'c', zh: '说明作者喜欢走廊。' },
            { id: 'd', zh: '说明那条街很旧。' },
          ],
        },
        answer: {
          correct: 'a',
          explainEn:
            'The place is unchanged and the people are gone. Setting the two against each other is what makes the last line land. This is 前后呼应 plus 衬托.',
          explainZh: '景物不变，人却变了，用不变衬托变化，前后呼应。',
        },
        source: 'seed',
        tags: ['comprehension:写作技巧'],
      },
      {
        id: 'p-mid-q2',
        type: 'comprehension',
        skill: 'comprehension',
        band: 3,
        year: 1,
        standardRef: '1.2.2',
        examRef: '4.3',
        payload: {
          stem: '这篇文章的中心思想是什么？',
          stemEn: 'What is the central idea of this piece?',
          options: [
            { id: 'a', zh: '真正让人怀念的是人，不是地方。' },
            { id: 'b', zh: '老街应该保留下来。' },
            { id: 'c', zh: '巴生是一个很美的城市。' },
            { id: 'd', zh: '作者不喜欢搬家。' },
          ],
        },
        answer: {
          correct: 'a',
          explainEn:
            'The last sentence states it outright: 我想念的不是那条街，是街上的那些人. In 记叙文, the 中心思想 is very often in the final line.',
          explainZh: '末句点明中心：怀念的是人而不是地方。记叙文的中心思想常在结尾点题。',
        },
        source: 'seed',
        tags: ['comprehension:中心思想'],
      },
    ],
  },
  {
    id: 'p-hard',
    title: '为什么榴梿这么香又这么臭',
    titleEn: 'Why Durian Smells So Good and So Bad',
    band: 4,
    genre: '说明文',
    text:
      '榴梿是马来西亚最有名的水果之一。有人闻到它就流口水，也有人闻到它就想跑开。同一种气味，为什么会有两种完全相反的感觉？\n' +
      '科学家研究发现，榴梿的气味不是一种味道，而是由五十多种气味物质混合而成的。这些物质里，有的像洋葱，有的像奶油，有的像蜂蜜，还有的像煮熟的肉。\n' +
      '人的鼻子对不同的气味物质敏感程度不一样。有的人先闻到奶油和蜂蜜，所以觉得香；有的人先闻到洋葱，所以觉得臭。\n' +
      '换句话说，香和臭并不在榴梿身上，而在闻的人身上。',
    questions: [
      {
        id: 'p-hard-q1',
        type: 'comprehension',
        skill: 'comprehension',
        band: 4,
        year: 1,
        standardRef: '1.2.4',
        examRef: '4.3.4.2',
        payload: {
          stem: '第二段“有的像洋葱，有的像奶油”用了什么说明方法？',
          stemEn: 'Which 说明方法 does paragraph two use?',
          options: [
            { id: 'a', zh: '打比方' },
            { id: 'b', zh: '列数字' },
            { id: 'c', zh: '下定义' },
            { id: 'd', zh: '作比较' },
          ],
        },
        answer: {
          correct: 'a',
          explainEn:
            '打比方 explains an unfamiliar thing by likening it to a familiar one. Note that 五十多种 in the same paragraph is 列数字 — a 说明文 usually stacks several methods, and the question asks about this phrase specifically.',
          explainZh: '用熟悉的事物（洋葱、奶油）来说明不熟悉的气味物质，是打比方。同段的“五十多种”则是列数字。',
        },
        source: 'seed',
        tags: ['comprehension:说明方法'],
      },
      {
        id: 'p-hard-q2',
        type: 'comprehension',
        skill: 'comprehension',
        band: 4,
        year: 1,
        standardRef: '1.6.5',
        examRef: '4.2.1',
        payload: {
          stem: '“香和臭并不在榴梿身上，而在闻的人身上”这句话的意思是：',
          stemEn: 'What does the final sentence mean?',
          options: [
            { id: 'a', zh: '对气味的感觉因人而异。' },
            { id: 'b', zh: '榴梿其实没有气味。' },
            { id: 'c', zh: '闻榴梿的人身上有味道。' },
            { id: 'd', zh: '榴梿的气味会传到人身上。' },
          ],
        },
        answer: {
          correct: 'a',
          explainEn:
            'The sentence is figurative — 在……身上 means "belongs to", not "physically located on". Option C takes it literally, which is the trap.',
          explainZh: '“在……身上”是比喻义，指“取决于”，不是指位置。',
        },
        source: 'seed',
        tags: ['comprehension:词句含义'],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Read-aloud lines, graded
// ---------------------------------------------------------------------------

export const READ_ALOUD_LINES: { id: string; band: number; zh: string; en: string }[] = [
  { id: 'ra-1', band: 1, zh: '今天天气很好，我们去公园吧。', en: 'The weather is good today — let’s go to the park.' },
  { id: 'ra-2', band: 2, zh: '哥哥买了四本书和十支笔。', en: 'My brother bought four books and ten pens.' },
  { id: 'ra-3', band: 3, zh: '雨停了以后，空气变得特别清新。', en: 'After the rain stopped, the air turned especially fresh.' },
  { id: 'ra-4', band: 4, zh: '他一边走一边想，不知不觉就走到了河边。', en: 'He walked and thought, and without noticing, reached the riverbank.' },
];

// ---------------------------------------------------------------------------
// Handwriting probes — highest-frequency characters
// ---------------------------------------------------------------------------

export const HANDWRITE_PROBES = ['人', '大', '天', '水', '同', '国', '，', '学'].filter(
  (c) => /[一-鿿]/u.test(c),
);

// ---------------------------------------------------------------------------
// Writing sample
// ---------------------------------------------------------------------------

export const BASELINE_WRITING_PROMPT = {
  id: 'bw-1',
  titleZh: '一件小事',
  titleEn: 'One Small Thing',
  promptZh: '写一写最近发生在你身上的一件小事。大约一百字。',
  promptEn:
    'Write about one small thing that happened to you recently. About 100 characters. Do not worry about being impressive — write what actually happened, in order.',
  minChars: 80,
  frames: [
    '那天……（什么时候、在哪里）',
    '我……（发生了什么）',
    '后来……（结果怎样）',
    '我觉得……（你的感受）',
  ],
};

/**
 * The full 初一 语文基础知识 bank.
 *
 * The hand-written core above plus src/content/year1-language.ts, which fills
 * the clauses the curriculum audit found uncovered: 1.6.1 错别字, 1.6.3 音变,
 * 1.6.6 成语格言, the remaining 词性 classes, the remaining 标点 marks, and
 * 借代/引用. Run `npx tsx scripts/curriculum-audit.ts` after adding any item.
 */
export const LANGUAGE_KNOWLEDGE_ITEMS: Item[] = [
  ...CORE_LANGUAGE_ITEMS,
  ...YEAR1_LANGUAGE_ITEMS,
];
