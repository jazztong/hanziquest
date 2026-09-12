# Phase 0 Research — 华文 Learning Game for UEC 初中 Track

**Compiled:** 2026-09-12
**Student context:** 13, 初一 at a Malaysian 独中. 6-year UEC track. Strong English, weak Chinese. 初二 begins Jan 2027; 初中统考 华文 falls at end of 初三 (Oct 2028).

**Confidence key:** ✅ verified against a primary source · ⚠️ inferred / secondary source · ❓ unverified assumption (decision logged in `docs/decisions.md`)

---

## 1. 董总 初中华文 curriculum scope

**Source (primary):** 《马来西亚华文独立中学 初中华文课程标准》, 董教总全国华文独中工委会统一课程委员会, 2016年5月.
Retrieved from Dong Zong E-Learning → 独中课程标准 (MICSS Curriculum Standards), course id 384, resource id 8790.
`https://elearning.dongzong.my/pluginfile.php/56921/mod_resource/content/2/初中华文课程标准.pdf` ✅

### 1.1 Structure of the course ✅

- 3 school years, **~32 teaching weeks/year, 6 periods/week, 40 min/period** (≈ 640 periods over 初中).
- Six competence strands run through all three years:
  1. 聆听与说话 (listening & speaking)
  2. 阅读 (reading)
  3. 写作 (writing)
  4. 思维 (thinking)
  5. 文学与文化 (literature & culture)
  6. 语文基础知识 (language knowledge)
- Textbooks are organised **by thematic unit**; each unit carries a theme, 课文 (required + 选读), 注释, 作者简介, 学习提示, 阅读理解练习, 延伸学习.

### 1.2 白话文 : 文言文 ratio mandated by the standard ✅

| 年级 | 白话文 | 文言文 |
|---|---|---|
| 初中一 | 80% | 20% |
| 初中二 | 80% | 20% |
| 初中三 | 70% | 30% |

> **Build implication:** the story campaign should carry a matching classical-language share — ~20% of 初一/初二 content should touch 文言/古诗 (delivered as "relics"), rising to 30% in 初三. Not 0%.

### 1.3 初中一 scope (what the student is being examined on *now*) ✅

**聆听与说话** — discriminate 读音 and 语调 by ear; understand dialogue, questions, instructions, stories, 诗文; retell; self-introduction, storytelling, 朗读诗文, tongue-twisters, explaining game rules.

**阅读** — skim/close-read; summarise 段意 and 中心思想; 记叙文 elements and 记叙顺序; modern literary genres; 古代诗文 content + recitation of set pieces; use reference works.

**写作** — 记叙文, 日记, 周记, 阅读报告, 应用文 (书信、便条); 审题; 编写提纲; 中心思想; 记叙要素; 顺叙/倒叙/插叙; 续写; observation habit.

**思维** — 概括, 比较.

**文学与文化** — 现代散文; 民间故事/寓言/神话; 古代诗文 characteristics; authors; cultural knowledge (天文, 服饰, 饮食, 节庆, 建筑, 童玩).

**语文基础知识** ← *this is the item-bank taxonomy for 初一*:
- 1.6.1 规范的汉字字形
- 1.6.2 声韵调 (声母、韵母、声调)
- 1.6.3 音变规律 — “一”“不”“啊” 变调, 上声连读变调
- 1.6.4 **多音多义字**
- 1.6.5 一词多义 / 多义词
- 1.6.6 成语与格言
- 1.6.7 词性 — 实词 (名、动、形、代、数、量) and 虚词 (副、连、介、助、叹、拟声)
- 1.6.8 标点符号 (15 marks: 句号、问号、叹号、逗号、顿号、分号、冒号、引号、括号、书名号、破折号、连接号、省略号、间隔号、着重号)
- 1.6.9 修辞 — 比喻、比拟、借代、引用、夸张

### 1.4 初中二 scope (starting Jan 2027) ✅

**阅读** adds: 文章结构 / 详写与略写; 记叙中结合描写; **说明文 — 说明顺序与方法**; 古代汉语 (一词多义、古今异义).
**写作** adds: 记叙文、**说明文**、应用文 (**公函、启事**); 详略; 层次 (开头、结尾、过渡); 记叙人称; 静态/动态说明; 时间/空间/逻辑顺序; 说明方法 (举例子、作比较、打比方、列数字、下定义、引资料、列图表); 摘录要点.
**思维**: 分析, 判断.
**文学与文化**: 现代诗歌, 古代小说.
**语文基础知识**:
- 2.6.1 造字法 (象形、指事、会意、形声)
- 2.6.2 汉字形体演变
- 2.6.3 轻声与儿化
- 2.6.4 词的感情色彩
- 2.6.5 谚语与歇后语
- 2.6.6 **短语结构类型** (联合、偏正、动宾、主谓、谓补)
- 2.6.7 修辞 — 回文、顶真、设问、反问

