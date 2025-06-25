import { NextConfig } from 'next';

// Khai báo cấu hình với kiểu NextConfig
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [
      '127.0.0.1',
      'localhost',
      'api.marketo.info.vn',
      'example.com',
      'res.cloudinary.com',
      'cdn.example.org',
    ],
  },
  webpack(config, { isServer }) {
    // Cấu hình Webpack cho CSS khi chạy trên client
    if (!isServer) {
      config.module.rules.push({
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      });
    }
    return config;
  },
};

export default nextConfig;
