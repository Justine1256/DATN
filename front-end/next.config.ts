/** @type {import('next').Config} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    domains: [
      'localhost',
      'api.marketo.info.vn',
      'duynhan.id.vn',
      'your-static-base-url.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'salt.tikicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'img4.thuthuatphanmem.vn', // Added this hostname
      },
      {
        protocol: 'https',
        hostname: 'thietbidiengiadung.io.vn', // Added this hostname
      },
      {
        protocol: 'https',
        hostname: 'shop.nagakawa.com.vn', // Added this hostname
      },
    ],
  },
};

module.exports = nextConfig;
