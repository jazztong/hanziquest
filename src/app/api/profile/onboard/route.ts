import { eq } from 'drizzle-orm';
import { db, profiles } from '@/lib/db';
import { requireStudent } from '@/lib/auth';
import { GENRES_BY_ID, AVATARS } from '@/content/genres';
import { BadRequest, body, route } from '@/lib/api';

export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{ genre?: string; avatarId?: string; heroName?: string }>(req);
    if (!input.genre || !GENRES_BY_ID.has(input.genre as never)) throw new BadRequest('unknown genre');
    if (!AVATARS.some((a) => a.id === input.avatarId)) throw new BadRequest('unknown avatar');
  const heroName = (input.heroName ?? '').trim().slice(0, 24);
    if (!heroName) throw new BadRequest('pick a name');
    const user = await requireStudent();
    await db
      .update(profiles)
      .set({
        genre: input.genre as 'mystery' | 'scifi' | 'wuxia' | 'legend',
        avatarId: input.avatarId!,
        heroName,
      })
      .where(eq(profiles.userId, user.id));
    return { ok: true };
  });
}
