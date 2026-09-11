import { requireStudent } from '@/lib/auth';
import { scoreTranscript } from '@/lib/scoring/pronunciation';
import { db, errorLog } from '@/lib/db';
import { BadRequest, body, route } from '@/lib/api';

/**
 * Score a read-aloud attempt.
 *
 * Azure pronunciation assessment needs the raw audio and a key; without one we
 * score the transcript. Either way the tone confusions found go straight into
 * the error log, because those are what the 拼音 arcade drills next.
 */
export async function POST(req: Request) {
  return route(async () => {
    const { target, transcript } = await body<{ target: string; transcript: string }>(req);
    if (!target) throw new BadRequest('target required');

    const user = await requireStudent();
    const score = scoreTranscript(target, transcript ?? '');

    for (const tag of score.toneErrors) {
      await db.insert(errorLog).values({
        userId: user.id,
        tag: `tone:${tag}`,
        skill: 'pinyinTone',
        detail: target.slice(0, 60),
      });
    }

    return { score };
  });
}
