# 汉字任务 · HanziQuest

A story-driven 华文 game for one student: **the student, 13, 初一 at the 独中 (Klang),
on the 6-year UEC track.** Strong English, weak Chinese. The target is the
董总 初中华文 curriculum and, at the end of 初三, the **初中统考 华文 (JY01)** paper.

It is a game whose core mechanic is reading Chinese — not a quiz app with points
bolted on. Every chapter is checked against what he can actually read before it
is served, every reading is checked against a dictionary rather than an LLM, and
nothing punishes him for getting something wrong.

---

## Run it

```bash
npm install
npm run dev
```

That is the whole setup. The first run creates `.env`, builds the SQLite
database, seeds it, and starts the app on <http://localhost:3000>.

| Account | Login |
|---|---|
| Student | `student` / `student` |
| Parent | `parent` / `parent` |

Change both. They are seeded so a fresh checkout works, not because they are secure.

```bash
npm test          # 121 tests
npm run typecheck
npm run db:reset  # wipe and reseed
npm run build     # production build
```

**No API keys are required.** With none set, the app runs end to end on free
fallbacks. See [what improves when you add keys](#what-improves-when-you-add-keys).

---

## What is actually built

### The prologue → a real profile
The opening chapter is an adaptive 51-item assessment across all eight skills,
dressed as the first chapter of the story — the player never sees the word
"test". It is splittable across two sittings: run state lives in the database and
resumes to the exact item. It produces per-skill HSK 3.0 levels, a % of the 初一
target, a ranked gap list, a seeded known-character set, and a starting story
band. Character recognition uses a 2-down-1-up adaptive staircase.

### The story campaign
Short interactive chapters where the player is the protagonist. Fully voiced
with per-character voices and karaoke highlighting. Tap any character for audio,
pinyin, gloss and radical. Choices are written in Chinese and branch on what was
actually understood; a misreading routes to a **detour** that re-teaches the word
and rejoins the story — never a game over. New words become collectible cards.

### The coverage gate
No chapter is served without passing it. Coverage is measured three ways —
**known**, **target** (declared teaching words) and **incidental** (unknown and
unplanned) — with proper nouns excluded. If a chapter is out of reach, the gate
does not hide it: it returns a bounded set of characters to pre-teach first, as
a "gear up" screen. See [D-001](docs/decisions.md) and [D-005](docs/decisions.md).

### The 识字 deck
Every character and word is a card that levels up with FSRS-measured stability.
Stroke-order animation and write-to-check via Hanzi Writer. Rarity tracks HSK
band. Review sessions are capped and interleave new cards, so the deck never
becomes a wall.

### 古诗文 relics
The 14 poems named in the 考试纲要 默写 list — the exact list, not a selection.
Line-by-line audio and English, 文言实词 notes, **多音字 traps** (敕勒歌's 见 is
xiàn, not jiàn), scaling cloze recall, and recite-to-activate.

### 朗读 and the 声调 arcade
Read a line aloud to open a door or persuade someone; pronunciation decides the
outcome. Every tone confusion it finds goes into the error log — and the arcade
builds its next round out of exactly those pairs. Miss 1v2 today and tomorrow's
round is full of first and second tones. Per-question clock, streak bonus, and
running out of time costs you the points but never anything you had.

### Parent dashboard
Activity chart, skill trends, weak areas, milestone status, recording playback,
the exam-date editor, 课文 upload with dictionary-based vocabulary extraction,
content review with source attribution, and the pending-art list.

---

## What the research changed

[`docs/research.md`](docs/research.md) is built from primary sources, not
summaries. Three findings drove the build directly:

1. **The 统考 paper is a fixed structure** — 作文 30% / 应用文 10% / 语文基础知识
   15% / 现代文阅读 30% / 文言文阅读 15%, with the 作文 rubric specified in five
   named criteria. That is a data structure, not prose, and it is transcribed
   verbatim into `src/lib/scoring/writing.ts`.
2. **The 默写 list is closed and public domain** — 14 named poems with 册别 and
   课次. So the relic system ships complete rather than generated.
3. **19% of HSK characters are 多音字** (574 of 3,000, measured from the data).
   That is why pinyin is never produced by an LLM.

Primary sources: 《初中华文课程标准》(2016) and 《初中统考 华文 考试纲要 (2026)》
JY01, both retrieved from 董总 and cited in full.

---

## What improves when you add keys

Everything works without them. This is what changes.

Copy `.env.example` to `.env` (the first `npm run dev` does this for you) and fill
in what you have.

### `ANTHROPIC_API_KEY` — Claude

| | Without | With |
|---|---|---|
| Chapters | The seed chapters only | New chapters written to his gap list and this week's 课文, under the coverage constraint, with story-bible continuity |
| 作文 marking | 篇幅 and 技术 scored honestly by rule; 内容/语言/结构 marked "not judged" | Full 统考 rubric marking with evidence, a model answer, and a rewrite path |
| 阅读理解 open answers | Multiple choice only | Open answers marked, explained in English, model answer in Chinese |
| 课文 upload | Paste the text | Photograph the page; OCR extracts it |

The app never pretends to have judged something it has not — see the 作文 marking
output with no key set.

### `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` — Azure Speech

| | Without | With |
|---|---|---|
| Voices | Browser Web Speech API, zh-CN, pitch/rate varied per character | Pre-rendered neural voices, cached to disk, distinct per character, offline-capable |
| Pronunciation | Transcript matched against the target; catches wrong syllables and tone slips | Phoneme-level accuracy, fluency and completeness |

The fallback is honestly labelled in the UI rather than presented as phonetic
analysis.

### Art — Codex CLI (no OpenAI key)

Art is generated at **build time** on your machine using your existing ChatGPT
login. Nothing about this runs on a server.

```bash
codex login                # once
npx tsx scripts/build-manifest.ts   # derive the manifest from content
npm run gen-art                     # ~60s per image
```

```bash
npm run gen-art -- --dry-run        # print assembled prompts, generate nothing
npm run gen-art -- --force <id>     # regenerate one entry
npm run gen-art -- --only scene     # regenerate by type
npm run gen-art -- --limit 5        # stop after N (plan-limit friendly)
npm run gen-art -- --placeholders   # fill with visible placeholders, no Codex
```

Character sheets always generate before scenes; `gen-art` refuses to build a
scene prompt whose character sheet is not done yet. Every result is verified by
stat + PNG magic bytes — Codex's own report is never trusted
([D-015](docs/decisions.md)). Output is post-processed to WebP at three widths in
`public/art/`.

A chapter created at runtime gets a `pending` manifest entry and falls back to
the nearest existing scene until you run the script again. The parent dashboard
lists what is pending.

---

## Layout

```
docs/research.md          Phase 0 research, primary sources, confidence-marked
docs/decisions.md         Every non-obvious call and why
art/style.md              The single art direction; prompts are assembled from it
art/manifest.json         Derived from content by scripts/build-manifest.ts
data/source/              Vendored HSK 3.0 lexicon + licences
src/lib/lexicon.ts        Coverage maths, pinyin authority, 多音字 handling
src/lib/story/            Chapter format, validation, the coverage gate
src/lib/items/            Item types and dictionary-driven generation
src/lib/scoring/          作文 rubric, 应用文 format checker, pronunciation
src/lib/baseline.ts       The prologue, and the monthly rank-up trial
src/content/              Poems, chapters, genres, sample 课文, baseline items
scripts/                  db-setup, seed, build-lexicon, build-manifest, gen-art
tests/                    121 tests
```

---

## Content and licensing

- **Not in this repo:** any 董总 textbook 课文, any past 统考 paper, any commercial
  mock paper.
- **In this repo:** the 14 public-domain classical poems named in the 考试纲要
  (verified against zh.wikisource.org); original prose written to the same
  register and the lengths the 纲要 specifies; the exam structure and rubric
  wording, which are factual specification and cited.
- **Supplied at runtime:** the actual weekly 课文, via the parent's upload. It
  stays in the local database and is never redistributed. Deleting a lesson
  deletes the items generated from it.
- Vendored HSK data keeps its upstream licences in `data/source/`.

## Privacy

Two local accounts, scrypt-hashed. No email, no OAuth, no third-party analytics,
no telemetry. Voice recordings are written to `data/recordings/` and only the
path is stored; they are served through an authenticated route with a path
traversal guard and never leave the machine. If you add an Azure key,
pronunciation audio goes to Azure for scoring — that is the one exception, and
it is off by default.

---

## Known gaps

Honest list of what is not done. Fuller detail at the end of
[docs/decisions.md](docs/decisions.md).

1. **Three chapters per genre, one arc each.** Twelve authored chapters in
   total — enough to see every mechanic and to reach the end of arc one in any
   genre, not enough for a term. Arc two is the next content job. Chapter
   difficulty is machine-verified, not eyeballed: run
   `npx tsx scripts/check-coverage.ts` after editing any of them.
2. **Not yet built as screens:** 课文 side quests, 阅读理解 investigations,
   作文 quests and boss battles. The *engines* for all of them exist and are
   tested — item types, the 统考 blueprint, the 作文 rubric, the 应用文 format
   checker — but they are not wired to UI. (The 拼音/声调 arcade *is* built:
   `/arcade`, built from the player's own logged tone confusions.)
3. **Claude-backed generation is interfaced but not implemented.** `src/lib/ai/`
   has the client, caching and prompt-recording; the story and item generators
   that call it are not written. Everything degrades to seed content.
4. **Monthly rank-up trial** reuses the baseline engine (`kind: 'retest'`) but
   has no scheduler or entry point yet.
5. **PWA/offline** — the audio and art are cache-friendly and the chapter payload
   is self-contained, but there is no service worker or manifest yet.
6. **Azure pronunciation assessment** is interfaced (`scoreFromAzure`) but the
   audio-upload path to Azure is not wired; with a key set, TTS works and
   scoring still uses the transcript fallback.
7. **the 独中's internal exam format is unpublished**, so the school-exam boss
   blueprint uses a documented assumption (research.md §3). The parent can
   correct exam dates; the paper shape is a guess.
8. **The 2028 统考 date is projected**, not published. Seeded as `2028-10-24` and
   editable.
9. **Generated art drifts cinematic.** The full pass is consistent, text-free and
   age-appropriate, but reads more like rendered key art than the "painterly,
   cel-shaded" direction in `art/style.md`. Character sheets came out
   illustrative and scenes came out photoreal, so the two sit in slightly
   different registers. Noted in `art/style.md` section 5b with the lever to
   pull it back.
