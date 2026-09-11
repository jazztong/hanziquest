# Art Direction — 汉字任务 / HanziQuest

This is the single global style guide. Every prompt in `art/manifest.json` is
assembled as:

```
<GLOBAL STYLE>  +  <GENRE DIRECTION>  +  <CHARACTER REFERENCE, if any>  +  <SHOT>
```

`scripts/gen-art.ts` does that assembly. Do not write style words into individual
manifest prompts — change them here and regenerate.

---

## 0. The one hard rule

**No text, letterforms, glyphs, characters, numerals, signage, labels, logos,
captions, speech bubbles, book pages, scrolls with writing, or UI chrome in any
generated image.**

Generative models render Chinese characters as convincing-looking nonsense. In a
Chinese-learning app that is worse than useless — a 13-year-old will read a
malformed character and learn it wrong. Every piece of text in this product is
overlaid by the React UI, where it comes from the database and is validated
against the dictionary.

Where a scene would naturally contain writing (a shop sign, a notice board, a
poem on a wall), the prompt must ask for it to be **blank, abstracted, or
occluded** — a weathered blank plaque, a lantern turned away, a scroll rolled up.

---

## 1. Who this is for

the student is **13**. The art has to read as a game he'd choose, not a resource his
parents chose for him.

**Aim at:** the illustration language of contemporary YA graphic novels and
mid-budget indie games — *Gris*, *Sable*, *Spiritfarer*, *Chinese Paladin*
key art, Studio Ponoc backgrounds.

**Avoid:** rounded pastel "kids' app" mascots, googly eyes, thick cartoon
outlines, sticker aesthetics, primary-colour playrooms, anything that looks like
it belongs on a 6-year-old's flashcard. Also avoid the opposite failure: grimdark,
gore, blood, horror, or romance. Adventure, mystery, wonder and stakes — yes.
Peril — yes. Injury and death on screen — no.

---

## 2. Global style (prepended to every prompt)

> Painterly digital illustration with clean, confident linework and flat-to-soft
> cel shading. Limited, deliberate palette. Strong silhouette reading. Cinematic
> composition with clear depth separation between foreground, midground and
> background. Textured, slightly grainy paper finish. Warm, directional key light
> with cool ambient fill. Age-appropriate for a 13-year-old reader: adventurous
> and atmospheric, never cute-childish and never grim. No text, no letterforms,
> no glyphs, no signage, no numerals, no logos, no captions, no watermark.

### Palette

The product chrome is fixed; genres shift the scene palette within it.

| Role | Hex | Use |
|---|---|---|
| Ink | `#131A26` | Linework, darkest values, UI text |
| Paper | `#F7F1E3` | Cream ground, card faces, page background |
| Jade | `#1F8A80` | Primary accent — progress, correct, the player's own colour |
| Cinnabar | `#C8442F` | Secondary accent — targets, new words, alerts |
| Gold | `#E0A33E` | Rewards, rarity, relic glow |
| Slate | `#48596B` | Neutral midtone, UI surfaces |

Every genre keeps Ink and Paper. Jade, Cinnabar and Gold appear in every scene in
**some** quantity so the collectible cards sit coherently side by side in the deck
view regardless of which genre they came from.

### Lighting

One dominant warm key (low sun, lantern, screen glow, moon-through-cloud) plus a
cool ambient fill. Never flat frontal lighting. Shadows are coloured, not grey.

### Line

Confident tapering ink line, heavier on silhouette edges and lighter inside
forms. Not uniform-weight vector line. Not brush-splatter.

---

## 3. Genre directions

Each genre keeps one consistent art direction across all its assets.

### `mystery` — 雨城档案 / Rain City Files
Contemporary Klang / Kuala Lumpur after dark. Wet five-foot-ways, kopitiam
shutters, neon reflected in puddles, monsoon drains, KTM overpasses, old
shophouse tiles. **Palette lean:** Slate and Ink dominant, Jade as neon, Cinnabar
as tail-lights. High contrast, rain-streak texture, deep shadow with a single
readable light source. Mood: alert, curious, a little noir — not frightening.