### 1.5 初中三 scope (2028) ✅

议论文 (论点/论据/论证), 通假字, 词类活用, 人物描写四法, 夹叙夹议, 缩写/扩写, 应用文 (通告), 句子成分, **复句八类** (联合、承接、递进、选择、转折、假设、因果、条件), 修辞 (排比、反复、对偶、对比), 现代小说, 古代词曲.

> **Build implication — item-bank taxonomy.** Tag every generated item with `{strand, year, standardRef}` using the exact clause numbers above (e.g. `1.6.9-比喻`). This makes the parent dashboard auditable against the official standard and lets the engine serve 初一 items now and unlock 初二 items in Jan 2027.

---

## 2. 初中统考 华文 (JY01) paper format — the boss-battle blueprint

**Source (primary):** 《马来西亚全国华文独中初中统一考试 华文 考试纲要 (2026年)》, 文件编号 JY01, 公布日期 23/3/2021.
`https://uec.dongzong.my/wp-content/uploads/2026/07/J01-2026-0623.pdf` ✅

### 2.1 Paper structure ✅

| Paper | Component | Weight | Time |
|---|---|---|---|
| **试卷一 写作** | 甲组 **作文** — 5 questions, answer 1 (命题作文 / 半命题作文) | **30%** | 1h45m total |
| | 乙组 **应用文** — 2 questions, answer 1 | **10%** | |
| **试卷二 语文测验** | 甲组 **语文基础知识** — 选择题 5% + 简答题 10% | **15%** | 1h30m total |
| | 乙组 **现代文阅读** — 2 passages, 15% each | **30%** | |
| | 丙组 **文言文阅读** — 课内 6% + 课外 9% | **15%** | |

**Confirmed timing (2026 timetable, 52nd UEC):** 华文 (JY01) sat 22 Oct 2026. 试卷一 8.30–10.15am (1h45m), 试卷二 10.30am–12.00pm (1h30m). Candidates leave the hall between papers and may not consult 试卷一 while sitting 试卷二. ✅
`https://uec.dongzong.my/wp-content/uploads/2026/07/2026-KS-Time-J.pdf`

> **This student's 统考 sitting:** 初三 in 2028 → the 54th UEC, expected **3rd–4th week of October 2028**. Seeded as `2028-10-24` (placeholder, parent-editable). ⚠️

### 2.2 Marking rubrics ✅

**作文 (30%)** — five official criteria, which become the AI marking rubric verbatim:
| Dimension | Official wording |
|---|---|
| 内容 | 切题、立意正确、中心突出、内容充实、有新意 |
| 语言 | 准确、简洁、流畅、生动 |
| 结构 | 层次分明、条理清楚、详略得当 |
| 技术 | 文字规范、标点符号正确、按要求拟题 |
| 篇幅 | **文长至少 400 字** |

**应用文 (10%)** — 内容 (完整、精简) · 格式 (符合格式规范) · 语言 (通顺简洁、措辞得体) · 技术 (文字规范、标点符号正确).

### 2.3 Examinable content (the item-bank spine) ✅

**作文** — 记叙文、说明文、议论文 文体知识; 规范的汉字; 标点符号.

**应用文** — only **three** formats are examinable, each with a fully specified layout (reproduced in the 纲要 appendix with worked samples):
- **公函** — 邀请类, 请求/申请类
- **通告** — 吁请类, 通知类
- **启事** — 征招类, 寻访类

Format elements that carry marks (from the appendix):
- 通告: 日期(右上) → 致:对象 → 标题(加横线, 无句号) → 正文(首段末段不编号, 中间段编 2. 3. 4.) → 署名(单位/职衔 → 姓名+启 → 括号正楷姓名)
- 启事: 启事者地址(左上) → 分隔横线 → 日期(右) → 标题 → 正文 → 署名
- 公函: 发信人地址 → 分隔横线 → 收信人姓名及地址 → 发信日期(右) → 称呼(加冒号) → 标题 → 正文 → 署名

> **Build implication:** 应用文 quests can be *deterministically* marked on format (a structural checker), with AI only marking 内容/语言. That gives reliable scoring with no API key.

