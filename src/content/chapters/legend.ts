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
            L('l1', 'narrator', '天上的人都很忙，没有人想接这件事。', 'Everyone up above is busy, and nobody wants this errand.'),
            L('l2', 'narrator', '所以这件事最后落到你手上，只给了你一张纸。', 'So it ends up with you, and all you are given is one sheet of paper.'),
            L('l3', 'narrator', '那张纸上只写着三个字，别的什么也没有。', 'There are three characters on it and nothing else.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'man', '「三个字？」石猴说。', '"Three characters?" says Stone Monkey.'),
            L('l5', 'man', '「我也不认得。我们走吧。」', '"I cannot read them either. Let’s just go."'),
            L('l6', 'narrator', '他说完就走了，已经走在你前面很远。', 'He says it and goes, already well ahead of you.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '你还没看清楚纸上的字。现在应该怎么做？',
          promptEn: 'You have not read the paper properly yet. What should you do?',
          lines: [
            L('l7', 'narrator', '走了一会儿，前面出现了两条路。', 'After a while, two roads appear ahead of you.'),
            L('l8', 'narrator', '一条往上走进山里，一条往下走出山外。', 'One climbs up into the mountain; the other goes down and out of it.'),
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
            L('l10', 'narrator', '先把字看清楚，再走路；走错了，就要花一倍的时间走回来。', 'Read it properly first, then walk. Take the wrong road and you spend twice as long walking back.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'narrator', '你把纸拿近了看清楚，上面写着三个字：过山去。', 'You hold the paper closer and read it properly. Three characters: cross the mountain.'),
            L('l12', 'narrator', '可是石猴已经走上了那条下山的路。', 'But Stone Monkey is already well down the road that leads out.'),
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
          lines: [L('l13', 'narrator', '你站在路口，在他后面大声叫他。', 'You stand at the fork and shout after him.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['错'],
          lines: [
            L('l14', 'man', '「什么？」他没有停。', '"What?" He does not stop.'),
            L('l15', 'narrator', '你走上前几步，再大声叫了一次。', 'You take a few steps forward and shout again, louder.'),
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
            L('l1', 'narrator', '山下有一个很小的庙，小得只能站下一个人。', 'At the foot of the mountain is a shrine so small only one person could stand in it.'),
            L('l2', 'narrator', '里面住着一个土地公，看上去已经很老很老了。', 'Inside lives an earth god who looks very, very old indeed.'),
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
            L('l7', 'narrator', '你要做的是过山，到山的另一边去。', 'What you need to do is cross the mountain, to the other side of it.'),
            L('l8', 'narrator', '可是土地公只知道山里面的事，山外面的他一点也不知道。', 'But the earth god only knows what is inside the mountain; of what lies outside it he knows nothing.'),
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
            L('l9', 'narrator', '「里面」和「外面」是两件不一样的事。', '"Inside" and "outside" are two different things.'),
            L('l10', 'narrator', '他知道山里面的每一块石头，可是山外面的，他一块也说不出来。', 'He knows every stone inside the mountain, and cannot name a single one outside it.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'man', '「那我们要他做什么？」石猴说。', '"Then what do we need him for?" says Stone Monkey.'),
            L('l12', 'elder', '土地公看了石猴一眼，什么话也没有说。', 'The earth god gives him a look and says nothing at all.'),
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
          lines: [L('l13', 'narrator', '你想了一下他知道什么、不知道什么，才开口。', 'You think for a moment about what he does and does not know, and then you speak.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['请', '带'],
          lines: [
            L('l14', 'elder', '「你说什么？」', '"What was that?"'),
            L('l15', 'narrator', '你把话说得慢一点，也说得清楚一点。', 'You say it more slowly, and more clearly.'),
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
            L('l1', 'narrator', '你们跟着土地公，一直走到山上。', 'You follow the earth god all the way up the mountain.'),
            L('l2', 'narrator', '走到一半，前面的路忽然没有了。', 'Halfway up, the road ahead simply stops.'),
            L('l3', 'narrator', '一块很大很大的石头挡在那里，把整条路都挡住了。', 'An enormous stone sits there, blocking the entire road.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'man', '石猴叫了三次。石头不动。', 'Stone Monkey shouts three times. The stone does not move.'),
            L('l5', 'man', '他用两只手去推，石头还是一点也不动。', 'He shoves at it with both hands, and it still does not move an inch.'),
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
            L('l8', 'narrator', '他现在就站在你们后面，一句话也没有说。', 'He is standing right behind the two of you now, not saying a word.'),
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
            L('l9', 'narrator', '想一想：这里谁最了解这座山？', 'Think: who here knows this mountain best?'),
            L('l10', 'narrator', '有办法的那个人，就站在你后面。', 'The person who has the answer is standing right behind you.'),
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
          lines: [L('l14', 'narrator', '你走到石头前面，把手放上去，慢慢地说。', 'You walk up to the stone, put a hand on it, and speak slowly.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['让一让'],
          lines: [
            L('l15', 'narrator', '石头一点也没有动。', 'The stone does not move at all.'),
            L('l16', 'elder', '「再慢一点。」土地公说。', '"Slower," says the earth god.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'Arc one ends here. The road is open, and Stone Monkey has decided he did that.',
          lines: [
            L('l17', 'narrator', '过了很久，石头才终于动了一点点。', 'After a long while, the stone finally shifts, just a little.'),
            L('l18', 'man', '「我就说吧。」石猴说。', '"Told you," says Stone Monkey.'),
          ],
        },
      ],
    },
  },
];