### `scifi` — 星槎 / Starcraft Junk
A Malaysian-flavoured near-future: orbital kampung platforms, solar-sail trading
junks, a Straits archipelago seen from above, biotech mangroves. Hardware looks
built and repaired, not chrome. **Palette lean:** Jade and Slate dominant with
Gold instrument glow, Cinnabar as warning light. Mood: wonder and competence.

### `wuxia` — 南洋武林 / Nanyang Martial World
武侠 transplanted to the Straits: limestone karst, rubber estates, river towns,
tin-mining country, Peranakan courtyards. Flowing robes, bamboo, mist, ink-wash
mountains bleeding into painted foreground. **Palette lean:** Ink and Paper
dominant — closest to 水墨 — with Cinnabar sashes and Jade river water. Mood:
poised, mythic, a held breath.

### `legend` — 山海行 / Journey of Mountains and Seas
西游记 and 三国 energy, filtered through Southeast Asia. Mythic beasts, cloud
seas, temple gates, celestial bureaucracy, bronze vessels. Stylised and graphic,
closer to 年画 and Dunhuang colour than to realism. **Palette lean:** Cinnabar
and Gold dominant on Paper, Jade for jade and water. Mood: grand, funny, larger
than life.

---

## 4. Character consistency

1. Every recurring character gets a **reference sheet first** (`type: "character"`):
   three-quarter, front and profile views on a plain Paper background, full body,
   neutral pose, consistent lighting.
2. `gen-art.ts` refuses to generate any scene whose `refs` name a character sheet
   that does not yet exist. Sheets are generated before scenes, always.
3. Every scene prompt that features a character appends a **written description
   block** derived from the sheet's `description` field (hair, build, palette,
   silhouette, signature item). gpt-image does not accept an image reference
   through `codex exec`, so the textual description *is* the consistency
   mechanism — it must be specific and it must not drift between entries.
4. The player avatar is never shown face-on in scenes. Scenes are framed
   over-the-shoulder, from behind, or as environment shots. This keeps the
   protagonist the player rather than a fixed character, and avoids the
   consistency problem entirely for the one character that appears most.

---

## 5. Asset types and sizes

| `type` | Size | Notes |
|---|---|---|
| `character` | 1024×1024 | Reference sheet, plain ground, full body |
| `scene` | 1536×1024 | Chapter illustration, cinematic 3:2 |
| `card` | 1024×1024 | Card frame or card art, centred subject |
| `map` | 1536×1024 | World map, stylised, no labels (labels are UI) |
| `avatar` | 1024×1024 | Bust, plain ground, readable at 96px |
| `relic` | 1024×1024 | Single object on dark ground, gold rim light |
| `boss` | 1024×1024 | Imposing figure, centred, negative space at edges |
| `ui` | 1024×1024 | Texture, frame or ornament; tileable where noted |

All generated PNGs are post-processed by `gen-art.ts` into WebP at **3 widths**
(`1536`, `768`, `384` — capped at the source width) under `public/art/`. The
originals stay in `art/out/` and are committed alongside the WebPs.

---

## 5b. Observed drift (first full generation pass)

The first complete run produced art that is **internally very consistent** but
noticeably more cinematic and photoreal than the "painterly, flat-to-soft cel
shading" this guide asks for — closer to a rendered key frame than to an
illustrated page. Scenes especially.

It is cohesive and age-appropriate, so it was kept rather than regenerated. But
it means the character *sheets* (which came out illustrative) and the *scenes*
(which came out cinematic) sit in slightly different registers.

If you want to pull it back toward illustration, the lever is the global style
block in section 2 — try leading with a flat-shading instruction and an explicit
negative ("not photorealistic, not a 3D render, visible brush and line work"),
then `npm run gen-art -- --only scene --force <id>` on one entry to check before
committing to a full regeneration.

## 6. Reviewing generated art

Reject and regenerate if any of these are true:

- Any text-like marks anywhere in the frame.
- A character's design contradicts their reference sheet.
- The palette has drifted outside the genre lean (common failure: everything
  goes teal-and-orange).
- It reads as "for young children".
- Human anatomy is visibly wrong in a way a 13-year-old would laugh at.
- The composition has no clear focal point, or the focal point sits where the UI
  overlays text (bottom third of `scene` assets is reserved for the dialogue
  panel — keep it low-detail).
