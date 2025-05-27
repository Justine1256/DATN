import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Các config khác nếu có
  reactStrictMode: true,
  swcMinify: true,

  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
