import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import * as schema from './schema';

/**
 * The database: D1, which is SQLite on Cloudflare's machines.
 *
 * This used to reach either a local SQLite file or D1, choosing at runtime.
 * That cost more than it was worth. Next externalises node_modules in its
 * server build, so the libSQL driver survived every attempt to keep it out of
 * the Worker bundle - alias, package stub, dead-code elimination - and esbuild
 * then failed on it, because it needs node:fs and a Worker has no filesystem.
 * The branch could not be removed from the bundle while it remained in the
 * code, so it is gone from the code.
 *
 * One store now. `next dev` still needs no account and no network:
 * initOpenNextCloudflareForDev() in next.config.mjs binds this same code to a
 * local SQLite file that wrangler manages, so development stays a single
 * command against a file on disk - which is what D-002 actually asked for.
 *
 * Both are SQLite, so the Drizzle sqlite-core schema describes them equally and
 * nothing above this file knows which one it is talking to.
 */

export type DB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Resolved per access, never cached.
 *
 * A D1 binding belongs to the request in flight; holding one across requests is
 * how a Worker ends up writing into someone else's context. The Proxy keeps
 * `import { db }` working at every call site while still doing the lookup at
 * the moment of use.
 */
export const db: DB = new Proxy({} as DB, {
  get(_target, prop) {
    const env = getCloudflareContext().env as unknown as { DB?: D1Database };
    if (!env?.DB) {
      throw new Error(
        'no DB binding: check d1_databases in wrangler.jsonc, and that next.config.mjs calls initOpenNextCloudflareForDev()',
      );
    }
    const real = drizzle(env.DB, { schema });
    return Reflect.get(real as object, prop);
  },
});

export { schema };
export * from './schema';
