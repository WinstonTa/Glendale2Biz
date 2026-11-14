import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // No ESLint configured for the sprint; type checking still runs in `next build`.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
