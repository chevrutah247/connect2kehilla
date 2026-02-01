/** @type {import('next').NextConfig} */
const nextConfig = {
  // Для Vercel serverless functions
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
}

module.exports = nextConfig