**语文基础知识** examinable inventory:
- 3.1 语音与汉字 — 华语的声韵调; 规范的汉字
- 3.2 词语 — 词语(含成语)的含义; 感情色彩
- 3.3 句子 — **单句成分: 主、谓、宾、定、状、补**; **复句类型 (8): 并列、承接、递进、选择、转折、因果、假设、条件**
- 3.4 修辞 — **13 devices**: 比喻、比拟、借代、引用、夸张、回文、顶真、设问、反问、排比、反复、对偶、对比
- 3.5 古典文学 — 默写 初中课本要求背诵的古典诗词曲

**现代文阅读** — passage lengths are specified:
| 文体 | 字数 |
|---|---|
| 记叙类 | 800–900 |
| 说明类 | 700–800 |
| 议论类 | 700–800 |

Question targets: 词语基本义/引申义/比喻义; 文本要素 (记叙: 人物/时间/地点/起因/经过/结果 · 说明: 对象/特征/方法 · 议论: 论点/论据/论证); 文本思路 (顺叙/倒叙/插叙 · 时间/空间/逻辑 · 总分/并列); 文本结构 (开篇点题、前后呼应); 写作方法 (人物描写: 外貌/动作/语言/心理 · 说明方法: 下定义/作解释/打比方/列数字/举例子/作比较 · 论证方法: 举例/道理/比喻/对比).

**文言文阅读** — 课内 ≤200字, 课外 ~150字; 文言实词; 译为白话文; 提取/概括/说明; 归纳中心思想.

### 2.4 默写 list — the 14 "relic" poems ✅

The 纲要 names exactly which poems are recitation-examinable, with book and lesson:

| 册别 | 课次 | 题目 |
|---|---|---|
| 初一上册 | 第六课 | 敕勒歌 |
| 初一上册 | 第六课 | 饮湖上初晴后雨 |
| 初一上册 | 第六课 | 春夜喜雨 |
| 初一下册 | 第十课 | 慈乌夜啼 |
| 初二上册 | 第六课 | 送杜少府之任蜀州 |
| 初二上册 | 第六课 | 过故人庄 |
| 初二上册 | 第十四课 | 七步诗 |
| 初二上册 | 第十四课 | 水调歌头 |
| 初三上册 | 第十三课 | 虞美人 |
| 初三上册 | 第十三课 | 天净沙·秋思 |
| 初三下册 | 第十三课 | 出塞 |
| 初三下册 | 第十三课 | 春望 |
| 初三下册 | 第十三课 | 过零丁洋 |
| 初三下册 | 第十四课 | 满江红 |

> **Build implication:** this is a *closed, known set of 14*. Every one becomes a 古诗文 relic with art, line-by-line audio, English meaning, cloze recall and recite-and-check. All 14 are public-domain classical poems, so the texts themselves can ship in the repo (unlike textbook prose). Relics 1–4 are 初一/初二-adjacent and unlock first.

---

## 3. 独中 校内 初一/初二 期中/期末 format ⚠️

No official 董总 document governs internal school exams — each 独中 sets its own, and this student's school does not publish its paper structure. Commercial 模拟卷 for 独中初一年终考 (e.g. Zekolah CIS Junior 1 Year-End) are built to mirror the 统考 shape.

