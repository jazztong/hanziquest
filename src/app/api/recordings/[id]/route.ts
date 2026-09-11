import fs from 'node:fs';
import path from 'node:path';
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

  const dir = path.join(process.cwd(), 'data', 'recordings');
  const file = path.resolve(dir, rec.path);
  if (!file.startsWith(path.resolve(dir) + path.sep)) return fail('not found', 404);
  if (!fs.existsSync(file)) return fail('recording file is missing', 404);

  const buf = fs.readFileSync(file);
  return new Response(new Uint8Array(buf), {
    headers: { 'content-type': 'audio/webm', 'cache-control': 'private, max-age=3600' },
  });
}
