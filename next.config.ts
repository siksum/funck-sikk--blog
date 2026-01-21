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
  // Allow external images for press thumbnails
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.hankyung.com' },
      { protocol: 'http', hostname: 'www.sungshin.ac.kr' },
      { protocol: 'https', hostname: 'www.sungshin.ac.kr' },
      { protocol: 'https', hostname: 'dhnews.co.kr' },
      { protocol: 'https', hostname: 'pds.joongang.co.kr' },
    ],
  },
};

export default nextConfig;
