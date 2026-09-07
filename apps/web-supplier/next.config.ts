import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@obraja/shared', '@obraja/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'api.srv1131489.hstgr.cloud' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api-proxy/:path*',
        destination: 'https://api.srv1131489.hstgr.cloud/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
