// ✅ Dùng CommonJS
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['127.0.0.1', 'localhost', 'example.com', 'res.cloudinary.com', 'cdn.example.org'],
  },
};

module.exports = nextConfig;
