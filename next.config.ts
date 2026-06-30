import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@xenova/transformers',   // kept for safety (no longer actively used)
  ],
  async redirects() {
    return [];
  },
};

export default nextConfig;