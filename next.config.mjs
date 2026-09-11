/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client'],

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
