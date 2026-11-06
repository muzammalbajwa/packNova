import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export -> deploys to Cloudflare Pages (publish dir: `out`).
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  // Silence the multi-lockfile warning: the project root is this folder.
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
