/**
 * Sample 课文 for the lesson companion.
 *
 * These are ORIGINAL pieces written for this app at 初一 level, in the style and
 * at the length a 独中 初一 textbook uses. They exist so the 课文 companion is
 * demonstrable on a fresh install without the parent having uploaded anything.
 *
 * They are NOT from any 董总 textbook. Real lesson content comes in through the
 * upload flow, stays in the local database, and is never redistributed.
 *
 * Each one is built to exercise a different part of the 初一 课程标准:
 *   1  记叙文, 记叙要素, 顺叙 (1.2.3, 1.3.6)
 *   2  现代散文, 比喻与比拟 (1.5.1, 1.6.9)
 *   3  民间故事 (1.5.2), with 多音字 in play
 */

export interface SampleLesson {
  id: string;
  title: string;
  titleEn: string;
  bookRef: string;
  weekOf: string;
  /** What this lesson is for, in 课程标准 terms. */
  standardRefs: string[];
  text: string;
  /** 生字新词 - what the lesson teaches. */
  vocab: string[];
  /** One-line teacher's note in English. */
  noteEn: string;
}

export const SAMPLE_LESSONS: SampleLesson[] = [
  {
    id: 'lesson-sample-1',
    title: '第一课　外婆的菜园',
    titleEn: 'Lesson 1: Grandmother’s Vegetable Garden',
    bookRef: '示范课文（初一上册）',
    weekOf: '2026-09-14',
    standardRefs: ['1.2.3', '1.3.6', '1.3.7'],
    noteEn:
      'A straight 记叙文 in 顺叙 order. Use it to practise picking out the six 记叙要素: who, when, where, cause, process, result.',
    text:
      '外婆家的后面有一块小小的菜园。菜园不大，只有几步宽，可是里面什么都有。\n\n' +
      '那是一个星期六的早上。外婆叫我起床，说要带我去菜园。我还很困，但还是跟着她走出去了。\n\n' +
      '天刚亮，地上还是湿的。外婆蹲下来，用手把土翻开，把一颗一颗的种子放进去，再轻轻盖上土。她做得很慢，很认真。\n\n' +
      '我问她：“外婆，为什么要这么慢？”\n\n' +
      '外婆笑着说：“种子放得太深，它出不来；放得太浅，风一吹就走了。做事也一样。”\n\n' +
      '那天我们种了半个早上。回到家的时候，我的手很脏，衣服也脏了，可是心里很高兴。\n\n' +
      '后来我长大了，离开了那个小镇。每次做事着急的时候，我就会想起那天早上，想起外婆说的那句话。',
    vocab: ['菜园', '种子', '翻土', '认真', '着急', '离开'],
  },
  {
    id: 'lesson-sample-2',
    title: '第二课　雨',
    titleEn: 'Lesson 2: Rain',
    bookRef: '示范课文（初一上册）',
    weekOf: '2026-09-21',
    standardRefs: ['1.5.1', '1.6.9'],
    noteEn:
      'A short 现代散文. Every paragraph carries a different 修辞 device — find 比喻, 比拟 and 排比 before reading the notes.',
    text:
      '马来西亚的雨，从来不商量。\n\n' +
      '上一分钟，天还是蓝的；下一分钟，云就压了下来，像一张灰色的大布，把整个天空盖住。\n\n' +
      '雨来的时候很急。它敲打屋顶，敲打树叶，敲打路上的每一辆车。它不说话，可是整条街都听见了。\n\n' +
      '我站在走廊下看雨。雨水从屋檐上流下来，一条一条，像一排透明的线。地上很快就有了水，水面上开出一个一个小小的圆圈，又很快不见了。\n\n' +
      '雨停得也很快。太阳出来了，树叶上还挂着水珠，亮得像刚洗过一样。空气变得很干净，很凉。\n\n' +
      '我忽然觉得，雨不是来打扰我们的。它是来把这个地方重新洗一次的。',
    vocab: ['商量', '屋檐', '透明', '圆圈', '水珠', '打扰'],
  },
  {
    id: 'lesson-sample-3',
    title: '第三课　白米的来历（民间故事）',
    titleEn: 'Lesson 3: Where Rice Came From (a folk tale)',
    bookRef: '示范课文（初一下册）',
    weekOf: '2026-09-28',
    standardRefs: ['1.5.2', '1.6.4'],
    noteEn:
      'A 民间故事. Watch the 多音字: 长 (zhǎng / cháng), 种 (zhǒng / zhòng) and 还 (hái / huán) all appear with more than one reading.',
    text:
      '很久很久以前，山上的人不会种田。他们只能上山打猎，下河捉鱼。遇到不好的年头，常常吃不饱。\n\n' +
      '村里有一个年轻人，叫阿山。有一天，他在山上看见一只很大的白鸟，嘴里衔着一串小小的白色东西。\n\n' +
      '阿山跟着白鸟走了很远，一直走到山的另一边。白鸟停下来，把嘴里的东西放在地上，就飞走了。\n\n' +
      '阿山捡起来一看，是一串他从来没有见过的种子。他把种子带回村里，种在水边的地上。\n\n' +
      '过了几个月，那些种子长出了绿色的苗，苗上结出了一粒一粒的白米。\n\n' +
      '从那以后，村里的人再也不用挨饿了。他们说：那只白鸟还会回来的，所以每年收成以后，都要留一把米在田边，还给山里。',
    vocab: ['打猎', '衔', '种子', '苗', '收成', '挨饿'],
  },
];
