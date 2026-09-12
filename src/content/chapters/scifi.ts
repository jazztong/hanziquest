/**
 * 星槎 — Starcraft Junk, arc 1.
 *
 * Original content. The ship takes spoken Chinese commands and obeys exactly
 * what it is told, which turns "say the right words" into the core mechanic
 * rather than a bolted-on drill.
 *
 * Coverage is machine-verified by tests/content.test.ts. Do not tune by eye.
 */
import type { SeedChapter } from './mystery';

const L = (id: string, speaker: string, zh: string, en: string) => ({ id, speaker, zh, en });

export const SCIFI_CHAPTERS: SeedChapter[] = [
  {
    id: 'scifi-1-1',
    genre: 'scifi',
    arc: 1,
    seq: 1,
    band: 1,
    title: '第一课：开门',
    titleEn: 'Chapter One: Open the Door',
    artId: 'scene-scifi-1-1',
    script: {
      start: 'n1',
      glossFadeAt: 0.95,
      minutes: 8,
      properNouns: ['星槎', '船长'],
      targets: [
        { zh: '开', en: 'to open', lineId: 'l3' },
        { zh: '门', en: 'door; hatch', lineId: 'l2' },
        { zh: '慢', en: 'slow; slowly', lineId: 'l7' },
        { zh: '快', en: 'fast; quickly', lineId: 'l8' },
        { zh: '停', en: 'to stop', lineId: 'l11' },
        { zh: '听', en: 'to listen; to obey', lineId: 'l14' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-scifi-1-1',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '这是你上船的第一天，什么都还不懂。', 'It is your first day aboard, and you understand nothing yet.'),
            L('l2', 'narrator', '你走到门前，那扇门关得很紧，一点缝也没有。', 'You walk up to the hatch. It is shut tight, without even a gap.'),
            L('l3', 'system', '「说出来。我就开。」', '"Say it. Then I will open."'),
          ],
        },
        {
          id: 'n2',
          kind: 'speak',
          framing: 'The ship takes spoken commands. Nothing else.',
          targetZh: '开门。',
          targetEn: 'Open the door.',
          passScore: 0.6,
          onPass: 'n3',
          onPartial: 'd1',
          lines: [L('l4', 'narrator', '船在等你开口，你要说什么？', 'The ship is waiting for you to speak. What will you say?')],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n3',
          teaches: ['开门'],
          lines: [
            L('l5', 'system', '「我没听清楚。」', '"I did not hear that clearly."'),
            L('l6', 'narrator', '你深呼吸一下，再说一次，这次慢一点。', 'You take a breath and say it again, more slowly this time.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '门开了。船长说：「太快了，你要说慢一点。」她的意思是什么？',
          promptEn: 'The door opened. The captain says it was "too fast". What does she mean?',
          lines: [
            L('l7', 'elder', '「门开得太快了。」船长说。', '"The door opened too fast," says the captain.'),
            L('l8', 'elder', '「你说得快，它就做得快。」', '"You spoke fast, so it acted fast."'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '我说话的快慢，船也会跟着快慢。',
              en: 'How fast I speak is how fast the ship acts.',
              to: 'n4',
              correct: true,
              feedback:
                'Right. 你说得快，它就做得快 — "you spoke fast, SO it acted fast". 就 is the joint: it links cause to effect.',
            },
            {
              id: 'c2',
              zh: '门坏了。',
              en: 'The door is broken.',
              to: 'd2',
              correct: false,
              feedback: 'Nothing in what she said was about the door being broken. Look at 你说得快 again.',
            },
            {
              id: 'c3',
              zh: '船长不喜欢我。',
              en: 'The captain does not like me.',
              to: 'd2',
              correct: false,
              feedback: 'She is explaining how the ship works, not judging you.',
            },
          ],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['就', '得'],
          lines: [
            L('l9', 'narrator', '看这个字：「就」。', 'Look at this character: 就.'),
            L('l10', 'narrator', '「你说得快，它就做得快」——前面是因，后面是果。', '"You speak fast, SO it acts fast" — cause first, result after.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'elder', '「你说停，它就停。你说开，它就开。」', '"Say stop and it stops. Say open and it opens."'),
            L('l12', 'elder', '「它不知道你想什么，只知道你说什么。」', '"It does not know what you mean, only what you say."'),
          ],
        },
        {
          id: 'n5',
          kind: 'narration',
          next: 'n6',
          lines: [
            L('l13', 'narrator', '你站在原地想了一下，忽然明白了一件事。', 'You stand there thinking, and something suddenly makes sense.'),
            L('l14', 'narrator', '这不是一艘听话的船，而是一艘听字的船——你说什么，它就做什么。', 'This is not a ship that obeys you — it is a ship that obeys words. Whatever you say, it does.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'The ship does exactly what you say — which is only useful once you can say it. Chapter two takes you further in.',
          lines: [
            L('l15', 'elder', '「明天你自己来。」', '"Tomorrow you come on your own."'),
            L('l16', 'narrator', '门在你后面慢慢关上了，一点声音也没有。', 'The hatch closes slowly behind you, without a sound.'),
          ],
        },
      ],
    },
  },

  {
    id: 'scifi-1-2',
    genre: 'scifi',
    arc: 1,
    seq: 2,
    band: 2,
    title: '第二课：不能说的话',
    titleEn: 'Chapter Two: The Words It Will Not Take',
    artId: 'scene-scifi-1-2',
    script: {
      start: 'n1',
      glossFadeAt: 0.95,
      minutes: 9,
      properNouns: ['星槎', '船长'],
      targets: [
        { zh: '能', en: 'can; to be able to', lineId: 'l3' },
        { zh: '为什么', en: 'why', lineId: 'l5' },
        { zh: '知道', en: 'to know', lineId: 'l6' },
        { zh: '以前', en: 'before; in the past', lineId: 'l10' },
        { zh: '别', en: "don't", lineId: 'l12' },
        { zh: '问', en: 'to ask', lineId: 'l13' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-scifi-1-2',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '第二天，船长不在，你一个人来到这里。', 'The next day the captain is away, and you come here on your own.'),
            L('l2', 'narrator', '你试了很多句话，船一句一句都听了，也都做了。', 'You try one line after another, and the ship takes every one of them and acts.'),
            L('l3', 'narrator', '可是有那么一句，不管你怎么说，它都不肯做。', 'But there is one line that, however you say it, it will not do.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'system', '「这句话我不能听。」', '"That one I cannot take."'),
            L('l5', 'you', '「为什么不能？」', '"Why not?"'),
            L('l6', 'system', '「我不知道。」', '"I do not know."'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '船说「我不知道」。一艘什么都记得的船，为什么会不知道？',
          promptEn: 'The ship says it does not know. A ship that remembers everything — why would it not know?',
          lines: [
            L('l7', 'narrator', '这艘船记得每一天发生的事，也记得每一句说过的话。', 'This ship remembers everything that happened on every day, and every line ever spoken to it.'),
            L('l8', 'narrator', '可是只有这一件事，它说它不知道。', 'Yet on this one thing alone, it says it does not know.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '有人不让它知道。',
              en: 'Someone stopped it from knowing.',
              to: 'n4',
              correct: true,
              feedback:
                'Yes. A machine that remembers everything cannot simply forget one thing — so somebody took it away.',
            },
            {
              id: 'c2',
              zh: '这艘船很旧了。',
              en: 'The ship is very old.',
              to: 'd1',
              correct: false,
              feedback:
                'Old would make it forget many things, not exactly one. 每一句话 — it remembers every single line.',
            },
            {
              id: 'c3',
              zh: '它在说谎。',
              en: 'It is lying.',
              to: 'd1',
              correct: false,
              feedback:
                'Possible — but look at 我不知道 again. It did not refuse to say. It said it does not have it.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['每', '不能', '不知道'],
          lines: [
            L('l9', 'narrator', '「每一句话」的意思是：一句也不会忘。', '"Every single line" — it forgets none of them.'),
            L('l10', 'narrator', '所以它说「不知道」，不是忘了，而是以前有人把这件事拿走了。', 'So when it says "I do not know", it has not forgotten — someone took that away from it before.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l11', 'elder', '船长走过来，看了你一眼。', 'The captain comes over and looks at you.'),
            L('l12', 'elder', '「别问了。」', '"Stop asking."'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'She is not going to answer unless you ask straight.',
          targetZh: '你知道，对不对？',
          targetEn: 'You know, don’t you?',
          passScore: 0.6,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l13', 'narrator', '你知道不该再问，可是你还是问了。', 'You know you should stop asking, and you ask anyway.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['对不对'],
          lines: [
            L('l14', 'elder', '「什么？」', '"What?"'),
            L('l15', 'narrator', '你看着她的眼睛，又问了一次。', 'You look her in the eye and ask again.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'She knows. She is not saying — yet. Chapter three is behind the sealed hold.',
          lines: [
            L('l16', 'elder', '她很久没有说话。', 'She says nothing for a long time.'),
            L('l17', 'elder', '「我知道。可是现在不能说。」', '"I know. But I cannot say it now."'),
          ],
        },
      ],
    },
  },

  {
    id: 'scifi-1-3',
    genre: 'scifi',
    arc: 1,
    seq: 3,
    band: 2,
    title: '第三课：后面的门',
    titleEn: 'Chapter Three: The Hatch at the Back',
    artId: 'scene-scifi-1-3',
    script: {
      start: 'n1',
      glossFadeAt: 0.94,
      minutes: 10,
      properNouns: ['星槎', '船长'],
      targets: [
        { zh: '后面', en: 'behind; at the back', lineId: 'l2' },
        { zh: '声音', en: 'sound; voice', lineId: 'l4' },
        { zh: '里面', en: 'inside', lineId: 'l5' },
        { zh: '应该', en: 'should; ought to', lineId: 'l9' },
        { zh: '一样', en: 'the same', lineId: 'l11' },
        { zh: '自己', en: 'oneself', lineId: 'l15' },
      ],
      nodes: [
        {
          id: 'n1',
          kind: 'narration',
          artId: 'scene-scifi-1-3',
          next: 'n2',
          lines: [
            L('l1', 'narrator', '这艘船的后面还有一个门，你从来没有走过去。', 'There is another hatch at the back of this ship, and you have never walked over to it.'),
            L('l2', 'narrator', '从你上船的那天起，那个门就一直关着。', 'From the day you came aboard, that hatch has been shut.'),
            L('l3', 'narrator', '今天晚上大家都睡了，你一个人走过去，靠在门上听。', 'Tonight, with everyone asleep, you go over alone and lean against it to listen.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'narrator', '里面有声音，很小，可是的确有声音。', 'There is a sound inside — very faint, but there.'),
            L('l5', 'narrator', '你安静下来再听一次，那是有人在说话的声音。', 'You go still and listen again: it is the sound of someone talking.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '船上只有你和船长两个人。里面为什么会有说话的声音？',
          promptEn: 'Only you and the captain are aboard. So why is there a voice inside?',
          lines: [
            L('l6', 'narrator', '这艘船上只有两个人：一个是你，一个是船长。', 'There are only two people on this ship: you, and the captain.'),
            L('l7', 'narrator', '船长在前面睡着，而你就站在这里。', 'The captain is asleep up front, and you are standing right here.'),
          ],
          choices: [
            {
              id: 'c1',
              zh: '里面还有别人，或者别的东西。',
              en: 'There is somebody — or something — else inside.',
              to: 'n4',
              correct: true,
              feedback:
                'Both people are accounted for, so the voice is a third thing. That is the whole shape of the deduction.',
            },
            {
              id: 'c2',
              zh: '那是船长的声音。',
              en: 'It is the captain’s voice.',
              to: 'd1',
              correct: false,
              feedback: '船长在前面 — she is up front, and you are at the back.',
            },
            {
              id: 'c3',
              zh: '我听错了。',
              en: 'I misheard.',
              to: 'd1',
              correct: false,
              feedback: '你听得出来 — "you could make it out". The story is telling you the sound is real.',
            },
          ],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n4',
          teaches: ['只有', '得出来'],
          lines: [
            L('l8', 'narrator', '「只有两个人」的意思是：不多不少，就是两个。', '"Only two people" — not more, not fewer. Exactly two.'),
            L('l9', 'narrator', '两个人都不在这里，那么这个声音就应该是别的什么。', 'Neither of them is here, so that voice has to belong to something else.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l10', 'narrator', '你把手放在那扇门上，又听了一次。', 'You put your hand flat on the hatch and listen once more.'),
            L('l11', 'narrator', '那个声音，和船平时说话的声音完全一样。', 'That voice sounds exactly the same as the ship when it speaks to you.'),
          ],
        },
        {
          id: 'n5',
          kind: 'speak',
          framing: 'If it is the ship, it will answer to the ship’s name.',
          targetZh: '星槎，是你吗？',
          targetEn: 'Xingcha, is that you?',
          passScore: 0.65,
          onPass: 'n6',
          onPartial: 'd2',
          lines: [L('l12', 'narrator', '你轻轻地、小声地问了一句。', 'You ask, very quietly.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['是你吗'],
          lines: [
            L('l13', 'narrator', '里面安静了下来，没有人回答你。', 'It goes quiet inside. Nothing answers you.'),
            L('l14', 'narrator', '你再问一次，这次说得清楚一点。', 'You ask again, more clearly this time.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'Arc one ends here. There is a second voice aboard, and it has the ship’s own.',
          lines: [
            L('l15', 'system', '「是我。」', '"It is me."'),
            L('l16', 'system', '「也不是我。」', '"And it is not me."'),
          ],
        },
      ],
    },
  },
];
