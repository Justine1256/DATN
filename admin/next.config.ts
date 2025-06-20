/** @type {import('next').Config} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['127.0.0.1', 'localhost', 'api.marketo.info.vn', 'example.com', 'res.cloudinary.com', 'cdn.example.org'],
  },
};

module.exports = nextConfig;
