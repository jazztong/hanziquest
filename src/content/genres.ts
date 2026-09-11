/**
 * The four story genres, their avatars, and their starting story bibles.
 *
 * The bible is what keeps chapter 9 consistent with chapter 2. It is stored per
 * (user, genre) in the database and updated as the campaign runs; this file is
 * only the seed state.
 */

export interface CastMember {
  id: string;
  /** Speaker id used in chapter scripts - must match a voice role in providers/tts.ts. */
  voice: 'narrator' | 'you' | 'auntie' | 'man' | 'elder' | 'child' | 'system';
  nameZh: string;
  nameEn: string;
  /** Permanently glossed for the player - names are never quizzed. */
  noteEn: string;
  artId?: string;
}

export interface StoryBible {
  premiseZh: string;
  premiseEn: string;
  settingEn: string;
  cast: CastMember[];
  /** Open plot threads, in English, for generation context. */
  threads: string[];
  /** Running summary of what has happened. */
  recap: string;
  /** Things the story must never do, handed to generation verbatim. */
  guardrails: string[];
}

export interface Genre {
  id: 'mystery' | 'scifi' | 'wuxia' | 'legend';
  nameZh: string;
  nameEn: string;
  tagline: string;
  /** For the genre picker card. */
  hook: string;
  mapArtId: string;
  bossArtId: string;
  bible: StoryBible;
}

/** Shared rules. The brief: suitable for 13, no gore, no romance. */
const GUARDRAILS = [
  'The reader is 13. Adventure, mystery, stakes and peril are welcome.',
  'No gore, no on-screen injury or death, no romance, no horror imagery.',
  'The player is the protagonist and is addressed as 你. Never name or describe them.',
  'Nobody is ever humiliated for getting something wrong.',
  'Settings are Malaysian unless the genre is explicitly historical Chinese.',
];

