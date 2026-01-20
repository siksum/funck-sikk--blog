import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Skip type checking during build (already checked in dev/CI)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip ESLint during build (already checked in dev/CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
