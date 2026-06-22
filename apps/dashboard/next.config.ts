import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@stackagent/wallet', '@stackagent/types'],
};

export default nextConfig;
