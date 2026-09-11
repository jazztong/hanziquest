/**
 * 山海行 — Journey of Mountains and Seas, arc 1.
 *
 * Original content. 西游记 and 三国 energy run through Southeast Asia: a
 * celestial errand, a very confident monkey, and a great deal of paperwork.
 *
 * The running joke is that the bureaucracy runs on exact wording, which is the
 * same mechanic as the sci-fi ship seen from the other end - and it is the
 * on-ramp to 文言文, where exact wording is the whole game.
 */
import type { SeedChapter } from './mystery';

const L = (id: string, speaker: string, zh: string, en: string) => ({ id, speaker, zh, en });

export const LEGEND_CHAPTERS: SeedChapter[] = [
  {
    id: 'legend-1-1',
    genre: 'legend',
    arc: 1,
    seq: 1,
    band: 1,
    title: '第一课：一张纸',
    titleEn: 'Chapter One: One Sheet of Paper',
    artId: 'scene-legend-1-1',
    script: {
      start: 'n1',
      glossFadeAt: 0.95,
      minutes: 8,
      properNouns: ['石猴', '土地公'],
      targets: [
        { zh: '纸', en: 'paper', lineId: 'l2' },
        { zh: '字', en: 'written character', lineId: 'l3' },
        { zh: '路', en: 'road; way', lineId: 'l7' },
        { zh: '山', en: 'mountain', lineId: 'l8' },
        { zh: '过', en: 'to pass; to cross', lineId: 'l11' },
        { zh: '错', en: 'wrong; mistake', lineId: 'l14' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-legend-1-1',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '天上的人很忙。', 'The people up above are very busy.'),
            L('l2', 'narrator', '所以这件事，给了你一张纸。', 'So this errand came to you as one sheet of paper.'),
            L('l3', 'narrator', '纸上有三个字。', 'There are three characters on it.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'man', '「三个字？」石猴说。', '"Three characters?" says Stone Monkey.'),
            L('l5', 'man', '「我也不认得。我们走吧。」', '"I cannot read them either. Let’s just go."'),
            L('l6', 'narrator', '他已经走在前面了。', 'He is already walking ahead.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '你还没看清楚纸上的字。现在应该怎么做？',
          promptEn: 'You have not read the paper properly yet. What should you do?',
          lines: [
            L('l7', 'narrator', '前面有两条路。', 'There are two roads ahead.'),
            L('l8', 'narrator', '一条上山，一条下山。', 'One goes up the mountain, one goes down.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '先看清楚字，再走路。',
              en: 'Read the characters properly first, then walk.',
              to: 'n4',
              correct: true,
              feedback:
                'Yes. 先…再… — first this, then that. The whole story runs on doing those in the right order.',
            },
            {
              id: 'c2',
              zh: '跟着石猴走。',
              en: 'Follow Stone Monkey.',
              to: 'd1',
              correct: false,
              feedback: '我也不认得 — he just told you he cannot read it either.',
            },
            {
              id: 'c3',
              zh: '两条路都走一走。',
              en: 'Try both roads.',
              to: 'd1',
              correct: false,
              feedback: 'The paper exists to tell you which one. Read it.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['先…再…', '认得'],
          lines: [
            L('l9', 'narrator', '「先…再…」——先做一件，再做第二件。', '先…再… — do one thing first, then the second.'),
            L('l10', 'narrator', '先看字，再走路。走错了就要走回来。', 'Read first, then walk. Take the wrong road and you walk back.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'narrator', '你看清楚了。纸上写着：过山去。', 'You look properly. The paper says: cross the mountain.'),
            L('l12', 'narrator', '石猴已经走到下山的路上了。', 'Stone Monkey is already on the road going down.'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'He is not going to turn around unless you tell him.',
          targetZh: '你走错了！',
          targetEn: 'You have gone the wrong way!',
          passScore: 0.6,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l13', 'narrator', '你在他后面叫他。', 'You call after him.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['错'],
          lines: [
            L('l14', 'man', '「什么？」他没有停。', '"What?" He does not stop.'),
            L('l15', 'narrator', '你大声一点，再叫一次。', 'You call again, louder.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'Three characters, one mountain, and a travelling companion who does not read. Chapter two is at the gate.',
          lines: [
            L('l16', 'man', '「我没走错。」他说。', '"I did not go wrong," he says.'),
            L('l17', 'man', '「我只是先走了另一条。」', '"I merely took the other one first."'),
          ],
        },
      ],
    },
  },

  {
    id: 'legend-1-2',
    genre: 'legend',
    arc: 1,
    seq: 2,
    band: 2,
    title: '第二课：土地公',
    titleEn: 'Chapter Two: The Earth God',
    artId: 'scene-legend-1-2',
    script: {
      start: 'n1',
      glossFadeAt: 0.95,
      minutes: 9,
      properNouns: ['石猴', '土地公'],
      targets: [
        { zh: '老', en: 'old', lineId: 'l2' },
        { zh: '住', en: 'to live; to reside', lineId: 'l4' },
        { zh: '外面', en: 'outside', lineId: 'l6' },
        { zh: '别的', en: 'other', lineId: 'l9' },
        { zh: '当然', en: 'of course', lineId: 'l11' },
        { zh: '真', en: 'really; true', lineId: 'l14' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-legend-1-2',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '山下有一个小庙。', 'There is a small shrine at the foot of the mountain.'),
            L('l2', 'narrator', '里面住着一个很老很老的土地公。', 'Inside lives a very, very old earth god.'),
            L('l3', 'elder', '「这座山，我知道每一块石头。」', '"This mountain — I know every stone on it."'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'you', '「山外面呢？」', '"And beyond the mountain?"'),
            L('l5', 'elder', '「山外面？」', '"Beyond the mountain?"'),
            L('l6', 'elder', '「我没出去过。」', '"I have never been out."'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '土地公知道山上的每一块石头，可是没出过山。他能带你过山吗？',
          promptEn: 'He knows every stone on the mountain but has never left it. Can he get you across?',
          lines: [
            L('l7', 'narrator', '你要过山，到山的另一边去。', 'You need to cross the mountain to the other side.'),
            L('l8', 'narrator', '土地公只知道山里面的事。', 'He only knows what is inside the mountain.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '他能带我到山上，可是过不了山。',
              en: 'He can take me up the mountain, but not across it.',
              to: 'n4',
              correct: true,
              feedback:
                'Exactly right, and it is a useful habit: work out what someone actually knows before you ask them for it.',
            },
            {
              id: 'c2',
              zh: '他什么都知道，一定可以。',
              en: 'He knows everything, so of course he can.',
              to: 'd1',
              correct: false,
              feedback: '每一块石头 is a big claim about a small place. 我没出去过 is the limit.',
            },
            {
              id: 'c3',
              zh: '他什么都不知道。',
              en: 'He knows nothing.',
              to: 'd1',
              correct: false,
              feedback: 'Too far the other way. He knows the mountain extremely well.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['里面', '外面'],
          lines: [
            L('l9', 'narrator', '「里面」和「外面」是两件事。', '"Inside" and "outside" are two different things.'),
            L('l10', 'narrator', '他知道里面的每一块石头，外面的一块也不知道。', 'He knows every stone inside, and not one outside.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'man', '「那我们要他做什么？」石猴说。', '"Then what do we need him for?" says Stone Monkey.'),
            L('l12', 'elder', '土地公看了石猴一眼，没说话。', 'The earth god gives him a look and says nothing.'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'Ask for what he actually has, not for what you want.',
          targetZh: '请您带我们上山。',
          targetEn: 'Please take us up the mountain.',
          passScore: 0.65,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l13', 'narrator', '你想了一下，才开口。', 'You think for a moment before speaking.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['请', '带'],
          lines: [
            L('l14', 'elder', '「你说什么？」', '"What was that?"'),
            L('l15', 'narrator', '你说得慢一点，清楚一点。', 'You say it slower, and more clearly.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'Asking for the right thing worked. Stone Monkey is quietly furious that it did.',
          lines: [
            L('l16', 'elder', '「这个我可以。」土地公站了起来。', '"That I can do." The earth god gets up.'),
            L('l17', 'man', '石猴什么也没说。', 'Stone Monkey says nothing at all.'),
          ],
        },
      ],
    },
  },

  {
    id: 'legend-1-3',
    genre: 'legend',
    arc: 1,
    seq: 3,
    band: 2,
    title: '第三课：山不让路',
    titleEn: 'Chapter Three: The Mountain Will Not Move',
    artId: 'scene-legend-1-3',
    script: {
      start: 'n1',
      glossFadeAt: 0.94,
      minutes: 10,
      properNouns: ['石猴', '土地公'],
      targets: [
        { zh: '石头', en: 'stone', lineId: 'l3' },
        { zh: '前面', en: 'in front', lineId: 'l2' },
        { zh: '生气', en: 'angry', lineId: 'l6' },
        { zh: '办法', en: 'a way; a method', lineId: 'l10' },
        { zh: '慢慢', en: 'slowly', lineId: 'l13' },
        { zh: '终于', en: 'finally', lineId: 'l16' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-legend-1-3',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '你们走到山上。', 'You climb to the top of the mountain.'),
            L('l2', 'narrator', '前面的路没有了。', 'The road ahead is gone.'),
            L('l3', 'narrator', '一块很大很大的石头，把路都挡住了。', 'One enormous stone has blocked the whole road.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'man', '石猴叫了三次。石头不动。', 'Stone Monkey shouts three times. The stone does not move.'),
            L('l5', 'man', '他用手推。石头还是不动。', 'He pushes with his hands. Still it does not move.'),
            L('l6', 'man', '「这块石头在生我的气。」他说。', '"This stone is angry with me," he says.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '石猴叫，石头不动；石猴推，石头也不动。你想到了什么？',
          promptEn: 'Shouting did not move it. Pushing did not move it. What are you thinking?',
          lines: [
            L('l7', 'narrator', '土地公说过：这座山的每一块石头，他都知道。', 'The earth god said he knows every stone on this mountain.'),
            L('l8', 'narrator', '他现在站在后面，什么也没说。', 'He is standing behind you now, saying nothing.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '去问土地公，他知道这块石头。',
              en: 'Ask the earth god — he knows this stone.',
              to: 'n4',
              correct: true,
              feedback:
                'Chapter two set this up: he knows the inside of the mountain completely. This stone is inside it.',
            },
            {
              id: 'c2',
              zh: '再用力推一次。',
              en: 'Push harder.',
              to: 'd1',
              correct: false,
              feedback: 'Twice already failed. The story is telling you force is not the answer here.',
            },
            {
              id: 'c3',
              zh: '走回去，找别的路。',
              en: 'Go back and find another road.',
              to: 'd1',
              correct: false,
              feedback: '前面的路没有了 — this is the road. And you have someone standing right there who knows it.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['挡住', '都'],
          lines: [
            L('l9', 'narrator', '想一想：谁知道这座山？', 'Think: who knows this mountain?'),
            L('l10', 'narrator', '有办法的人就在你后面。', 'The person with the answer is standing right behind you.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'elder', '「这块石头，我认得。」土地公说。', '"This stone, I know," says the earth god.'),
            L('l12', 'elder', '「它不是在生气。它只是很老了。」', '"It is not angry. It is simply very old."'),
            L('l13', 'elder', '「老东西，要慢慢来。」', '"Old things have to be done slowly."'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'Old things have to be asked, not shoved.',
          targetZh: '老石头，请您让一让。',
          targetEn: 'Old stone, please move aside.',
          passScore: 0.65,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l14', 'narrator', '你走到石头前面，慢慢地说。', 'You walk up to the stone and speak slowly.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['让一让'],
          lines: [
            L('l15', 'narrator', '石头没有动。', 'The stone does not move.'),
            L('l16', 'elder', '「再慢一点。」土地公说。', '"Slower," says the earth god.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'Arc one ends here. The road is open, and Stone Monkey has decided he did that.',
          lines: [
            L('l17', 'narrator', '石头终于动了一点点。', 'At last the stone shifts, just a little.'),
            L('l18', 'man', '「我就说吧。」石猴说。', '"Told you," says Stone Monkey.'),
          ],
        },
      ],
    },
  },
];
