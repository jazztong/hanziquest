import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {

  /**
   * Keep the dev watcher out of the data directories.
   *
   * The SQLite file lives in ./data, and the app writes to it on essentially
   * every request. Without this, each write trips Next's file watcher, which
   * recompiles mid-request and intermittently fails the in-flight request with
   * a bare `SyntaxError: Unexpected end of JSON input` from its own module
   * loader. Generated art and cached TTS have the same problem at a slower rate.
   */
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/data/**',
        '**/art/out/**',
        '**/public/art/**',
        '**/public/audio/**',
      ],
    };
    return config;
  },
};

export default nextConfig;

/**
 * Gives `next dev` the same bindings the deployed Worker gets - here, a local
 * D1 file that wrangler manages. Without it the database module has nothing to
 * bind to outside a real Worker.
 */
initOpenNextCloudflareForDev();
