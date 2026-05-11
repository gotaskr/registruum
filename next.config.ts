import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/registruum-favicon.svg" }];
  },
};

export default nextConfig;
