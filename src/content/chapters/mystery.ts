/**
 * 雨城档案 — Rain City Files, arc 1.
 *
 * Original content written for this app. Nothing here is adapted from a 董总
 * textbook or any past paper. Setting is Klang / Kuala Lumpur, present day.
 *
 * Prose is written at HSK 3.0 band 1-2 with a deliberate handful of band 3-4
 * target words per chapter. Coverage is machine-verified by
 * tests/chapter-coverage.test.ts - do not hand-tune difficulty by eye.
 */
import type { ChapterScript } from '@/lib/story/types';

export interface SeedChapter {
  id: string;
  genre: string;
  arc: number;
  seq: number;
  band: number;
  title: string;
  titleEn: string;
  artId: string;
  script: ChapterScript;
}

const L = (id: string, speaker: string, zh: string, en: string) => ({ id, speaker, zh, en });

export const MYSTERY_CHAPTERS: SeedChapter[] = [
  // -------------------------------------------------------------------------
  {
    id: 'mystery-1-1',
    genre: 'mystery',
    arc: 1,
    seq: 1,
    band: 1,
    title: '第一课：雨夜的门',
    titleEn: 'Chapter One: The Door in the Rain',
    artId: 'scene-mystery-1-1',
    script: {
      start: 'n1',
      glossFadeAt: 0.95,
      minutes: 8,
      properNouns: [],
      targets: [
        { zh: '雨', en: 'rain', lineId: 'l1' },
        { zh: '门', en: 'door', lineId: 'l2' },
        { zh: '开', en: 'to open', lineId: 'l3' },
        { zh: '找', en: 'to look for', lineId: 'l5' },
        { zh: '关', en: 'to close; to shut', lineId: 'l7' },
        { zh: '白', en: 'white', lineId: 'l9' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-mystery-1-1',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '下雨了。', 'It has started to rain.'),
            L('l2', 'narrator', '你走到店门口。', 'You walk up to the shop doorway.'),
            L('l3', 'narrator', '门没有关，也没有开。', 'The door is not shut, and not open either.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'auntie', '「你是谁？」', '"Who are you?"'),
            L('l5', 'you', '「我来找人。」', '"I am here to look for someone."'),
            L('l6', 'auntie', '「今天没有人来。」', '"Nobody came today."'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '她说今天没有人来。你看门口，你看到什么？',
          promptEn: 'She says nobody came today. You look at the doorway. What do you see?',
          lines: [
            L('l7', 'narrator', '门口有水。水是从里面出来的。', 'There is water at the doorway. It came from inside.'),
            L('l8', 'narrator', '外面下雨，里面也有雨水。', 'It is raining outside — and there is rainwater inside too.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '有人从外面进来了。',
              en: 'Someone came in from outside.',
              to: 'n4',
              correct: true,
              feedback:
                'Right. 水是从里面出来的 — the water came FROM inside. Someone wet walked in, so the water followed them.',
            },
            {
              id: 'c2',
              zh: '门口的水是新的。',
              en: 'The water at the doorway is new.',
              to: 'd1',
              correct: false,
              feedback:
                'The clue was not how new the water is. Look again at 从里面出来 — "came out FROM inside".',
            },
            {
              id: 'c3',
              zh: '今天没有下雨。',
              en: 'It did not rain today.',
              to: 'd1',
              correct: false,
              feedback: '下雨了 in the very first line. It is raining right now.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['从', '里面', '出来'],
          lines: [
            L('l9', 'narrator', '你再看一次。水是从里面出来的。', 'You look again. The water came out from inside.'),
            L('l10', 'narrator', '「从里面出来」——不是从外面进去。', '从里面出来 — "out from inside", not "in from outside".'),
            L('l11', 'narrator', '所以，有人先进去了。', 'So somebody went in first.'),
          ],
        },
        {
          id: 'n4',
          kind: 'speak',
          framing: 'You have to say it out loud, or she will shut the door.',
          targetZh: '我看到水了。',
          targetEn: 'I saw the water.',
          passScore: 0.6,
          onPass: 'n5',
          onPartial: 'd2',
          lines: [
            L('l12', 'auntie', '「你要说什么？」', '"What do you want to say?"'),
          ],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n5',
          teaches: ['看到'],
          lines: [
            L('l13', 'auntie', '「我听不清楚。」', '"I cannot hear you clearly."'),
            L('l14', 'narrator', '你再说一次，慢一点。', 'You say it again, a little slower.'),
          ],
        },
        {
          id: 'n5',
          kind: 'narration',
          next: 'n6',
          lines: [
            L('l15', 'auntie', '她不说话了。', 'She stops talking.'),
            L('l16', 'narrator', '你看到门后面有一个白色的东西。', 'You see something white behind the door.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'A white something behind a door, and a shopkeeper who says nobody came. Chapter two picks up here.',
          lines: [
            L('l17', 'narrator', '「明天你再来。」她说。', '"Come back tomorrow," she says.'),
            L('l18', 'narrator', '门关上了。', 'The door closes.'),
          ],
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  {
    id: 'mystery-1-2',
    genre: 'mystery',
    arc: 1,
    seq: 2,
    band: 2,
    title: '第二课：白色的伞',
    titleEn: 'Chapter Two: The White Umbrella',
    artId: 'scene-mystery-1-2',
    script: {
      start: 'n1',
      glossFadeAt: 0.95,
      minutes: 9,
      properNouns: ['林阿姨'],
      targets: [
        { zh: '伞', en: 'umbrella', lineId: 'l2' },
        { zh: '记得', en: 'to remember', lineId: 'l5' },
        { zh: '告诉', en: 'to tell (someone)', lineId: 'l7' },
        { zh: '为什么', en: 'why', lineId: 'l9' },
        { zh: '干', en: 'dry', lineId: 'l11' },
        { zh: '所以', en: 'so; therefore', lineId: 'l14' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-mystery-1-2',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '第二天，你又来了。', 'The next day, you come back.'),
            L('l2', 'narrator', '门后面的白色东西是一把伞。', 'The white thing behind the door is an umbrella.'),
            L('l3', 'narrator', '伞是白色的，很新。', 'The umbrella is white, and very new.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'auntie', '「这把伞不是我的。」', '"That umbrella is not mine."'),
            L('l5', 'you', '「你记得是谁的吗？」', '"Do you remember whose it is?"'),
            L('l6', 'auntie', '「我不记得。」', '"I do not remember."'),
            L('l7', 'you', '「请你告诉我。」', '"Please tell me."'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '昨天下大雨。这把伞是干的。为什么？',
          promptEn: 'It rained hard yesterday. This umbrella is dry. Why?',
          lines: [
            L('l8', 'narrator', '你看这把伞。', 'You look at the umbrella.'),
            L('l9', 'narrator', '外面下了一天雨，可是伞是干的。', 'It rained all day outside, but the umbrella is dry.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '它的主人没有用它。',
              en: 'Its owner did not use it.',
              to: 'n4',
              correct: true,
              feedback:
                'Yes. A dry umbrella on a wet day was never opened — so its owner got wet on purpose, or was not walking.',
            },
            {
              id: 'c2',
              zh: '昨天没有下雨。',
              en: 'It did not rain yesterday.',
              to: 'd1',
              correct: false,
              feedback: '下了一天雨 — "it rained for a whole day". The rain is a given, not the question.',
            },
            {
              id: 'c3',
              zh: '这把伞很旧了。',
              en: 'This umbrella is very old.',
              to: 'd1',
              correct: false,
              feedback: '很新 in line 3 — it is new. 旧 is the opposite of 新.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['干', '湿', '用'],
          lines: [
            L('l10', 'narrator', '想一想：下雨的时候，你用伞。', 'Think: when it rains, you use an umbrella.'),
            L('l11', 'narrator', '用了伞，伞就是湿的。没用，伞就是干的。', 'Used, the umbrella is wet. Unused, it is dry.'),
            L('l12', 'narrator', '这把伞是干的。', 'This umbrella is dry.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l13', 'narrator', '伞是干的，可是门口有水。', 'The umbrella is dry, but there was water at the door.'),
            L('l14', 'you', '「所以，那个人是坐车来的。」', '"So that person came by car."'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'The auntie will only answer a question she can hear properly.',
          targetZh: '昨天有车来吗？',
          targetEn: 'Did a car come yesterday?',
          passScore: 0.6,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l15', 'narrator', '你问她。', 'You ask her.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['车'],
          lines: [
            L('l16', 'auntie', '「什么？车？」', '"What? A car?"'),
            L('l17', 'narrator', '你点点头，再问一次。', 'You nod, and ask again.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'A dry umbrella, and a car nobody mentioned. Auntie Lim knows more than she is saying.',
          lines: [
            L('l18', 'auntie', '「有。一辆黑色的车。」', '"Yes. A black car."'),
            L('l19', 'narrator', '她说完，就不说话了。', 'She says that, and then says nothing more.'),
          ],
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  {
    id: 'mystery-1-3',
    genre: 'mystery',
    arc: 1,
    seq: 3,
    band: 2,
    title: '第三课：黑色的车',
    titleEn: 'Chapter Three: The Black Car',
    artId: 'scene-mystery-1-3',
    script: {
      start: 'n1',
      glossFadeAt: 0.94,
      minutes: 10,
      properNouns: ['林阿姨'],
      targets: [
        { zh: '认识', en: 'to know (a person)', lineId: 'l4' },
        { zh: '一定', en: 'certainly; must be', lineId: 'l9' },
        { zh: '因为', en: 'because', lineId: 'l10' },
        { zh: '真的', en: 'really; true', lineId: 'l13' },
        { zh: '帮', en: 'to help', lineId: 'l16' },
        { zh: '相信', en: 'to believe', lineId: 'l17' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-mystery-1-3',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '雨停了。路上很安静。', 'The rain has stopped. The road is quiet.'),
            L('l2', 'narrator', '一辆黑色的车停在店外面。', 'A black car is parked outside the shop.'),
            L('l3', 'narrator', '车里有一个人。', 'There is someone in the car.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'auntie', '「我不认识他。」林阿姨说。', '"I do not know him," says Auntie Lim.'),
            L('l5', 'narrator', '可是她在看车，一直在看。', 'But she is watching the car, watching it the whole time.'),
            L('l6', 'narrator', '车里的人也在看她。', 'And the person in the car is watching her.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '林阿姨说她不认识他。你相信吗？为什么？',
          promptEn: 'Auntie Lim says she does not know him. Do you believe her? Why?',
          lines: [
            L('l7', 'narrator', '她说不认识，可是她一直在看那辆车。', 'She says she does not know him, but she keeps watching that car.'),
            L('l8', 'narrator', '车里的人也在看她。', 'The person in the car is watching her back.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '她一定认识他，因为他们在看对方。',
              en: 'She must know him, because they are watching each other.',
              to: 'n4',
              correct: true,
              feedback:
                'Right — and the word that carries it is 也 in 车里的人也在看她. "Also" makes it mutual, and mutual means they know each other.',
            },
            {
              id: 'c2',
              zh: '她不认识他，因为她这样说。',
              en: 'She does not know him, because she said so.',
              to: 'd1',
              correct: false,
              feedback:
                'What someone says is a claim, not evidence. In this story, look at what people DO — 一直在看.',
            },
            {
              id: 'c3',
              zh: '车里没有人。',
              en: 'There is nobody in the car.',
              to: 'd1',
              correct: false,
              feedback: '车里有一个人 — line 3 says there is a person in the car.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['也', '一直', '对方'],
          lines: [
            L('l9', 'narrator', '注意这个字：「也」。', 'Notice this character: 也.'),
            L('l10', 'narrator', '「他也在看她」——因为她在看他，他也在看她。', '"He is ALSO watching her" — because she is watching him, and he is watching her too.'),
            L('l11', 'narrator', '两个人一直在看对方。这不是不认识。', 'The two of them keep watching each other. That is not "not knowing".'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l12', 'narrator', '车开走了。', 'The car drives away.'),
            L('l13', 'auntie', '「你真的想知道吗？」她问你。', '"Do you really want to know?" she asks you.'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'She will only open up if you say it clearly and mean it.',
          targetZh: '我想帮你。',
          targetEn: 'I want to help you.',
          passScore: 0.65,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l14', 'narrator', '你要怎么回答她？', 'How will you answer her?')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['帮'],
          lines: [
            L('l15', 'auntie', '「你说什么？」', '"What did you say?"'),
            L('l16', 'narrator', '你看着她，说得慢一点：「我想帮你。」', 'You look at her and say it more slowly: "I want to help you."'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'Arc one ends here. Auntie Lim is about to tell you something — and the black car will be back.',
          lines: [
            L('l17', 'auntie', '「好。我相信你。」', '"All right. I believe you."'),
            L('l18', 'auntie', '「那个人……是我儿子。」', '"That man… is my son."'),
          ],
        },
      ],
    },
  },
];
