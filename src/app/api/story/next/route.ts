import { eq, isNull, or } from 'drizzle-orm';
import { db, chapters } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { knownChars, playedChapters, profile } from '@/lib/player';
import { selectNextChapter, supportLevel, type ChapterCandidate } from '@/lib/story/engine';
import type { ChapterScript } from '@/lib/story/types';
import { planClip } from '@/lib/providers/tts';
import { route } from '@/lib/api';
import { GENRES_BY_ID } from '@/content/genres';

/**
 * The next chapter for this player, already gated.
 *
 * The response carries everything the player needs to run offline once loaded:
 * the script, the audio plan for every line, the cast for name glossing, and
 * the support level. That is what makes a downloaded chapter playable on a
 * phone with no signal.
 */
export async function GET() {
  return route(async () => {
    const user = await requireStudent();
    const p = await profile(user.id);
    const genre = p?.genre ?? 'mystery';

    const rows = await db
      .select()
      .from(chapters)
      .where(or(isNull(chapters.userId), eq(chapters.userId, user.id)));

    const candidates: ChapterCandidate[] = rows.map((r) => ({
      id: r.id,
      genre: r.genre,
      arc: r.arc,
      seq: r.seq,
      band: r.band,
      title: r.title,
      script: r.script as ChapterScript,
    }));

    const known = await knownChars(user.id);
    const played = await playedChapters(user.id);
    const pick = selectNextChapter(candidates, played, known, genre);

    if (!pick) {
      return {
        chapter: null,
        // The campaign is out of authored chapters for this genre. Generation
        // fills the gap when a Claude key is present; without one the player is
        // told plainly rather than shown an empty screen.
        reason: 'no chapter available at your level yet',
      };
    }

    const row = rows.find((r) => r.id === pick.chapter.id)!;
    const script = pick.chapter.script;
    const support = supportLevel(script, known);

    const clips: Record<string, ReturnType<typeof planClip>> = {};
    for (const node of script.nodes) {
      for (const line of node.lines) clips[line.id] = planClip(line.zh, line.speaker);
      if (node.kind === 'speak') clips[`${node.id}:target`] = planClip(node.targetZh, 'narrator');
    }

    return {
      chapter: {
        id: row.id,
        title: row.title,
        titleEn: row.titleEn,
        genre: row.genre,
        arc: row.arc,
        seq: row.seq,
        band: row.band,
        artId: row.artId,
        script,
      },
      cast: GENRES_BY_ID.get(genre as never)?.bible.cast ?? [],
      support,
      clips,
      gate: {
        decision: pick.outcome.decision,
        reason:
          pick.outcome.decision === 'reject'
            ? pick.outcome.reason
            : pick.outcome.verdict.reason,
        preTeach: pick.outcome.decision === 'pre-teach' ? pick.outcome.preTeach : [],
        coverage: pick.outcome.verdict.split,
      },
    };
  });
}
