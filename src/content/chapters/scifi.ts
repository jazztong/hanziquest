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
            L('l1', 'narrator', '这是你的第一天。', 'This is your first day.'),
            L('l2', 'narrator', '你走到门前。门是关着的。', 'You walk up to the hatch. It is shut.'),
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
          lines: [L('l4', 'narrator', '你要说什么？', 'What will you say?')],
        },
        {
          id: 'd1',
          kind: 'detour',
          rejoin: 'n3',
          teaches: ['开门'],
          lines: [
            L('l5', 'system', '「我没听清楚。」', '"I did not hear that clearly."'),
            L('l6', 'narrator', '你再说一次，慢一点。', 'You say it again, more slowly.'),
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
            L('l13', 'narrator', '你想了一下。', 'You think about that for a moment.'),
            L('l14', 'narrator', '这不是一艘会听话的船。这是一艘会听字的船。', 'This is not a ship that obeys you. It is a ship that obeys words.'),
          ],
        },
        {
          id: 'n6',
          kind: 'end',
          outro:
            'The ship does exactly what you say — which is only useful once you can say it. Chapter two takes you further in.',
          lines: [
            L('l15', 'elder', '「明天你自己来。」', '"Tomorrow you come on your own."'),
            L('l16', 'narrator', '门在你后面关上了。', 'The hatch closes behind you.'),
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
            L('l1', 'narrator', '第二天，你一个人来了。', 'The next day, you come alone.'),
            L('l2', 'narrator', '你试了很多话。船都听了。', 'You try many commands. The ship takes them all.'),
            L('l3', 'narrator', '可是有一句，它不能做。', 'But there is one it will not do.'),
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
            L('l7', 'narrator', '这艘船记得每一天，每一句话。', 'This ship remembers every day and every word.'),
            L('l8', 'narrator', '可是这一件事，它说它不知道。', 'But this one thing, it says it does not know.'),
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
            L('l9', 'narrator', '「每一句话」——一句也不会忘。', '"Every single line" — it forgets none of them.'),
            L('l10', 'narrator', '所以「不知道」不是忘了，是以前有人拿走了。', 'So "does not know" is not forgetting. Someone took it away before.'),
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
          lines: [L('l13', 'narrator', '你没有停。你问了。', 'You do not stop. You ask.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['对不对'],
          lines: [
            L('l14', 'elder', '「什么？」', '"What?"'),
            L('l15', 'narrator', '你看着她，再问一次。', 'You look at her and ask again.'),
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
            L('l1', 'narrator', '船的后面有一个门。', 'There is a hatch at the back of the ship.'),
            L('l2', 'narrator', '这个门一直是关着的。', 'That hatch has always been shut.'),
            L('l3', 'narrator', '今天晚上，你走过去听。', 'Tonight, you go over and listen.'),
          ],
        },
        {
          id: 'n2',
          kind: 'narration',
          next: 'n3',
          lines: [
            L('l4', 'narrator', '里面有声音。', 'There is a sound inside.'),
            L('l5', 'narrator', '很小，可是你听得出来：那是说话的声音。', 'Very small, but you can make it out: it is the sound of speaking.'),
          ],
        },
        {
          id: 'n3',
          kind: 'choice',
          promptZh: '船上只有你和船长两个人。里面为什么会有说话的声音？',
          promptEn: 'Only you and the captain are aboard. So why is there a voice inside?',
          lines: [
            L('l6', 'narrator', '船上只有两个人：你，和船长。', 'There are only two people aboard: you, and the captain.'),
            L('l7', 'narrator', '船长在前面。你在这里。', 'The captain is up front. You are here.'),
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
            L('l8', 'narrator', '「只有两个人」——不多不少，就是两个。', '"Only two people" — not more, not fewer. Exactly two.'),
            L('l9', 'narrator', '两个人都不在这里，那声音就应该是别的。', 'Both are elsewhere, so the voice should be something else.'),
          ],
        },
        {
          id: 'n4',
          kind: 'narration',
          next: 'n5',
          lines: [
            L('l10', 'narrator', '你把手放在门上，再听一次。', 'You put your hand on the hatch and listen again.'),
            L('l11', 'narrator', '那个声音，和船说话的声音一样。', 'That voice sounds the same as the ship’s.'),
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
          lines: [L('l12', 'narrator', '你小声问。', 'You ask quietly.')],
        },
        {
          id: 'd2',
          kind: 'detour',
          rejoin: 'n6',
          teaches: ['是你吗'],
          lines: [
            L('l13', 'narrator', '里面没有回答。', 'Nothing answers.'),
            L('l14', 'narrator', '你再问一次，说清楚一点。', 'You ask again, more clearly.'),
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
