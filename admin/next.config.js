/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/cssinjs'],
  eslint: { ignoreDuringBuilds: true },
  images: {
    domains: ['localhost', 'api.marketo.info.vn'],
    remotePatterns: [
      { protocol: 'https', hostname: 'salt.tikicdn.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'img4.thuthuatphanmem.vn' },
      { protocol: 'https', hostname: 'thietbidiengiadung.io.vn' },
      { protocol: 'https', hostname: 'shop.nagakawa.com.vn' },
    ],
  },

  // 👇 thêm cái này
  experimental: {
    esmExternals: "loose",
  },
};

module.exports = nextConfig;
