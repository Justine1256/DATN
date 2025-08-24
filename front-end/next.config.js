/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Quan trọng khi dùng antd v5 trên Next 14
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/cssinjs'],

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'api.marketo.info.vn' },
      { protocol: 'https', hostname: 'files.marketo.info.vn' }, // ảnh reviews
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'salt.tikicdn.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'img4.thuthuatphanmem.vn' },
      { protocol: 'https', hostname: 'thietbidiengiadung.io.vn' },
      { protocol: 'https', hostname: 'shop.nagakawa.com.vn' },
      { protocol: 'https', hostname: 'duynhan.id.vn' },
    ],
  },
};

module.exports = nextConfig;
