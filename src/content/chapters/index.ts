import { MYSTERY_CHAPTERS, type SeedChapter } from './mystery';
import { SCIFI_CHAPTERS } from './scifi';
import { WUXIA_CHAPTERS } from './wuxia';
import { LEGEND_CHAPTERS } from './legend';

export type { SeedChapter };

export const ALL_SEED_CHAPTERS: SeedChapter[] = [
  ...MYSTERY_CHAPTERS,
  ...SCIFI_CHAPTERS,
  ...WUXIA_CHAPTERS,
  ...LEGEND_CHAPTERS,
];

export function chaptersForGenre(genre: string): SeedChapter[] {
  return ALL_SEED_CHAPTERS.filter((c) => c.genre === genre).sort(
    (a, b) => a.arc - b.arc || a.seq - b.seq,
  );
}
