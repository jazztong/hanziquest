/**
 * The 14 古诗词曲 relics.
 *
 * This list is not a selection we made. It is the exact 默写 inventory named in
 * 《初中统考 华文 考试纲要 (2026)》 JY01, appendix 注①, reproduced with its 册别 and
 * 课次 so a student can line each relic up against the textbook.
 *
 * Every text is public domain (all authors died well over a century ago) and was
 * verified line by line against zh.wikisource.org, then converted to simplified.
 * Variant readings recorded by Wikisource (一作「…」) are dropped in favour of the
 * form that Malaysian 独中 textbooks and 《唐诗三百首》 use.
 *
 * Pinyin is NOT stored here. It is produced at read time by pinyin-pro so the
 * dictionary stays the single authority - see src/lib/lexicon.ts. `polyphonic`
 * flags the places where the classical reading differs from the modern default
 * and the app must teach the exception explicitly.
 */

export interface PoemLine {
  /** The line, simplified, with its original punctuation. */
  zh: string;
  /** Plain-English meaning. This is a gloss for a 13-year-old, not a translation. */
  en: string;
}

export interface PoemNote {
  term: string;
  /** 文言实词 gloss - what the word means *here*. */
  zh: string;
  en: string;
}

export interface Poem {
  id: string;
  title: string;
  titleEn: string;
  author: string;
  dynasty: string;
  /** Where the 纲要 places it. */
  book: string;
  lesson: string;
  /** Which school year the relic unlocks in. */
  year: 1 | 2 | 3;
  form: string;
  lines: PoemLine[];
  /** One paragraph a 13-year-old can hold on to. */
  gist: string;
  /** Why it is worth knowing - the hook, not the moral. */
  hook: string;
  notes: PoemNote[];
  /**
   * Characters in this poem whose reading here is NOT their modern default.
   * These are the 多音字 traps that cost marks in 默写 and 朗读.
   */
  polyphonic: { char: string; reading: string; note: string }[];
  artId: string;
}

