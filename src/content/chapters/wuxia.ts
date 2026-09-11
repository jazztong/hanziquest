/**
 * 南洋武林 — Nanyang Martial World, arc 1.
 *
 * Original content. The school's techniques are recorded as verse, so reading a
 * line correctly IS the technique — which makes 朗读 load-bearing rather than a
 * side activity, and sets up the 古诗文 relics later in the campaign.
 *
 * Combat here is bloodless by design (see the genre guardrails in
 * src/content/genres.ts): deflection, footwork, standing still.
 */
import type { SeedChapter } from './mystery';

const L = (id: string, speaker: string, zh: string, en: string) => ({ id, speaker, zh, en });

export const WUXIA_CHAPTERS: SeedChapter[] = [
  {
    id: 'wuxia-1-1',
    genre: 'wuxia',
    arc: 1,
    seq: 1,
    band: 1,
    title: '第一课：站',
    titleEn: 'Chapter One: Stand',
    artId: 'scene-wuxia-1-1',
    script: {
      start: 'n1',
      glossFadeAt: 0.95,
      minutes: 8,
      properNouns: ['师父', '小师妹'],
      targets: [
        { zh: '站', en: 'to stand', lineId: 'l3' },
        { zh: '动', en: 'to move', lineId: 'l4' },
        { zh: '水', en: 'water', lineId: 'l6' },
        { zh: '心', en: 'heart; mind', lineId: 'l11' },
        { zh: '久', en: 'long (of time)', lineId: 'l8' },
        { zh: '才', en: 'only then', lineId: 'l14' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-wuxia-1-1',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '你来到山上。', 'You arrive on the mountain.'),
            L('l2', 'elder', '「你想学什么？」师父问。', '"What do you want to learn?" asks Shifu.'),
            L('l3', 'elder', '「今天学站。」', '"Today you learn to stand."'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'narrator', '你站着，不动。', 'You stand, and do not move.'),
            L('l5', 'narrator', '一个小时以后，你的脚很累。', 'An hour later, your legs ache.'),
            L('l6', 'narrator', '师父在看水。', 'Shifu is watching the water.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '师父不看你，只看水。他为什么这样做？',
          promptEn: 'Shifu is not watching you — only the water. Why?',
          lines: [
            L('l7', 'narrator', '水不动的时候，你可以看到里面。', 'When water is still, you can see into it.'),
            L('l8', 'narrator', '水一动，就什么也看不到了。', 'The moment it moves, you can see nothing.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '他要我明白：不动，才看得清楚。',
              en: 'He wants me to see that stillness is what makes things clear.',
              to: 'n4',
              correct: true,
              feedback:
                'Yes. The water is the lesson, not the scenery. 一动，就什么也看不到 — move, and you see nothing.',
            },
            {
              id: 'c2',
              zh: '他不想教我。',
              en: 'He does not want to teach me.',
              to: 'd1',
              correct: false,
              feedback: 'He is teaching. He is just not using words for it.',
            },
            {
              id: 'c3',
              zh: '他很累了。',
              en: 'He is tired.',
              to: 'd1',
              correct: false,
              feedback: 'Nothing in the text says that. Look at what the water does.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['一…就…', '看得清楚'],
          lines: [
            L('l9', 'narrator', '「水一动，就看不到」——一…就…，前面一发生，后面马上来。', '一…就… — as soon as the first happens, the second follows.'),
            L('l10', 'narrator', '水是这样，人也是这样。', 'True of water, and true of people.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'elder', '「心不动，眼睛才看得见。」', '"When the mind is still, the eyes can finally see."'),
            L('l12', 'narrator', '你还是站着。你的脚很累，可是你不动。', 'You keep standing. Your legs ache, but you do not move.'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'Say the line back, and the standing becomes a technique.',
          targetZh: '心不动，眼才明。',
          targetEn: 'When the mind is still, the eye becomes clear.',
          passScore: 0.6,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l13', 'elder', '「说一次。」', '"Say it once."')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['明'],
          lines: [
            L('l14', 'elder', '「太快了。慢慢说，才是你的。」', '"Too fast. Say it slowly — then it is yours."'),
            L('l15', 'narrator', '你再说一次。', 'You say it again.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'One line, learned by standing still for an hour. That is how this school teaches.',
          lines: [
            L('l16', 'elder', '师父点点头，走了。', 'Shifu nods once and walks away.'),
            L('l17', 'narrator', '水又动了起来。', 'The water begins to move again.'),
          ],
        },
      ],
    },
  },

  {
    id: 'wuxia-1-2',
    genre: 'wuxia',
    arc: 1,
    seq: 2,
    band: 2,
    title: '第二课：小师妹',
    titleEn: 'Chapter Two: Junior Sister',
    artId: 'scene-wuxia-1-2',
    script: {
      start: 'n1',
      glossFadeAt: 0.95,
      minutes: 9,
      properNouns: ['师父', '小师妹'],
      targets: [
        { zh: '先', en: 'first; earlier', lineId: 'l3' },
        { zh: '输', en: 'to lose', lineId: 'l7' },
        { zh: '赢', en: 'to win', lineId: 'l8' },
        { zh: '手', en: 'hand', lineId: 'l10' },
        { zh: '让', en: 'to let; to yield', lineId: 'l13' },
        { zh: '其实', en: 'actually', lineId: 'l14' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-wuxia-1-2',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '有一个人比你早一年来。', 'Someone came here a year before you.'),
            L('l2', 'child', '「你站了多久？」她问。', '"How long did you stand?" she asks.'),
            L('l3', 'child', '「我先来的，我站了三个月。」', '"I came first. I stood for three months."'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'child', '「我们来比一比。」', '"Let’s have a match."'),
            L('l5', 'narrator', '你们站在水边。', 'The two of you stand at the water’s edge.'),
            L('l6', 'narrator', '她很快就动了手。', 'She moves first, and fast.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '她动得很快，你不动。谁会赢？为什么？',
          promptEn: 'She moves fast; you do not move. Who wins, and why?',
          lines: [
            L('l7', 'narrator', '她动得快，可是水也动了。', 'She moves fast — and the water moves too.'),
            L('l8', 'narrator', '你想起师父的话。', 'You remember what Shifu said.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '她先动，所以她先让我看到她要做什么。',
              en: 'She moved first, so she showed me what she was going to do.',
              to: 'n4',
              correct: true,
              feedback:
                'Exactly the lesson from chapter one, used. Moving first is information given away.',
            },
            {
              id: 'c2',
              zh: '她比我快，所以她会赢。',
              en: 'She is faster, so she will win.',
              to: 'd1',
              correct: false,
              feedback: 'Speed is what she has. The story has spent two chapters saying it is not the point.',
            },
            {
              id: 'c3',
              zh: '我不动，所以我会输。',
              en: 'I am not moving, so I will lose.',
              to: 'd1',
              correct: false,
              feedback: '心不动，眼才明 — stillness is the technique, not the absence of one.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['先', '所以'],
          lines: [
            L('l9', 'narrator', '「先动」的人，先给了别人一个消息。', 'Whoever moves first has handed the other person information.'),
            L('l10', 'narrator', '你看到她的手，就知道她要做什么。', 'You see her hand, and you know what she is about to do.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'narrator', '你没有出手。你只是走开了一步。', 'You do not strike. You simply step aside.'),
            L('l12', 'narrator', '她停下来，看着你。', 'She stops and looks at you.'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'She will not accept a win she was handed.',
          targetZh: '我没有赢，你也没有输。',
          targetEn: 'I did not win, and you did not lose.',
          passScore: 0.6,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l13', 'child', '「你让我？」', '"Are you letting me off?"')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['也'],
          lines: [
            L('l14', 'child', '「大声一点。」', '"Louder."'),
            L('l15', 'narrator', '你再说一次。', 'You say it again.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro: 'You have a junior sister now. She is going to be extremely annoying about it.',
          lines: [
            L('l16', 'child', '她笑了。「明天再比。」', 'She laughs. "Again tomorrow."'),
            L('l17', 'narrator', '水又静了下来。', 'The water settles again.'),
          ],
        },
      ],
    },
  },

  {
    id: 'wuxia-1-3',
    genre: 'wuxia',
    arc: 1,
    seq: 3,
    band: 2,
    title: '第三课：少了一句',
    titleEn: 'Chapter Three: One Line Missing',
    artId: 'scene-wuxia-1-3',
    script: {
      start: 'n1',
      glossFadeAt: 0.94,
      minutes: 10,
      properNouns: ['师父', '小师妹'],
      targets: [
        { zh: '句', en: 'sentence; line (measure word)', lineId: 'l2' },
        { zh: '少', en: 'to be missing; few', lineId: 'l3' },
        { zh: '记', en: 'to record; to remember', lineId: 'l6' },
        { zh: '教', en: 'to teach', lineId: 'l10' },
        { zh: '怕', en: 'to fear', lineId: 'l13' },
        { zh: '等', en: 'to wait', lineId: 'l16' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-wuxia-1-3',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '这里的本事，都写成句子。', 'The skills here are all written down as lines.'),
            L('l2', 'narrator', '一句话，就是一招。', 'One line is one move.'),
            L('l3', 'narrator', '可是这一张，少了一句。', 'But this one is a line short.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'child', '「第三句没有了。」小师妹说。', '"The third line is gone," says Junior Sister.'),
            L('l5', 'child', '「一二四都在，就是少了三。」', '"One, two and four are all here. Only three is missing."'),
            L('l6', 'narrator', '那里有一个记号，好像有人拿走了什么。', 'There is a mark there, as if someone took something away.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '一二四都在，只少第三句。这说明什么？',
          promptEn: 'Lines one, two and four are all there; only the third is gone. What does that tell you?',
          lines: [
            L('l7', 'narrator', '如果是自己坏的，不会只坏一句。', 'If it had simply worn away, it would not take exactly one line.'),
            L('l8', 'narrator', '那个记号很干净。', 'The mark is very clean.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '是有人拿走的，不是坏了。',
              en: 'Somebody removed it. It did not simply decay.',
              to: 'n4',
              correct: true,
              feedback:
                'Same shape of reasoning as the ship that "does not know": damage is messy, removal is neat.',
            },
            {
              id: 'c2',
              zh: '本来就只有三句。',
              en: 'There were only ever three lines.',
              to: 'd1',
              correct: false,
              feedback: '一二四都在 — line four is present. So a third line existed.',
            },
            {
              id: 'c3',
              zh: '小师妹记错了。',
              en: 'Junior Sister remembered it wrong.',
              to: 'd1',
              correct: false,
              feedback: 'There is a physical mark on the page. Something was there.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['如果', '记号'],
          lines: [
            L('l9', 'narrator', '「如果…就…」——前面是想法，后面是结果。', '如果…就… — if this, then that.'),
            L('l10', 'narrator', '如果是自己坏的，就不会这么干净。', 'If it had worn away, it would not be this clean.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'narrator', '你去问师父。', 'You go and ask Shifu.'),
            L('l12', 'elder', '他看了很久，没有说话。', 'He looks at it for a long time and says nothing.'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'He will not volunteer it. Ask him directly.',
          targetZh: '是您拿走的吗？',
          targetEn: 'Did you take it out?',
          passScore: 0.65,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l13', 'narrator', '你有点怕，可是你还是问了。', 'You are a little afraid, but you ask anyway.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['您'],
          lines: [
            L('l14', 'elder', '「大声一点。」', '"Louder."'),
            L('l15', 'narrator', '你站直了，再问一次。', 'You straighten up and ask again.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'Arc one ends here. Shifu removed the third line himself — and he is not going to say why yet.',
          lines: [
            L('l16', 'elder', '「是我。」', '"It was me."'),
            L('l17', 'elder', '「等你站得住了，我再教你。」', '"When you can hold the stance, I will teach it to you."'),
          ],
        },
      ],
    },
  },
];
