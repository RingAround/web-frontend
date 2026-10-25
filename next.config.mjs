/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Off because every page hangs on Cloudflare Workers (OpenNext 1.20) with
  // Cache Components on. Nothing here uses "use cache" yet. See docs/deployment.md.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
