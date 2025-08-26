/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['antd', '@ant-design/icons', '@ant-design/cssinjs'],
  eslint: { ignoreDuringBuilds: true },
  images: {
    // nếu bạn có CDN riêng, có thể thêm ở đây
    domains: ['localhost', 'api.marketo.info.vn'],
    remotePatterns: [
      // ✅ Google avatars
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh6.googleusercontent.com', pathname: '/**' },

      // các host bạn đã dùng
      { protocol: 'https', hostname: 'salt.tikicdn.com', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
      { protocol: 'https', hostname: 'img4.thuthuatphanmem.vn', pathname: '/**' },
      { protocol: 'https', hostname: 'thietbidiengiadung.io.vn', pathname: '/**' },
      { protocol: 'https', hostname: 'shop.nagakawa.com.vn', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
