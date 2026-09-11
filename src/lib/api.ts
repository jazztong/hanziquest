import { NextResponse } from 'next/server';
import { AuthError } from './auth';

/**
 * One error shape for every route.
 *
 * Handlers throw; this turns the throw into a response. Without it each handler
 * grows its own try/catch and they drift - and a drifted auth error becomes a
 * 500, which looks like a bug rather than a logged-out session.
 */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export class BadRequest extends Error {
  status = 400;
}

export async function route<T>(fn: () => Promise<T>) {
  try {
    return NextResponse.json(await fn());
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message, err.status);
    if (err instanceof BadRequest) return fail(err.message, err.status);
    console.error('[route]', err);
    return fail((err as Error).message || 'unexpected error', 500);
  }
}

/**
 * Parse a JSON body.
 *
 * MUST be called inside `route()`. Calling `req.json()` at the top of a handler
 * puts the parse outside the try/catch, so a malformed or empty body escapes as
 * an unhandled SyntaxError and Next renders its HTML error page - which a fetch
 * client then fails to parse, reporting a confusing error two layers away from
 * the real one. Asking for it through here keeps every failure a clean 400.
 */
export async function body<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new BadRequest('request body must be JSON');
  }
}