export const GENRES: Genre[] = [
  {
    id: 'mystery',
    nameZh: '雨城档案',
    nameEn: 'Rain City Files',
    tagline: 'Somebody is lying. The evidence is in Chinese.',
    hook:
      'Klang after dark. Shuttered shops, wet five-foot-ways, and a shopkeeper who says nobody came. Every clue is a sentence you have to actually read.',
    mapArtId: 'map-mystery',
    bossArtId: 'boss-mystery',
    bible: {
      premiseZh: '你是一个喜欢观察的中学生。你发现镇上的一家老店里，有人在说谎。',
      premiseEn:
        'You are a secondary-school student with a habit of noticing things. An old shop in your town holds a small, careful lie, and you have decided to find out why.',
      settingEn:
        'Present-day Klang, Selangor. Shophouses, kopitiams, monsoon drains, the KTM line, a river that floods.',
      cast: [
        {
          id: 'auntie',
          voice: 'auntie',
          nameZh: '林阿姨',
          nameEn: 'Auntie Lim',
          noteEn: 'Runs the old shop. Guarded, tired, and protecting someone.',
          artId: 'char-mystery-auntie',
        },
        {
          id: 'man',
          voice: 'man',
          nameZh: '车里的人',
          nameEn: 'The man in the car',
          noteEn: 'Watches the shop from a black car. Auntie Lim says she does not know him.',
          artId: 'char-mystery-son',
        },
      ],
      threads: [
        'Who walked into the shop on the rainy night, and why did they leave a dry umbrella?',
        'Why does Auntie Lim deny knowing the man in the black car?',
        'What is behind the shop door she keeps closed?',
      ],
      recap: 'Arc one: you found water inside a shop that had no visitors, a dry umbrella on a wet day, and a man Auntie Lim says is her son.',
      guardrails: [
        ...GUARDRAILS,
        'No crime beyond small deception and family secrets. No violence, no police, no danger to children.',
      ],
    },
  },
  {
    id: 'scifi',
    nameZh: '星槎',
    nameEn: 'Starcraft Junk',
    tagline: 'The ship only answers to spoken Chinese.',
    hook:
      'An orbital kampung above the Straits. You crew a solar-sail junk whose systems were written in Chinese by people who are no longer around to explain them.',
    mapArtId: 'map-scifi',
    bossArtId: 'boss-scifi',
    bible: {
      premiseZh: '你在一艘旧飞船上工作。飞船的系统只听中文。',
      premiseEn:
        'You work aboard an ageing solar-sail junk. Every system on it takes spoken Chinese commands, and the manuals are in Chinese too.',
      settingEn:
        'Near-future Southeast Asia. Orbital platforms over the Malacca Strait, biotech mangroves, salvage markets.',
      cast: [
        {
          id: 'elder',
          voice: 'elder',
          nameZh: '船长',
          nameEn: 'The Captain',
          noteEn: 'Runs the junk. Speaks slowly and expects you to keep up.',
          artId: 'char-scifi-captain',
        },
        {
          id: 'system',
          voice: 'system',
          nameZh: '星槎',
          nameEn: 'Xingcha (the ship)',
          noteEn: 'The ship itself. Literal-minded. Obeys exactly what you say, not what you meant.',
          artId: 'char-scifi-ship',
        },
      ],
      threads: [
        'Why does the ship refuse one particular command?',
        'What is in the sealed cargo hold?',
        'Who wrote the ship’s oldest logs?',
      ],
      recap: 'Arc one has not started yet.',
      guardrails: [...GUARDRAILS, 'No weapons fire aimed at people. Danger comes from systems, weather and vacuum.'],
    },
  },
  {
    id: 'wuxia',
    nameZh: '南洋武林',
    nameEn: 'Nanyang Martial World',
    tagline: 'Every technique is a line you have to say correctly.',
    hook:
      '武侠 transplanted to the Straits: limestone karst, river towns, rubber estates. You are a new disciple, and the school’s techniques are written as poems.',
    mapArtId: 'map-wuxia',
    bossArtId: 'boss-wuxia',
    bible: {
      premiseZh: '你是一个新弟子。门派的武功都写成诗，念对了才有用。',
      premiseEn:
        'You are a new disciple at a small school. Its techniques are recorded as verse; a line said correctly works, and a line said carelessly does not.',
      settingEn:
        'A Straits-Chinese martial world: limestone hills, river towns, tin country, Peranakan courtyards.',
      cast: [
        {
          id: 'elder',
          voice: 'elder',
          nameZh: '师父',
          nameEn: 'Shifu',
          noteEn: 'Your teacher. Says very little and means all of it.',
          artId: 'char-wuxia-shifu',
        },
        {
          id: 'child',
          voice: 'child',
          nameZh: '小师妹',
          nameEn: 'Junior Sister',
          noteEn: 'Joined a year before you and will not let you forget it.',
          artId: 'char-wuxia-sister',
        },
      ],
      threads: [
        'Which line of the school’s founding verse is missing?',
        'Why will Shifu not teach the third technique?',
      ],
      recap: 'Arc one has not started yet.',
      guardrails: [
        ...GUARDRAILS,
        'Combat is stylised and bloodless - deflection, footwork, disarming. Nobody is wounded on screen.',
      ],
    },
  },
  {
    id: 'legend',
    nameZh: '山海行',
    nameEn: 'Journey of Mountains and Seas',
    tagline: 'The old stories are real, and they are behind schedule.',
    hook:
      '西游记 and 三国 energy, run through Southeast Asia. You are handed a celestial errand nobody else wanted, and the paperwork is in classical Chinese.',
    mapArtId: 'map-legend',
    bossArtId: 'boss-legend',
    bible: {
      premiseZh: '天上的一份差事落到你手上。你要走一趟山海之间。',
      premiseEn:
        'A minor celestial errand has landed on you. It involves a long walk, several arguments, and at least one creature that should not exist.',
      settingEn:
        'A mythic Southeast Asia: cloud seas, temple gates, bronze vessels, a celestial bureaucracy that runs on forms.',
      cast: [
        {
          id: 'man',
          voice: 'man',
          nameZh: '石猴',
          nameEn: 'Stone Monkey',
          noteEn: 'Travelling companion. Extremely confident, frequently wrong.',
          artId: 'char-legend-monkey',
        },
        {
          id: 'elder',
          voice: 'elder',
          nameZh: '土地公',
          nameEn: 'The Earth God',
          noteEn: 'Local deity. Knows everything about his own hill and nothing beyond it.',
          artId: 'char-legend-earthgod',
        },
      ],
      threads: [
        'What is actually written on the errand scroll?',
        'Why will the mountain not let you pass?',
      ],
      recap: 'Arc one has not started yet.',
      guardrails: [
        ...GUARDRAILS,
        'Monsters are strange and funny rather than frightening. Nothing is eaten alive.',
      ],
    },
  },
];

export const GENRES_BY_ID = new Map(GENRES.map((g) => [g.id, g]));

/** Avatars are genre-neutral: the player keeps theirs when switching genre. */
export const AVATARS = [
  { id: 'avatar-01', nameEn: 'The Quiet One', artId: 'avatar-01' },
  { id: 'avatar-02', nameEn: 'The Fast Talker', artId: 'avatar-02' },
  { id: 'avatar-03', nameEn: 'The Note Taker', artId: 'avatar-03' },
  { id: 'avatar-04', nameEn: 'The Climber', artId: 'avatar-04' },
  { id: 'avatar-05', nameEn: 'The Listener', artId: 'avatar-05' },
  { id: 'avatar-06', nameEn: 'The Stubborn One', artId: 'avatar-06' },
];
