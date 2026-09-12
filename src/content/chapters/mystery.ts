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
            L('l1', 'narrator', '天一黑，雨就下了起来。', 'The moment it got dark, the rain started.'),
            L('l2', 'narrator', '你走到店门口的时候，里面还亮着一盏灯。', 'By the time you reach the shop doorway, one light is still on inside.'),
            L('l3', 'narrator', '那扇门没有关上，可是也没有开着，就那样停在中间。', 'The door is not shut, but not open either — it just hangs there, halfway.'),
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
            L('l7', 'narrator', '门口的地上有一片水，而那片水，是从里面流出来的。', 'There is a patch of water at the doorway — and that water ran out from inside.'),
            L('l8', 'narrator', '外面在下雨，这不奇怪；奇怪的是，里面也有雨水。', 'It is raining outside, which is not strange. What is strange is that there is rainwater inside as well.'),
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
            L('l9', 'narrator', '你再看一次：那片水不是流进去的，是流出来的。', 'You look again: the water did not run in. It ran out.'),
            L('l10', 'narrator', '「从里面出来」——不是从外面进去。', '从里面出来 — "out from inside", not "in from outside".'),
            L('l11', 'narrator', '所以，一定是先有人进去，水才跟着他出来。', 'So somebody must have gone in first, and the water followed them out.'),
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
            L('l15', 'auntie', '她忽然不说话了，只是盯着你看。', 'She stops talking all at once, and simply stares at you.'),
            L('l16', 'narrator', '就在这个时候，你看到门后面有一个白色的东西。', 'And it is right then that you see something white behind the door.'),
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
            L('l1', 'narrator', '第二天下午雨停了，你又回到那条街上。', 'The next afternoon the rain has stopped, and you go back to that street.'),
            L('l2', 'narrator', '门后面那个白色的东西，原来是一把伞。', 'That white thing behind the door turns out to be an umbrella.'),
            L('l3', 'narrator', '伞是白色的，看上去很新，一点旧的样子也没有。', 'It is white, it looks new, and there is nothing worn about it at all.'),
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
            L('l8', 'narrator', '你走过去，把那把伞拿起来看。', 'You go over and pick the umbrella up to look at it.'),
            L('l9', 'narrator', '外面下了一天的雨，可是这把伞从上到下都是干的。', 'It rained all day outside, yet this umbrella is dry from top to bottom.'),
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
            L('l10', 'narrator', '想一想：下雨的时候，人才会用伞。', 'Think: people only open an umbrella when it is raining.'),
            L('l11', 'narrator', '用过的伞一定是湿的；没用过的伞，才会是干的。', 'An umbrella that has been used is wet. Only one that was never opened stays dry.'),
            L('l12', 'narrator', '而这一把，从头到尾都是干的。', 'And this one is dry all the way through.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l13', 'narrator', '伞是干的，门口却有水——这两件事放在一起，就说不通了。', 'The umbrella is dry, but there was water at the door — put those two together and they do not add up.'),
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
          lines: [L('l15', 'narrator', '你把伞放回去，然后问她。', 'You put the umbrella back, and then you ask her.')],
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
            L('l19', 'narrator', '她说完这一句，就低下头，再也不说话了。', 'She says that one line, lowers her head, and says nothing more.'),
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
            L('l1', 'narrator', '雨停了以后，整条路都安静了下来。', 'After the rain stops, the whole road goes quiet.'),
            L('l2', 'narrator', '一辆黑色的车停在店外面，已经停了很久。', 'A black car is parked outside the shop, and it has been there a long time.'),
            L('l3', 'narrator', '车里坐着一个人，你看不清楚他的脸。', 'Someone is sitting inside, and you cannot make out their face.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'auntie', '「我不认识他。」林阿姨说。', '"I do not know him," says Auntie Lim.'),
            L('l5', 'narrator', '可是她一边说，一边看着那辆车，眼睛一直没有离开。', 'But as she says it she is watching that car, and her eyes never leave it.'),
            L('l6', 'narrator', '而车里的那个人，也一直在看她。', 'And the person in the car is watching her right back.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '林阿姨说她不认识他。你相信吗？为什么？',
          promptEn: 'Auntie Lim says she does not know him. Do you believe her? Why?',
          lines: [
            L('l7', 'narrator', '她说不认识，可是她的眼睛一直在那辆车上。', 'She says she does not know him, but her eyes stay on that car the whole time.'),
            L('l8', 'narrator', '而车里的那个人，也一直在看她。', 'And the person in the car is watching her right back.'),
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
            L('l9', 'narrator', '注意句子里的这个字：「也」。', 'Notice this one character in the sentence: 也.'),
            L('l10', 'narrator', '「他也在看她」——因为她在看他，他也在看她。', '"He is ALSO watching her" — because she is watching him, and he is watching her too.'),
            L('l11', 'narrator', '两个人一直在看对方，这就不是「不认识」了。', 'The two of them keep watching each other — that is not what "not knowing someone" looks like.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l12', 'narrator', '车慢慢开走了，她才把眼睛收回来。', 'The car pulls away slowly, and only then does she look away.'),
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
          lines: [L('l14', 'narrator', '她等着你回答，你要怎么说？', 'She is waiting for your answer. What will you say?')],
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
