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
            L('l1', 'narrator', '你走了一天的路，天黑以前才来到山上。', 'You walk for a whole day and reach the mountain just before dark.'),
            L('l2', 'elder', '「你想学什么？」师父问。', '"What do you want to learn?" asks Shifu.'),
            L('l3', 'elder', '「今天学站。」', '"Today you learn to stand."'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'narrator', '你照他说的站好，一动也不动。', 'You take the stance he describes and do not move at all.'),
            L('l5', 'narrator', '站了一个小时以后，你的脚开始发抖。', 'After an hour of it, your legs start to shake.'),
            L('l6', 'narrator', '师父没有看你，他一直在看水。', 'Shifu is not watching you at all. He is watching the water.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '师父不看你，只看水。他为什么这样做？',
          promptEn: 'Shifu is not watching you — only the water. Why?',
          lines: [
            L('l7', 'narrator', '水不动的时候，你可以看到水里面的每一块石头。', 'When the water is still, you can see every stone at the bottom.'),
            L('l8', 'narrator', '水一动起来，就什么也看不清楚了。', 'The moment it moves, you cannot make out a thing.'),
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
            L('l10', 'narrator', '水是这样，人也是这样——心一乱，就看不清楚了。', 'True of water, and true of people: the moment the mind stirs, nothing is clear.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'elder', '「心不动，眼睛才看得见。」', '"When the mind is still, the eyes can finally see."'),
            L('l12', 'narrator', '你的脚已经很累了，可是你还是站着，一动也不动。', 'Your legs ache badly by now, but you keep standing, without moving at all.'),
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
            L('l15', 'narrator', '你想了想他的话，又说了一次。', 'You think about what he said, and say it once more.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'One line, learned by standing still for an hour. That is how this school teaches.',
          lines: [
            L('l16', 'elder', '师父看了你一眼，点点头，就走开了。', 'Shifu glances at you, nods once, and walks away.'),
            L('l17', 'narrator', '风吹过来，水又动了起来。', 'The wind comes across, and the water begins to move again.'),
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
            L('l1', 'narrator', '门里还有一个人，比你早一年上山。', 'There is one other person here, who came up the mountain a year before you.'),
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
            L('l5', 'narrator', '你们两个人站在水边，谁也没有先动。', 'The two of you stand at the water’s edge, and neither moves first.'),
            L('l6', 'narrator', '过了一会儿，她先动了手，动得很快。', 'After a moment she moves first, and she moves fast.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '她动得很快，你不动。谁会赢？为什么？',
          promptEn: 'She moves fast; you do not move. Who wins, and why?',
          lines: [
            L('l7', 'narrator', '她动得很快，可是她脚下的水也跟着动了。', 'She moves fast — but the water under her feet moves with her.'),
            L('l8', 'narrator', '你忽然想起师父说过的那句话。', 'You suddenly remember the line Shifu said.'),
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
            L('l9', 'narrator', '先动的人，等于先把自己的打算告诉了对方。', 'Whoever moves first has effectively told the other person their plan.'),
            L('l10', 'narrator', '你看到她的手往哪里去，就知道她想做什么了。', 'You see where her hand is going, and you know what she means to do.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'narrator', '你没有出手，只是往旁边走了一步。', 'You do not strike. You simply take one step to the side.'),
            L('l12', 'narrator', '她停了下来，站在那里看着你。', 'She stops, and stands there looking at you.'),
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
            L('l15', 'narrator', '你想了想他的话，又说了一次。', 'You think about what he said, and say it once more.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro: 'You have a junior sister now. She is going to be extremely annoying about it.',
          lines: [
            L('l16', 'child', '她笑了。「明天再比。」', 'She laughs. "Again tomorrow."'),
            L('l17', 'narrator', '水面上的圈子慢慢没有了，又静了下来。', 'The rings on the water slowly fade, and it goes still again.'),
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
            L('l1', 'narrator', '这个门派的本事，都写成一句一句的句子。', 'Everything this school knows is written down as lines, one after another.'),
            L('l2', 'narrator', '一句话就是一招，念对了才有用。', 'One line is one move, and it only works if you say it right.'),
            L('l3', 'narrator', '可是你手上的这一张，少了一句。', 'But the one in your hands is a line short.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'child', '「第三句没有了。」小师妹说。', '"The third line is gone," says Junior Sister.'),
            L('l5', 'child', '「一二四都在，就是少了三。」', '"One, two and four are all here. Only three is missing."'),
            L('l6', 'narrator', '少的那个地方有一个记号，好像有人把那一句拿走了。', 'Where the line should be there is a mark, as if someone had taken it out.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '一二四都在，只少第三句。这说明什么？',
          promptEn: 'Lines one, two and four are all there; only the third is gone. What does that tell you?',
          lines: [
            L('l7', 'narrator', '如果是自己坏的，不会刚好只坏第三句。', 'If it had simply worn away, it would not have taken exactly the third line.'),
            L('l8', 'narrator', '而且那个记号很干净，一点也不像坏的。', 'And the mark is very clean — it does not look like damage at all.'),
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
            L('l10', 'narrator', '如果是自己坏的，就不会留下这么干净的记号。', 'If it had worn away, it would not leave a mark this clean.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'narrator', '你拿着那一张，去问师父。', 'You take the sheet with you and go to ask Shifu.'),
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
          lines: [L('l13', 'narrator', '你心里有点怕，可是你还是问了出来。', 'You are a little afraid, but you ask anyway.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['您'],
          lines: [
            L('l14', 'elder', '「大声一点。」', '"Louder."'),
            L('l15', 'narrator', '你站直了身子，又问了一次。', 'You straighten up and ask him again.'),
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