**Defensible assumption adopted** ⚠️: internal 初一/初二 papers are a **scaled-down 统考**:
- 试卷一 写作: 作文 (~300字 at 初一, ~350字 at 初二) + 应用文 (书信/便条 at 初一; 公函/启事 at 初二, matching curriculum 1.3.1 / 2.3.1)
- 试卷二 语文测验: 语文基础知识 + 现代文阅读 (shorter passages: ~500–600字 at 初一) + **课内 文言文/古诗** (weighted more heavily than 统考, because internal exams test the term's 课文)
- The big difference from 统考: internal papers are **课内-heavy** — they test the specific 课文 taught that term. This is precisely why the **课文 companion (lesson upload)** matters more than generic drills for exam-readiness.

Boss battles therefore come in two blueprints: `school-exam` (课内-weighted, shorter) and `uec-mock` (the exact 30/10/15/30/15 split above).

---

## 4. Baseline scale — HSK 3.0 and the native benchmark

### 4.1 HSK 3.0 / 《国际中文教育中文水平等级标准》 GF 0025-2021 ✅

Issued by China's Ministry of Education / 国家语委, effective 1 July 2021. Replaces the 6-level HSK 2.0 with a **"三等九级"** scheme: 初等 (1–3), 中等 (4–6), 高等 (7–9).

Headline quantities (the standard's own totals):
| Band | 音节 | 汉字 | 词语 | 语法点 |
|---|---|---|---|---|
| 1 | 269 | 300 | 500 | 48 |
| 2 | 468 | 600 | 1,272 | 129 |
| 3 | 608 | 900 | 2,245 | 210 |
| 4 | 724 | 1,200 | 3,245 | 286 |
| 5 | 822 | 1,500 | 4,316 | 357 |
| 6 | 908 | 1,800 | 5,456 | 424 |
| 7–9 | 1,110 | 3,000 | 11,092 | 572 |

⚠️ Figures are the widely-reproduced totals from the published standard; the character/word inventories used in this build come from the machine-readable mirrors below rather than from re-OCRing the PDF.

**Machine-readable data adopted for the build:**
- `drkameleon/complete-hsk-vocabulary` → `complete.min.json` (11,470 entries; per-entry: simplified, traditional, **radical**, HSK 2.0 + 3.0 level tags, **frequency rank**, POS, pinyin with tone marks + numbered + zhuyin, English glosses). This single file backs the 识字 card deck: card front/back, radical set-collection, rarity-by-frequency, and the English gloss that fades out. ✅
- `krmanik/HSK-3.0` → `New HSK (2021)/HSK Hanzi/HSK {1..7-9}.txt` (per-level **character** inventories), `HSK Grammar/*.txt` (语法点), `Scripts and data/SUBTLEX_CH_*` (corpus frequency), `Scripts and data/all_cedict.json` (CC-CEDICT). ✅

Observed level-tag distribution in `complete.min.json` (`n*` = HSK 3.0 bands, `n7` = 7–9): n1 506, n2 750, n3 953, n4 972, n5 1059, n6 1123, n7 5606. ✅

### 4.2 Native benchmarks that 独中 初一 assumes

- **Malaysian SJKC (KSSR 华文):** ~500 characters recognised by end of 一年级; **~2,500 characters recognised and writable by end of 六年级**. ⚠️ (widely-cited KSSR target; not re-verified against the KSSR document in this pass)
- **China 义务教育语文课程标准 (2022):** 小学 six years → recognise ~3,000, write ~2,500; by end of 九年级 → ~3,500 cumulative. ⚠️
- 独中 初一 textbooks are pitched at a reader who already holds the SJKC 2,500-character base **and** the 拼音 system.

### 4.3 The gap this app has to close

| Skill | SJKC graduate entering 初一 | English-dominant student (this profile) | Gap |
|---|---|---|---|
| 识字量 (recognition) | ~2,500 | ~300–800 ❓ (baseline will measure) | **the primary bottleneck** |
| 拼音/声调 | Automatic, 6 years of use | Knows the letters, unreliable tones | Tone discrimination + 音变 |
| 朗读 | Fluent, near-native prosody | Slow, character-by-character | Fluency + tone accuracy |
| 阅读理解 | Reads 800字 passages unaided | Blocked at the character level, not the idea level | Coverage-gated |
| 写作 | 300–400字 unaided | Sentence-level | Needs frames + scaffolds |
| 语文基础知识 | Taught explicitly in SJKC | Never taught | Teachable fast in English |
| 文言文 | New to everyone in 初一 | New — **a level playing field** | **Strategic early win** |

> **Build implication:** 文言文/古诗 and 语文基础知识 are the two areas where an English-dominant student is *not* behind — both are new to every 初一 student and both are explicitly examinable. The 古诗文 relic mechanic and the 语文基础知识 arcade are therefore front-loaded: they produce visible exam gains while the slow 识字 curve is still climbing.

---

## 5. Evidence base for the learning design

### 5.1 Lexical coverage thresholds

- **98% known-word coverage** is the established threshold for adequate unassisted L2 reading comprehension — roughly one unknown word in fifty (Hu & Nation 2000; replicated by Kremmel et al., *Language Learning* 2023). ✅
- **95%** yields partial comprehension and is the accepted floor for *assisted* reading (glossed, audio-supported). ✅
- Genre matters: 98% is adequate for **narrative** text; **expository** text may need close to 100% without background knowledge (Applied Linguistics 2024; *J. Eng. Acad. Purposes* 2022). ✅

Sources:
- `https://onlinelibrary.wiley.com/doi/10.1111/lang.12622`
- `https://academic.oup.com/applij/article/45/6/953/7841943`
- `https://files.eric.ed.gov/fulltext/EJ887873.pdf`

**Adopted rule for the story engine:**

| Content type | Known-**character** coverage target | Rationale |
|---|---|---|
| Story chapter (narrative, fully glossed + voiced) | **92–96%**, target 94% | Narrative + tap-for-gloss + audio puts this at the effective-98% support level |
| Comprehension-gated choice text | **≥97%** | The branch must turn on meaning, not on a lucky guess |
| 阅读理解 investigation passage | **≥95%** | Mirrors the exam, which is deliberately slightly above comfort |
| New target words introduced per chapter | **5–10** | Matches the spec and keeps unknown density inside the band |

Coverage is computed over **characters**, not words, because character recognition is this student's binding constraint and it is what the 识字 deck tracks. A chapter is refused at serve time if it falls outside its band.

### 5.2 Spaced repetition

**FSRS** (Free Spaced Repetition Scheduler) is adopted over SM-2. It is the current state of the art in open-source SRS, models memory as difficulty/stability/retrievability, and lets us target a specific retention rate (0.9) rather than accept whatever SM-2 produces. `ts-fsrs` is the maintained TypeScript implementation. ⚠️ (engineering judgement, not a claim about published effect sizes)

### 5.3 Game-based learning and extensive reading

Consistent findings that drove design choices (⚠️ — synthesised from the L2 literature rather than one citable trial):
- **Extensive reading at high coverage** beats intensive drilling for building reading fluency and incidental vocabulary. → the story campaign is the *main* loop, and drills are side quests.
- **Narrative context aids retention** over isolated word lists. → every new word is first met inside a story sentence, then enters the deck.
- **Immediate feedback + short sessions** sustain engagement better than long sessions. → 20–30 min default, instant marking.
- **Failure must be recoverable.** Loss-aversion penalties (streak loss, lives) suppress voluntary practice in adolescents. → the spec's "recoverable detour, never a game over" and "no streak penalty" rules are kept, and no pay-to-win or dark patterns.
- **Audio-synchronised text (karaoke highlighting)** supports the decoding-to-meaning link for learners whose character recognition lags their oral comprehension — exactly this asymmetry.

---

## 6. Content-licensing position

- **Not copied into the repo:** any 董总 textbook 课文, any past 统考 paper text, any commercial 模拟卷.
- **Shipped in the repo:** the 14 公有领域 classical poems named in the 纲要; original prose written in the same register and to the same specified lengths; the exam *structure* and *rubric wording* (factual specification, cited above).
- **Supplied by the parent at runtime:** the actual weekly 课文, via the 课文 companion upload + OCR. Uploaded lesson content stays in the local database and is never redistributed.

---

## 7. Open items carried forward

| # | Item | Status | Handling |
|---|---|---|---|
| 1 | The school's internal exam format | ❓ unpublished | Scaled-down-统考 assumption (§3); parent can correct via dashboard |
| 2 | 初三 统考 date, Oct 2028 | ❓ not yet published | Seeded `2028-10-24`, parent-editable |
| 3 | HSK 3.0 headline counts | ⚠️ secondary | Build uses the machine-readable inventories, not the headline numbers |
| 4 | KSSR 2,500-character target | ⚠️ secondary | Used only to set the baseline's upper anchor |
| 5 | 初一/初二 textbook unit titles | ❓ | Deliberately not reproduced; 课文 companion covers the real lessons |
| 6 | 课内文言文 beyond the 14 poems | ❓ | 统考 tests 课内 文言文 ≤200字; the specific prose pieces are textbook-bound → handled via upload |

---

## 8. Source list

1. 《初中华文课程标准》 (2016) — https://elearning.dongzong.my/course/view.php?id=384
2. 《初中统考 华文 考试纲要 (2026)》 JY01 — https://uec.dongzong.my/wp-content/uploads/2026/07/J01-2026-0623.pdf
3. 2026 初中统考 考试时间表 — https://uec.dongzong.my/wp-content/uploads/2026/07/2026-KS-Time-J.pdf
4. 董总 UEC 考试纲要 index — https://uec.dongzong.my/?page_id=479
5. complete-hsk-vocabulary — https://github.com/drkameleon/complete-hsk-vocabulary
6. HSK-3.0 (hanzi / grammar / CC-CEDICT / SUBTLEX) — https://github.com/krmanik/HSK-3.0
7. Kremmel et al. (2023), *Language Learning* — https://onlinelibrary.wiley.com/doi/10.1111/lang.12622
8. Lexical coverage and L2 text processing, *Applied Linguistics* 45(6) — https://academic.oup.com/applij/article/45/6/953/7841943
9. Laufer & Ravenhorst-Kalovski (2010) — https://files.eric.ed.gov/fulltext/EJ887873.pdf
10. 独中 past/mock papers (format corroboration only) — https://zekolah.com/cis-papers/