export const POEMS: Poem[] = [
  {
    id: 'chile-ge',
    title: '敕勒歌',
    titleEn: 'Song of the Chile Plain',
    author: '北朝民歌',
    dynasty: '北朝',
    book: '初一上册',
    lesson: '第六课',
    year: 1,
    form: '乐府民歌',
    lines: [
      { zh: '敕勒川，阴山下。', en: 'The Chile plain, below the Yin Mountains.' },
      { zh: '天似穹庐，笼盖四野。', en: 'The sky is like a felt tent, covering the whole plain.' },
      { zh: '天苍苍，野茫茫，', en: 'The sky, endlessly blue; the grassland, endlessly wide;' },
      { zh: '风吹草低见牛羊。', en: 'the wind bends the grass down — and there are the cattle and sheep.' },
    ],
    gist:
      'A nomad song about the grassland of northern China. It spends three lines making the world feel enormous and empty, then the wind moves and the animals are suddenly there.',
    hook:
      'The whole poem is one camera move. Wide, wider, widest — then the grass flattens and the shot lands on something alive.',
    notes: [
      { term: '穹庐', zh: '游牧民族居住的圆顶帐篷', en: 'a domed felt tent — a yurt' },
      { term: '笼盖', zh: '像笼子一样罩住', en: 'to cover over, like a lid' },
      { term: '四野', zh: '四面的原野', en: 'the plains on every side' },
    ],
    polyphonic: [
      {
        char: '见',
        reading: 'xiàn',
        note: '通“现”，显露出来。读 xiàn，不读 jiàn。这是本诗最常见的失分点。',
      },
    ],
    artId: 'relic-chile-ge',
  },
  {
    id: 'yin-hu-shang',
    title: '饮湖上初晴后雨',
    titleEn: 'Drinking by the Lake, Clear Then Rain',
    author: '苏轼',
    dynasty: '北宋',
    book: '初一上册',
    lesson: '第六课',
    year: 1,
    form: '七言绝句',
    lines: [
      { zh: '水光潋滟晴方好，', en: 'Sunlight glittering on rippling water — fine weather at its best;' },
      { zh: '山色空蒙雨亦奇。', en: 'hills blurred into mist — the rain is remarkable too.' },
      { zh: '欲把西湖比西子，', en: 'If you compared West Lake to Xi Shi, the great beauty,' },
      { zh: '淡妆浓抹总相宜。', en: 'light make-up or heavy, either would suit her.' },
    ],
    gist:
      'Su Shi says West Lake looks good in sunshine and good in rain, and lands the idea with one comparison: the lake is like a famously beautiful woman who looks good either way.',
    hook:
      'Two lines of description, then one image that makes the description unnecessary. That is the whole trick of a good 绝句.',
    notes: [
      { term: '潋滟', zh: '水波闪动的样子', en: 'water rippling and glinting' },
      { term: '空蒙', zh: '细雨迷茫的样子', en: 'hazy, blurred by fine rain' },
      { term: '西子', zh: '西施，春秋时期著名美女', en: 'Xi Shi, a legendary beauty' },
      { term: '相宜', zh: '合适、适合', en: 'to suit, to be fitting' },
    ],
    polyphonic: [],
    artId: 'relic-yin-hu-shang',
  },
  {
    id: 'chun-ye-xi-yu',
    title: '春夜喜雨',
    titleEn: 'Welcome Rain on a Spring Night',
    author: '杜甫',
    dynasty: '唐',
    book: '初一上册',
    lesson: '第六课',
    year: 1,
    form: '五言律诗',
    lines: [
      { zh: '好雨知时节，当春乃发生。', en: 'Good rain knows its season; when spring comes, it arrives.' },
      { zh: '随风潜入夜，润物细无声。', en: 'It slips in on the wind at night, watering everything so softly you hear nothing.' },
      { zh: '野径云俱黑，江船火独明。', en: 'The country path and the clouds are all black; one lamp on a river boat is the only light.' },
      { zh: '晓看红湿处，花重锦官城。', en: 'At dawn, look where the red is wet — the flowers hang heavy all over Chengdu.' },
    ],
    gist:
      'Du Fu is delighted by rain that falls at exactly the right time and does its work quietly overnight. In the morning the whole city is heavy with wet flowers.',
    hook:
      '润物细无声 — "waters things with no sound at all" — is one of the most quoted lines in Chinese, used for anyone who does good work without making noise about it.',
    notes: [
      { term: '乃', zh: '就、便', en: 'then, thereupon' },
      { term: '潜', zh: '悄悄地', en: 'stealthily, quietly' },
      { term: '润物', zh: '滋润万物', en: 'to moisten and nourish things' },
      { term: '锦官城', zh: '成都的别称', en: 'Brocade City — a name for Chengdu' },
    ],
    polyphonic: [
      { char: '重', reading: 'zhòng', note: '此处指花被雨水打湿而沉重，读 zhòng，不读 chóng。' },
    ],
    artId: 'relic-chun-ye-xi-yu',
  },
  {
    id: 'ci-wu-ye-ti',
    title: '慈乌夜啼',
    titleEn: 'The Devoted Crow Cries at Night',
    author: '白居易',
    dynasty: '唐',
    book: '初一下册',
    lesson: '第十课',
    year: 1,
    form: '五言古诗',
    lines: [
      { zh: '慈乌失其母，哑哑吐哀音。', en: 'A devoted crow has lost its mother, and caws out a grieving sound.' },
      { zh: '昼夜不飞去，经年守故林。', en: 'Day and night it will not fly away; for a whole year it guards the old wood.' },
      { zh: '夜夜夜半啼，闻者为沾襟。', en: 'Every night at midnight it cries, and those who hear it wet their collars with tears.' },
      { zh: '声中如告诉，未尽反哺心。', en: 'In that sound it seems to be saying it never finished repaying its mother.' },
      { zh: '百鸟岂无母，尔独哀怨深？', en: 'Have the other birds no mothers? Why is your grief alone so deep?' },
      { zh: '应是母慈重，使尔悲不任。', en: 'It must be that your mother’s love was so great that your grief is more than you can bear.' },
      { zh: '昔有吴起者，母殁丧不临。', en: 'Long ago there was Wu Qi, who did not attend his own mother’s funeral.' },
      { zh: '嗟哉斯徒辈，其心不如禽！', en: 'Alas for people like that — their hearts are lower than a bird’s.' },
      { zh: '慈乌复慈乌，鸟中之曾参。', en: 'Devoted crow, devoted crow — you are the Zeng Shen of birds.' },
    ],
    gist:
      'Bai Juyi watches a crow mourn its mother for a full year, and uses it to shame a man from history who would not attend his mother’s funeral.',
    hook:
      '反哺 — a young crow feeding its old parent — is the standard Chinese image for repaying your parents. This poem is where most students first meet it.',
    notes: [
      { term: '哑哑', zh: '乌鸦的叫声', en: 'the cawing of a crow' },
      { term: '沾襟', zh: '泪水沾湿衣襟', en: 'tears wetting the front of one’s robe' },
      { term: '反哺', zh: '雏鸟长大后衔食喂母鸟，比喻报答父母', en: 'a grown bird feeding its parent — repaying one’s parents' },
      { term: '殁', zh: '死亡', en: 'to die' },
      { term: '曾参', zh: '孔子弟子，以孝闻名', en: 'Zeng Shen, a disciple of Confucius famous for filial devotion' },
    ],
    polyphonic: [
      { char: '参', reading: 'shēn', note: '人名“曾参”，读 zēng shēn。“曾”不读 céng，“参”不读 cān。' },
      { char: '曾', reading: 'zēng', note: '作姓氏时读 zēng。' },
    ],
    artId: 'relic-ci-wu-ye-ti',
  },
  {
    id: 'song-du-shaofu',
    title: '送杜少府之任蜀州',
    titleEn: 'Seeing Off Magistrate Du to His Post in Shu',
    author: '王勃',
    dynasty: '唐',
    book: '初二上册',
    lesson: '第六课',
    year: 2,
    form: '五言律诗',
    lines: [
      { zh: '城阙辅三秦，风烟望五津。', en: 'The capital’s towers are guarded by the Three Qin lands; through wind and haze I look toward the Five Fords.' },
      { zh: '与君离别意，同是宦游人。', en: 'What I feel parting from you — we are both officials far from home.' },
      { zh: '海内存知己，天涯若比邻。', en: 'If within the four seas you have a true friend, the ends of the earth are next door.' },
      { zh: '无为在歧路，儿女共沾巾。', en: 'So let us not, at this fork in the road, weep like children and soak our handkerchiefs.' },
    ],
    gist:
      'A farewell poem that refuses to be sad. Wang Bo tells his friend that real friendship is not measured in distance, so there is no need for tears at the crossroads.',
    hook:
      '海内存知己，天涯若比邻 is the line Chinese speakers still send when a friend moves abroad. It is 1,300 years old and it is still what people text.',
    notes: [
      { term: '城阙', zh: '城楼，指京城长安', en: 'the watchtowers — meaning the capital, Chang’an' },
      { term: '宦游', zh: '离家在外做官', en: 'travelling away from home to serve as an official' },
      { term: '海内', zh: '四海之内，指全国', en: 'within the four seas — the whole country' },
      { term: '比邻', zh: '近邻', en: 'close neighbours' },
      { term: '无为', zh: '不要', en: 'do not' },
    ],
    polyphonic: [],
    artId: 'relic-song-du-shaofu',
  },
  {
    id: 'guo-gu-ren-zhuang',
    title: '过故人庄',
    titleEn: 'Visiting an Old Friend’s Farm',
    author: '孟浩然',
    dynasty: '唐',
    book: '初二上册',
    lesson: '第六课',
    year: 2,
    form: '五言律诗',
    lines: [
      { zh: '故人具鸡黍，邀我至田家。', en: 'My old friend has prepared chicken and millet, and invited me out to the farm.' },
      { zh: '绿树村边合，青山郭外斜。', en: 'Green trees close in around the village; blue hills slant away beyond the wall.' },
      { zh: '开轩面场圃，把酒话桑麻。', en: 'We open the window onto the threshing floor and vegetable plot, take up our cups, and talk crops.' },
      { zh: '待到重阳日，还来就菊花。', en: 'When the Double Ninth comes round, I will come back again for the chrysanthemums.' },
    ],
    gist:
      'Nothing dramatic happens. A friend cooks, they eat, they look at the fields, they talk about farming, and he promises to come back. That is the point.',
    hook:
      'Almost every line is plain speech, with no ornament at all — and it is one of the most loved poems in the language. Sometimes the skill is in leaving things out.',
    notes: [
      { term: '具', zh: '准备、置办', en: 'to prepare, to lay out' },
      { term: '鸡黍', zh: '鸡肉和黄米饭，指农家饭菜', en: 'chicken and millet — simple country food' },
      { term: '郭', zh: '外城墙', en: 'the outer city wall' },
      { term: '轩', zh: '窗户', en: 'a window' },
      { term: '桑麻', zh: '农事', en: 'mulberry and hemp — farm work in general' },
      { term: '就', zh: '接近、赴', en: 'to go to, to come for' },
    ],
    polyphonic: [],
    artId: 'relic-guo-gu-ren-zhuang',
  },
  {
    id: 'qi-bu-shi',
    title: '七步诗',
    titleEn: 'The Seven-Pace Poem',
    author: '曹植',
    dynasty: '三国',
    book: '初二上册',
    lesson: '第十四课',
    year: 2,
    form: '五言古诗',
    lines: [
      { zh: '煮豆燃豆萁，', en: 'To boil the beans, they burn the beanstalks;' },
      { zh: '豆在釜中泣。', en: 'the beans in the pot weep.' },
      { zh: '本是同根生，', en: 'We grew from the very same root —' },
      { zh: '相煎何太急？', en: 'why be in such a hurry to scald me?' },
    ],
    gist:
      'Cao Zhi’s brother, now emperor, ordered him to produce a poem within seven paces or die. He produced this one, about a fire made of beanstalks boiling the beans that grew beside them.',
    hook:
      'It is an accusation disguised as a kitchen scene, written under a death threat, in about fifteen seconds. 本是同根生，相煎何太急 is still what people say about a family tearing itself apart.',
    notes: [
      { term: '萁', zh: '豆茎', en: 'the beanstalk' },
      { term: '釜', zh: '古代的锅', en: 'an ancient cooking pot' },
      { term: '煎', zh: '煎熬、折磨', en: 'to scald — here, to torment' },
      { term: '何', zh: '为什么', en: 'why' },
    ],
    polyphonic: [],
    artId: 'relic-qi-bu-shi',
  },
  {
    id: 'shui-diao-ge-tou',
    title: '水调歌头',
    titleEn: 'Prelude to Water Melody',
    author: '苏轼',
    dynasty: '北宋',
    book: '初二上册',
    lesson: '第十四课',
    year: 2,
    form: '词',
    lines: [
      { zh: '明月几时有？把酒问青天。', en: 'When did the bright moon first appear? Cup in hand, I ask the blue sky.' },
      { zh: '不知天上宫阙，今夕是何年。', en: 'I wonder, in the palaces up there, what year tonight is.' },
      { zh: '我欲乘风归去，又恐琼楼玉宇，高处不胜寒。', en: 'I want to ride the wind home — but I fear that in those jade towers, it is too cold so high up.' },
      { zh: '起舞弄清影，何似在人间。', en: 'I rise and dance with my own clear shadow. How could that be better than being here among people?' },
      { zh: '转朱阁，低绮户，照无眠。', en: 'It turns past the red pavilion, stoops to the carved window, and shines on the sleepless.' },
      { zh: '不应有恨，何事长向别时圆？', en: 'It should hold no grudge — so why is it always full when we are apart?' },
      { zh: '人有悲欢离合，月有阴晴圆缺，此事古难全。', en: 'People have sorrow and joy, parting and reunion; the moon has dark and clear, full and waning. This has never been perfect, not once in all of history.' },
      { zh: '但愿人长久，千里共婵娟。', en: 'I only wish us long life — and that a thousand miles apart, we share this same beautiful moon.' },
    ],
    gist:
      'Written at Mid-Autumn after drinking all night, missing his brother. Su Shi talks himself out of wanting to escape to heaven and lands on accepting that nothing is ever complete.',
    hook:
      'This is the Mid-Autumn poem. Every year, all over the Chinese-speaking world, somebody quotes 但愿人长久，千里共婵娟 at the family dinner.',
    notes: [
      { term: '把酒', zh: '端起酒杯', en: 'to hold up a wine cup' },
      { term: '宫阙', zh: '宫殿', en: 'palace halls' },
      { term: '琼楼玉宇', zh: '美玉砌成的楼宇，指月宫', en: 'towers of jade — the palace on the moon' },
      { term: '不胜', zh: '经受不住', en: 'unable to bear' },
      { term: '绮户', zh: '雕花的窗户', en: 'a carved, decorated window' },
      { term: '婵娟', zh: '指月亮', en: 'the moon — literally, something lovely' },
    ],
    polyphonic: [
      { char: '胜', reading: 'shēng', note: '“不胜寒”中，古音读 shēng（经受得住）。今多读 shèng，考试以课本注音为准。' },
    ],
    artId: 'relic-shui-diao-ge-tou',
  },
  {
    id: 'yu-mei-ren',
    title: '虞美人',
    titleEn: 'The Beautiful Lady Yu',
    author: '李煜',
    dynasty: '南唐',
    book: '初三上册',
    lesson: '第十三课',
    year: 3,
    form: '词',
    lines: [
      { zh: '春花秋月何时了？往事知多少。', en: 'Spring flowers, autumn moon — when will they ever end? How much of the past do I still know?' },
      { zh: '小楼昨夜又东风，故国不堪回首月明中。', en: 'The east wind blew through my little tower again last night. I cannot bear to look back at my lost country in this moonlight.' },
      { zh: '雕栏玉砌应犹在，只是朱颜改。', en: 'The carved railings and jade steps must still be standing; only the young faces have changed.' },
      { zh: '问君能有几多愁？恰似一江春水向东流。', en: 'Ask me how much sorrow I can hold — exactly as much as a whole river of spring water flowing east.' },
    ],
    gist:
      'Li Yu was a king who lost his kingdom and was kept as a prisoner. He is said to have been executed for writing this.',
    hook:
      'The last line answers "how much sorrow?" with a measurement — a whole river, moving, and never stopping. It is the most famous simile in 词.',
    notes: [
      { term: '了', zh: '结束', en: 'to end, to finish' },
      { term: '不堪', zh: '不能忍受', en: 'cannot bear to' },
      { term: '雕栏玉砌', zh: '雕花的栏杆和玉石台阶，指故国宫殿', en: 'carved railings and jade steps — the old palace' },
      { term: '朱颜', zh: '红润的容颜，指年轻的面容', en: 'rosy faces — youth' },
      { term: '恰似', zh: '正像', en: 'exactly like' },
    ],
    polyphonic: [
      { char: '了', reading: 'liǎo', note: '“何时了”意为“何时结束”，读 liǎo，不读轻声 le。' },
    ],
    artId: 'relic-yu-mei-ren',
  },
  {
    id: 'tian-jing-sha',
    title: '天净沙·秋思',
    titleEn: 'Tune: Clear Sky Over Sand — Autumn Thoughts',
    author: '马致远',
    dynasty: '元',
    book: '初三上册',
    lesson: '第十三课',
    year: 3,
    form: '散曲',
    lines: [
      { zh: '枯藤老树昏鸦，', en: 'Withered vine, old tree, crow at dusk.' },
      { zh: '小桥流水人家，', en: 'Little bridge, running water, somebody’s house.' },
      { zh: '古道西风瘦马。', en: 'Ancient road, west wind, thin horse.' },
      { zh: '夕阳西下，', en: 'The setting sun goes down in the west —' },
      { zh: '断肠人在天涯。', en: 'and the heartbroken traveller is at the edge of the world.' },
    ],
    gist:
      'Nine nouns, no verbs, no explanation — then two lines that tell you what all of it was for. Twenty-eight characters total.',
    hook:
      'It is the most economical poem most students will ever meet. The first three lines are just a list of things. The feeling comes entirely from which things, and in what order.',
    notes: [
      { term: '枯藤', zh: '干枯的藤蔓', en: 'a withered creeping vine' },
      { term: '昏鸦', zh: '黄昏时归巢的乌鸦', en: 'crows at dusk' },
      { term: '断肠人', zh: '形容极度悲伤的人', en: 'someone whose insides are broken — utterly grief-stricken' },
      { term: '天涯', zh: '天边，指极远的地方', en: 'the edge of the sky — very far from home' },
    ],
    polyphonic: [],
    artId: 'relic-tian-jing-sha',
  },
  {
    id: 'chu-sai',
    title: '出塞',
    titleEn: 'Beyond the Frontier',
    author: '王昌龄',
    dynasty: '唐',
    book: '初三下册',
    lesson: '第十三课',
    year: 3,
    form: '七言绝句',
    lines: [
      { zh: '秦时明月汉时关，', en: 'The moon of the Qin, the passes of the Han —' },
      { zh: '万里长征人未还。', en: 'and the men who marched ten thousand li have still not come home.' },
      { zh: '但使龙城飞将在，', en: 'If only the Flying General of Dragon City were still here,' },
      { zh: '不教胡马度阴山。', en: 'he would not let the enemy horses cross the Yin Mountains.' },
    ],
    gist:
      'The same moon and the same mountain passes have been there since the Qin and Han dynasties, and soldiers still are not coming home. The poet wishes for one great general who could end it.',
    hook:
      'The first line collapses eight hundred years into seven characters. That compression is why it is often called the best 七绝 of the Tang.',
    notes: [
      { term: '但使', zh: '只要', en: 'if only, so long as' },
      { term: '龙城飞将', zh: '指汉代名将李广', en: 'the Flying General — Li Guang of the Han' },
      { term: '不教', zh: '不让', en: 'would not allow' },
      { term: '胡马', zh: '北方游牧民族的战马', en: 'the horses of the northern tribes' },
    ],
    polyphonic: [
      { char: '教', reading: 'jiào', note: '“不教”意为“不让”，读 jiào，不读 jiāo。' },
    ],
    artId: 'relic-chu-sai',
  },
  {
    id: 'chun-wang',
    title: '春望',
    titleEn: 'Spring View',
    author: '杜甫',
    dynasty: '唐',
    book: '初三下册',
    lesson: '第十三课',
    year: 3,
    form: '五言律诗',
    lines: [
      { zh: '国破山河在，城春草木深。', en: 'The country is shattered; the mountains and rivers remain. Spring in the city, and the grass and trees grow thick.' },
      { zh: '感时花溅泪，恨别鸟惊心。', en: 'Moved by the times, even the flowers make me weep; hating the separation, even birdsong startles my heart.' },
      { zh: '烽火连三月，家书抵万金。', en: 'The beacon fires have burned for three months straight; a letter from home is worth ten thousand in gold.' },
      { zh: '白头搔更短，浑欲不胜簪。', en: 'I scratch my white head and the hair gets thinner — soon it will not hold a hairpin at all.' },
    ],
    gist:
      'Du Fu is trapped in a captured capital during a rebellion. The city is destroyed but spring arrives anyway, and the contrast is unbearable.',
    hook:
      '国破山河在 works because of one word: 在. The country is gone; the land is still there. Five characters, and the whole poem is already set up.',
    notes: [
      { term: '国破', zh: '国都沦陷', en: 'the capital has fallen' },
      { term: '烽火', zh: '古代边防报警的烟火，指战争', en: 'beacon fires — war' },
      { term: '家书', zh: '家信', en: 'a letter from home' },
      { term: '抵', zh: '相当于、值', en: 'to be worth' },
      { term: '浑欲', zh: '简直要', en: 'almost, practically' },
      { term: '簪', zh: '古人用来固定发髻的针', en: 'a hairpin used to fix a topknot' },
    ],
    polyphonic: [],
    artId: 'relic-chun-wang',
  },
  {
    id: 'guo-ling-ding-yang',
    title: '过零丁洋',
    titleEn: 'Crossing Lingding Ocean',
    author: '文天祥',
    dynasty: '南宋',
    book: '初三下册',
    lesson: '第十三课',
    year: 3,
    form: '七言律诗',
    lines: [
      { zh: '辛苦遭逢起一经，', en: 'Hardship met me from the day one classic text set me on this road;' },
      { zh: '干戈寥落四周星。', en: 'and the fighting has dragged on, scattered and thin, for four long years.' },
      { zh: '山河破碎风飘絮，', en: 'The land is broken like willow fluff scattered on the wind;' },
      { zh: '身世浮沉雨打萍。', en: 'my own life rises and sinks like duckweed struck by rain.' },
      { zh: '惶恐滩头说惶恐，', en: 'At Terror Rapids I spoke of terror;' },
      { zh: '零丁洋里叹零丁。', en: 'on Lingding Ocean I sigh at being alone.' },
      { zh: '人生自古谁无死？', en: 'Since ancient times, who has ever escaped death?' },
      { zh: '留取丹心照汗青。', en: 'Let me leave a loyal heart behind to shine in the pages of history.' },
    ],
    gist:
      'Wen Tianxiang wrote this as a prisoner, after refusing to write a letter persuading another general to surrender. He was executed rather than change his answer.',
    hook:
      'Lines 5 and 6 are a pun that actually happened: he really was captured at a place called 惶恐滩 and really was being shipped across a sea called 零丁洋. The geography did the wordplay for him.',
    notes: [
      { term: '一经', zh: '指精通一种经书而入仕', en: 'one classic — entering office through mastering a classic text' },
      { term: '干戈', zh: '古代兵器，代指战争', en: 'shield and spear — warfare' },
      { term: '寥落', zh: '稀少、冷清', en: 'sparse, desolate' },
      { term: '四周星', zh: '四年', en: 'four full years' },
      { term: '絮', zh: '柳絮', en: 'willow catkins' },
      { term: '萍', zh: '浮萍', en: 'duckweed' },
      { term: '丹心', zh: '赤诚的心', en: 'a red heart — utter loyalty' },
      { term: '汗青', zh: '史册', en: 'the historical record' },
    ],
    polyphonic: [],
    artId: 'relic-guo-ling-ding-yang',
  },
  {
    id: 'man-jiang-hong',
    title: '满江红',
    titleEn: 'The River All Red',
    author: '岳飞',
    dynasty: '南宋',
    book: '初三下册',
    lesson: '第十四课',
    year: 3,
    form: '词',
    lines: [
      { zh: '怒发冲冠，凭栏处、潇潇雨歇。', en: 'Hair bristling against my helmet, I lean on the railing as the drumming rain stops.' },
      { zh: '抬望眼，仰天长啸，壮怀激烈。', en: 'I raise my eyes, howl at the sky, and my ambition burns.' },
      { zh: '三十功名尘与土，八千里路云和月。', en: 'Thirty years of achievement — dust and earth. Eight thousand li of marching — cloud and moon.' },
      { zh: '莫等闲，白了少年头，空悲切。', en: 'Do not idle away your time, let a young head turn white, and be left with nothing but grief.' },
      { zh: '靖康耻，犹未雪；臣子恨，何时灭？', en: 'The humiliation of Jingkang is still not avenged; when will a subject’s hatred be put out?' },
      { zh: '驾长车，踏破贺兰山缺。', en: 'Drive the war chariots, break through the gap in the Helan Mountains.' },
      { zh: '待从头、收拾旧山河，朝天阙。', en: 'And when we have taken back the old land from the beginning, we will report to the emperor’s gate.' },
    ],
    gist:
      'A general’s vow. Yue Fei is furious that captured territory has not been retaken, and swears to take it back before he grows old.',
    hook:
      '莫等闲，白了少年头，空悲切 is the line Chinese parents quote at teenagers. Now you know where it comes from — and that it was originally about a war, not about homework.',
    notes: [
      { term: '怒发冲冠', zh: '愤怒得头发竖起，顶起帽子', en: 'so angry the hair stands and lifts the cap' },
      { term: '潇潇', zh: '形容雨势急骤', en: 'rain falling hard and fast' },
      { term: '等闲', zh: '随便、轻易', en: 'casually, lightly — here, idly' },
      { term: '靖康耻', zh: '靖康之变，北宋二帝被掳的国耻', en: 'the Jingkang Incident, when two Song emperors were captured' },
      { term: '雪', zh: '洗刷、报', en: 'to wipe clean — to avenge' },
      { term: '天阙', zh: '朝廷、皇宫', en: 'the imperial gate — the court' },
    ],
    polyphonic: [
      { char: '朝', reading: 'cháo', note: '“朝天阙”意为“朝见天子”，读 cháo，不读 zhāo。' },
    ],
    artId: 'relic-man-jiang-hong',
  },
];

export const POEMS_BY_ID = new Map(POEMS.map((p) => [p.id, p]));

/** Relics available to a student in a given school year (cumulative). */
export function poemsForYear(year: 1 | 2 | 3): Poem[] {
  return POEMS.filter((p) => p.year <= year);
}

/** Full text of a poem as one string, for coverage checks and 默写 marking. */
export function poemText(p: Poem): string {
  return p.lines.map((l) => l.zh).join('');
}
