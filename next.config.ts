import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@xenova/transformers'],
  async redirects() {
    return [];
  },
};

export default nextConfig;