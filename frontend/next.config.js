// Next.js requires a next.config.js file in the root directory
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['example.com', 'via.placeholder.com', 'picsum.photos'],
  }
};

module.exports = nextConfig
