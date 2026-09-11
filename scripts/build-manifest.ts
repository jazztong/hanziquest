/**
 * Builds art/manifest.json from the content definitions.
 *
 * Derived rather than hand-written, so a new chapter, relic or character cannot
 * silently end up with no art entry. Re-running preserves the status, prompt and
 * timestamps of anything already generated: only new ids are added.
 *
 *   npx tsx scripts/build-manifest.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { GENRES, AVATARS } from '../src/content/genres';
import { POEMS } from '../src/content/poems';
import { ALL_SEED_CHAPTERS } from '../src/content/chapters';
import type { ArtEntry, Manifest } from './gen-art';

const MANIFEST = path.join(process.cwd(), 'art', 'manifest.json');

const SIZES = {
  character: '1024x1024',
  scene: '1536x1024',
  card: '1024x1024',
  map: '1536x1024',
  avatar: '1024x1024',
  relic: '1024x1024',
  boss: '1024x1024',
  ui: '1024x1024',
} as const;

function entry(e: Omit<ArtEntry, 'out' | 'size' | 'status'> & { size?: string }): ArtEntry {
  return {
    ...e,
    size: e.size ?? SIZES[e.type],
    out: `art/out/${e.id}.png`,
    status: 'pending',
  };
}

const entries: ArtEntry[] = [];

// --- avatars ---------------------------------------------------------------
const AVATAR_LOOKS = [
  'a quiet, watchful teenager with short dark hair and a heavy canvas satchel',
  'a fast-talking teenager with an undercut and a windbreaker tied at the waist',
  'a studious teenager with round glasses, a pencil behind one ear, sleeves rolled',
  'a wiry teenager in a worn hoodie with chalk-dusted hands and scuffed trainers',
  'a calm teenager with long hair tied back and oversized headphones round the neck',
  'a stubborn teenager with a squared jaw, cropped hair and a taped-up wrist',
];
AVATARS.forEach((a, i) => {
  entries.push(
    entry({
      id: a.artId,
      type: 'avatar',
      genre: null,
      prompt: `Head-and-shoulders portrait of ${AVATAR_LOOKS[i]}, Southeast Asian, aged about thirteen, three-quarter view, neutral confident expression, looking slightly off-camera. Plain warm-grey studio ground with a soft vignette. Readable as a small icon: strong silhouette, one clear colour accent, no busy background.`,
    }),
  );
});

// --- per-genre: character sheets, map, boss --------------------------------
const CHARACTER_LOOKS: Record<string, string> = {
  'char-mystery-auntie':
    'a Malaysian Chinese woman in her sixties, short permed grey hair, reading glasses pushed up on her head, floral cotton blouse over dark trousers, rubber sandals, a cloth money-pouch at her waist; watchful, tired, arms often folded',
  'char-mystery-son':
    'a Malaysian Chinese man in his thirties, close-cropped hair, plain dark polo shirt, a watch worn face-inward, standing very still with his hands in his pockets; unreadable rather than threatening',
  'char-scifi-captain':
    'a weathered Southeast Asian spacer captain in her fifties, silver-streaked hair in a tight braid, a patched teal flight jacket over a batik-print undershirt, one prosthetic forearm in brushed brass, salt-stained boots',
  'char-scifi-ship':
    'the ship-mind avatar: a floating lantern-like construct of woven brass ribs and jade-green light, roughly head-sized, with no face, trailing thin solar-sail filaments',
  'char-wuxia-shifu':
    'an elderly Straits-Chinese martial teacher, long thin beard, dark indigo robe with cinnabar sash, bare feet, carrying a bamboo staff he never leans on; economical, still, watching',
  'char-wuxia-sister':
    'a fourteen-year-old girl disciple, hair in two practical buns, pale jade training robe with sleeves bound at the wrists, a wooden practice sword slung across her back, permanently mid-argument',
  'char-legend-monkey':
    'a stone monkey spirit the size of a child, granite-grey fur with gold-flecked eyes, a ragged cinnabar cape, a bronze hoop earring, standing in an unearned heroic pose',
  'char-legend-earthgod':
    'a very short, very round local earth deity with a long white beard, a gold-trimmed crimson robe, a gnarled walking staff and an expression of permanent mild grievance',
};

const MAP_PROMPTS: Record<string, string> = {
  mystery:
    'A stylised bird’s-eye map of a rain-soaked Malaysian river town at night: rows of shophouses with five-foot-ways, a wide brown river, a railway bridge, monsoon drains, scattered neon reflections in standing water. Illustrated map style, no labels, no compass rose, no text of any kind.',
  scifi:
    'A stylised orbital map: a ring of stilted kampung platforms hanging above a cloud-wrapped tropical archipelago, linked by tether lines, with solar-sail junks under way between them. Illustrated map style, no labels, no text of any kind.',
  wuxia:
    'A stylised ink-wash map of a Straits martial world: limestone karst peaks rising from mist, a winding river, a walled river town, rubber estates in neat rows, a mountain temple. Traditional 山水 map feel, no labels, no seals, no text of any kind.',
  legend:
    'A stylised mythic map: a cloud sea with islands of rock and temple gates, a great bronze mountain, a celestial road winding upward, enormous beasts half-hidden in cloud. 年画 colour, decorative border of abstract cloud motifs, no labels, no text of any kind.',
};

const BOSS_PROMPTS: Record<string, string> = {
  mystery:
    'The Examiner: an imposing but not frightening figure in a dark raincoat standing under a single street lamp in heavy rain, face in shadow under the brim of a hat, holding a closed folder. Centred, negative space at the edges, water streaming through the light cone.',
  scifi:
    'The Gatekeeper: a vast dormant orbital customs construct, a wheel of brass and jade lenses, each lens an unopened eye, hanging against a cloud-lit planet. Centred, sense of enormous scale, negative space at the edges.',
  wuxia:
    'The Silent Master: a tall robed figure standing on still water at dawn, one sleeve raised, mist to the knees, face calm and unreadable. Centred, ink-wash mountains far behind, negative space at the edges.',
  legend:
    'The Mountain Warden: a colossal bronze-and-stone guardian seated in a mountain pass, moss on its shoulders, eyes of banked gold light, one open palm barring the road. Centred, cloud sea below, negative space at the edges.',
};

for (const g of GENRES) {
  for (const cast of g.bible.cast) {
    if (!cast.artId) continue;
    const look = CHARACTER_LOOKS[cast.artId];
    entries.push(
      entry({
        id: cast.artId,
        type: 'character',
        genre: g.id,
        description: look,
        prompt: `Character reference sheet: ${look}. Three views side by side on one plain cream background — full-body three-quarter, full-body front, full-body profile. Identical lighting and proportions across all three. Neutral standing pose, no props being used, no background scenery, no text or annotation marks of any kind.`,
      }),
    );
  }

  entries.push(
    entry({ id: g.mapArtId, type: 'map', genre: g.id, prompt: MAP_PROMPTS[g.id] }),
  );
  entries.push(
    entry({ id: g.bossArtId, type: 'boss', genre: g.id, prompt: BOSS_PROMPTS[g.id] }),
  );
}

// --- card frames by rarity -------------------------------------------------
const RARITIES: { id: string; look: string }[] = [
  { id: 'common', look: 'plain slate-grey border, thin single rule, matte, no ornament' },
  { id: 'uncommon', look: 'jade-green border with a simple corner motif and a faint inner glow' },
  { id: 'rare', look: 'deep blue border with interlocking geometric corners and a soft light bloom' },
  { id: 'epic', look: 'violet border with layered filigree corners and a subtle radiant aura' },
  { id: 'legendary', look: 'gold border with elaborate cloud-scroll corners, inner light and a warm halo' },
];
for (const r of RARITIES) {
  entries.push(
    entry({
      id: `card-frame-${r.id}`,
      type: 'card',
      genre: null,
      prompt: `A trading-card FRAME only, viewed straight on, filling the square: ${r.look}. The entire centre is an empty flat cream panel with nothing in it — no character, no illustration, no icon, no text, no numerals. Only the decorative border is drawn. Transparent-looking flat background outside the frame.`,
    }),
  );
}

// --- relics ----------------------------------------------------------------
const RELIC_SUBJECTS: Record<string, string> = {
  'chile-ge': 'a weathered bronze grassland horn lying on dark ground, wind-bent grass etched into its surface',
  'yin-hu-shang': 'a lacquer hand-mirror with a lake-surface finish, half bright and half misted',
  'chun-ye-xi-yu': 'a celadon rain-catcher bowl with a single ring of water still trembling in it',
  'ci-wu-ye-ti': 'a carved dark-wood crow perched on a broken branch, one wing folded over an empty nest',
  'song-du-shaofu': 'two halves of a jade travel-token that fit together, resting slightly apart',
  'guo-gu-ren-zhuang': 'a chipped farmhouse rice bowl with a sprig of dried chrysanthemum across it',
  'qi-bu-shi': 'a small iron cooking pot, still warm, with seven scorched footprints worn into the stone beneath',
  'shui-diao-ge-tou': 'a pewter wine cup tipped on its side with a full moon reflected in the spilled wine',
  'yu-mei-ren': 'a broken jade balustrade fragment with a single carved poppy flower, river water running past it',
  'tian-jing-sha': 'a traveller’s worn wooden saddle-flask hung on a bare withered branch at dusk',
  'chu-sai': 'a rusted frontier gate-ring set into weathered stone, moonlight across it',
  'chun-wang': 'a bent bronze hairpin lying among spring grass growing through cracked paving',
  'guo-ling-ding-yang': 'a salt-stained bamboo writing slip, its cords frayed, resting on wet dark rock',
  'man-jiang-hong': 'a general’s iron wrist-guard with rain beading on it, leaning against a stone parapet',
};
for (const p of POEMS) {
  entries.push(
    entry({
      id: p.artId,
      type: 'relic',
      genre: null,
      prompt: `A single museum-lit artefact on a near-black ground with a warm gold rim light: ${RELIC_SUBJECTS[p.id]}. Centred, three-quarter view, shallow depth of field, faint dust motes in the light. Absolutely no writing, no inscription, no carved characters, no seal marks — any surface that would normally carry text is worn smooth or turned away.`,
    }),
  );
}

// --- scenes, one per seed chapter -----------------------------------------
const SCENE_PROMPTS: Record<string, { prompt: string; refs?: string[] }> = {
  'scene-mystery-1-1': {
    prompt:
      'Night, heavy rain. Looking over the player’s shoulder from the street toward the half-open doorway of an old shophouse; warm yellow light spills out onto wet tiles and a thin sheet of water runs from inside across the threshold. An older woman stands just inside the doorway in silhouette. Bottom third kept dark and low-detail.',
    refs: ['char-mystery-auntie'],
  },
  'scene-mystery-1-2': {
    prompt:
      'Morning after rain, inside the shop doorway. Close on a brand-new white folding umbrella propped behind an old wooden door — conspicuously dry, while everything around it is dark with damp. Shelves and stacked goods blurred behind. Bottom third kept plain and low-detail.',
  },
  'scene-mystery-1-3': {
    prompt:
      'Late afternoon, the rain stopped, the street steaming. A black saloon car parked at the kerb outside the shophouse, seen from the five-foot-way; a figure barely visible behind the windscreen. The older woman stands in the shop doorway in the foreground, watching the car. Bottom third kept low-detail.',
    refs: ['char-mystery-auntie'],
  },
  'scene-scifi-1-1': {
    prompt:
      'Interior of an ageing solar-sail junk. Looking over the player’s shoulder at a heavy circular hatch, shut, with worn hand-polished edges; warm instrument glow from a bank of repaired panels to one side, cold planet-light from a porthole to the other. A small floating lantern-like ship-mind construct hovers beside the hatch. Bottom third low-detail.',
    refs: ['char-scifi-ship'],
  },
  'scene-scifi-1-2': {
    prompt:
      'The junk’s cramped command nook at night. The captain stands with her back half-turned, arms folded, lit from below by a console; the floating ship-mind construct hangs dim and quiet between her and the viewer. Dense with cables, patched panels and stowed cargo. Bottom third kept plain.',
    refs: ['char-scifi-captain', 'char-scifi-ship'],
  },
  'scene-scifi-1-3': {
    prompt:
      'The dark rear passage of the junk, looking down its length toward a sealed cargo hatch. One thin seam of jade light escapes from around its edge. Everything else is silhouette and cold reflection. A hand rests on the hatch in the near foreground. Bottom third very dark.',
  },
  'scene-wuxia-1-1': {
    prompt:
      'Dawn beside a still limestone-pool at the foot of a karst peak, mist to the knees. An elderly teacher in dark indigo robe stands at the water’s edge with his back to the viewer, watching the surface. A second, smaller set of footprints waits on the flagstones. Ink-wash mountains behind. Bottom third low-detail water.',
    refs: ['char-wuxia-shifu'],
  },
  'scene-wuxia-1-2': {
    prompt:
      'Mid-morning at the same water’s edge. A teenage girl disciple in pale jade training robes is caught mid-step, sleeve flaring, having just moved first; the water beneath her is disturbed into rings. Composition leaves the opposite position empty for the player. Bottom third kept plain.',
    refs: ['char-wuxia-sister'],
  },
  'scene-wuxia-1-3': {
    prompt:
      'A dim hall in a Peranakan courtyard school. A hanging cloth panel with four horizontal bands of blank embroidery; the third band is conspicuously empty, its threads cleanly cut away. Low lantern light rakes across the fabric. No writing on the panel at all. Bottom third low-detail.',
  },
  'scene-legend-1-1': {
    prompt:
      'A mythic crossroads in a cloud sea at sunrise. Two stone roads fork — one climbing toward a bronze mountain gate, one descending into cloud. A small grey stone monkey in a ragged cinnabar cape is already striding down the wrong one, chin up. A blank folded sheet of paper is held in the near foreground. 年画 colour. Bottom third cloud.',
    refs: ['char-legend-monkey'],
  },
  'scene-legend-1-2': {
    prompt:
      'A tiny weathered roadside shrine at the foot of a mountain, its plaque blank and moss-covered. A very short round earth deity in a crimson robe stands in the doorway leaning on a gnarled staff, mildly aggrieved. The stone monkey lurks at the edge of frame, unimpressed. Warm evening light. Bottom third low-detail.',
    refs: ['char-legend-earthgod', 'char-legend-monkey'],
  },
  'scene-legend-1-3': {
    prompt:
      'High on a mountain path, an enormous ancient boulder completely blocking the road, moss-bearded and veined, dwarfing the figures. The stone monkey has both palms flat against it and is achieving nothing. Cloud sea far below. Dramatic side light. Bottom third kept simple.',
    refs: ['char-legend-monkey'],
  },
};
for (const ch of ALL_SEED_CHAPTERS) {
  const spec = SCENE_PROMPTS[ch.artId];
  if (!spec) continue;
  entries.push(
    entry({
      id: ch.artId,
      type: 'scene',
      genre: ch.genre,
      prompt: spec.prompt,
      refs: spec.refs,
      fallback: `map-${ch.genre}`,
    }),
  );
}

// ---------------------------------------------------------------------------
// Merge with what is already generated
// ---------------------------------------------------------------------------

let existing: Manifest = { version: 1, entries: [] };
if (fs.existsSync(MANIFEST)) {
  existing = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as Manifest;
}
const prev = new Map(existing.entries.map((e) => [e.id, e]));

const merged = entries.map((e) => {
  const old = prev.get(e.id);
  if (!old) return e;
  // Keep generated state; take the new prompt text so edits to this file
  // actually reach the next regeneration.
  return {
    ...e,
    status: old.status,
    lastPrompt: old.lastPrompt,
    generatedAt: old.generatedAt,
    bytes: old.bytes,
    error: old.error,
    web: old.web,
  };
});

// Anything the content no longer references but that was generated at runtime
// (a chapter written by Claude) is preserved rather than dropped.
for (const old of existing.entries) {
  if (!merged.some((e) => e.id === old.id) && old.createdBy) merged.push(old);
}

fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify({ version: 1, entries: merged }, null, 2) + '\n');

const byType = merged.reduce<Record<string, number>>((a, e) => {
  a[e.type] = (a[e.type] ?? 0) + 1;
  return a;
}, {});
console.log(`art/manifest.json: ${merged.length} entries`);
for (const [t, n] of Object.entries(byType)) console.log(`  ${t.padEnd(10)} ${n}`);
console.log(`  pending: ${merged.filter((e) => e.status !== 'done').length}`);
