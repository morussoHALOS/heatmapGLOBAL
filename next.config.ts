/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // disables Fast Refresh
    reactRoot: true,
  },
  onDemandEntries: {
    maxInactiveAge: 1000 * 60 * 60, // 1 hour
    pagesBufferLength: 10,
  },
};

module.exports = nextConfig;
