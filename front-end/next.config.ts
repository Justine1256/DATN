/** @type {import('next').Config} */
const nextConfig = {
   eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    domains: [
      'localhost',
      'api.marketo.info.vn',
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
        hostname: 'img4.thuthuatphanmem.vn', // Add this hostname
      },
      {
        protocol: 'https',
        hostname: 'thietbidiengiadung.io.vn', // Add this hostname
      },
      {
        protocol: 'https',
        hostname: 'shop.nagakawa.com.vn', // Add this hostname
      },
    ],
  },
};

module.exports = nextConfig;
