/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'api.marketo.info.vn',
      },
      {
        protocol: 'https',
        hostname: 'files.marketo.info.vn', // ✅ Thêm domain ảnh reviews
      },
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
        hostname: 'img4.thuthuatphanmem.vn',
      },
      {
        protocol: 'https',
        hostname: 'thietbidiengiadung.io.vn',
      },
      {
        protocol: 'https',
        hostname: 'shop.nagakawa.com.vn',
      },
      {
        protocol: 'https',
        hostname: 'duynhan.id.vn',
      },
    ],
  },
};

module.exports = nextConfig;
