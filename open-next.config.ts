import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * Next.js on Cloudflare Workers.
 *
 * The defaults are deliberate: no incremental cache and no queue, because
 * every page in this app is either static or per-player dynamic, and there is
 * nothing worth revalidating in the background for a single user.
 */
export default defineCloudflareConfig();
