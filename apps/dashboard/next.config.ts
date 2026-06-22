import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@stackagent/wallet', '@stackagent/types', '@stacks/connect', '@stacks/network'],
};

export default nextConfig;
