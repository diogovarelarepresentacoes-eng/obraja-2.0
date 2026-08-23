import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@obraja/types'],
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.r2.cloudflarestorage.com' }],
  },
};

export default nextConfig;
