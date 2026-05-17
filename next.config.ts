import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the workspace root to prevent Next.js from picking up
    // a stray package-lock.json in the parent directory (/Users/orincore/Documents)
    // which causes Tailwind CSS module resolution to fail.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
