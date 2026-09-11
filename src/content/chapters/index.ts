import { MYSTERY_CHAPTERS, type SeedChapter } from './mystery';

export type { SeedChapter };

export const ALL_SEED_CHAPTERS: SeedChapter[] = [...MYSTERY_CHAPTERS];

export function chaptersForGenre(genre: string): SeedChapter[] {
  return ALL_SEED_CHAPTERS.filter((c) => c.genre === genre).sort(
    (a, b) => a.arc - b.arc || a.seq - b.seq,
  );
}
