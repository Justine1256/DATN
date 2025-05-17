/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'salt.tikicdn.com',
        pathname: '/cache/**',
      },
      // Bạn có thể thêm các hostname khác nếu cần
    ],
  },
};

module.exports = nextConfig;