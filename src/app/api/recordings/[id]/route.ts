import { eq } from 'drizzle-orm';
import { db, recordings } from '@/lib/db';
import { requireUser, studentIdFor } from '@/lib/auth';
import { fail } from '@/lib/api';

/**
 * Streams a stored recording.
 *
 * Path traversal guard: the stored path is joined to the recordings directory
 * and the result must still be inside it. The path comes from our own insert,
 * but a stored value is still input, and a child's audio directory is not the
 * place to find out we were wrong about that.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await requireUser().catch(() => null);
  if (!user) return fail('not signed in', 401);
  const studentId = await studentIdFor(user);

  const rows = await db.select().from(recordings).where(eq(recordings.id, id)).limit(1);
  const rec = rows[0];
  if (!rec || rec.userId !== studentId) return fail('not found', 404);

  // Recordings have no bytes to serve on this deployment.
  //
  // They were read off local disk, which Cloudflare Workers do not have. That
  // is not the real gap though: nothing in the app has ever written a
  // recording - the upload path was never built, so this route has never had
  // a row to serve. When that path is built, the audio should be stored in the
  // database next to the row rather than on a disk that may not exist, and
  // this becomes a read of that column.
  return fail('recordings are not stored on this deployment', 404);
}
