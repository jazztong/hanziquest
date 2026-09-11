import { eq } from 'drizzle-orm';
import { db, examDates } from '@/lib/db';
import { requireUser, studentIdFor, AuthError } from '@/lib/auth';
import { BadRequest, body, route } from '@/lib/api';

export async function POST(req: Request) {
  return route(async () => {
    const input = await body<{
      id?: string;
      label?: string;
      kind?: string;
      date?: string;
      remove?: boolean;
    }>(req);
    if (!input.date && !input.remove) throw new BadRequest('date required');

    const user = await requireUser();
    if (user.role !== 'parent') throw new AuthError('parent account required');
    const studentId = await studentIdFor(user);

    if (input.remove && input.id) {
      await db.delete(examDates).where(eq(examDates.id, input.id));
      return { ok: true };
    }

    const id = input.id ?? `e-${Date.now().toString(36)}`;
    await db
      .insert(examDates)
      .values({
        id,
        userId: studentId,
        label: input.label ?? 'Exam',
        kind: input.kind ?? 'school-final',
        date: input.date!,
        // Editing a date IS the parent confirming it - that is the entire point
        // of the placeholder flag, so it clears here rather than needing a
        // separate "confirm" action.
        isPlaceholder: false,
      })
      .onConflictDoUpdate({
        target: examDates.id,
        set: { label: input.label ?? 'Exam', date: input.date!, isPlaceholder: false },
      });
    return { ok: true, id };
  });
}
