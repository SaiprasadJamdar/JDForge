/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',     // Required for Docker multi-stage build
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
