/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: process.env.NODE_ENV === 'production' ? '/karomia-frontend' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/karomia-frontend/' : '',
}

module.exports = nextConfig