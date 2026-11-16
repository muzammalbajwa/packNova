import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export -> deploys to Cloudflare Pages (publish dir: `out`).
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  experimental: { turbopackRemoveUnusedExports: true, turbopackRemoveUnusedImports: true },
  // Silence the multi-lockfile warning: the project root is this folder.
  turbopack: {
    root: __dirname,
    // Import three from its source modules instead of the prebuilt bundle: unused classes are dropped (shared 3D chunk 181 kB -> 100 kB gzip).
    resolveAlias: { three: "three/src/Three.js" },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
