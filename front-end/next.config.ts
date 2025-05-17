/** @type {import('next').Config} */
const nextConfig = {
  images: {
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