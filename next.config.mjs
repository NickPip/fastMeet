/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Completely disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds (optional, but helps if there are type issues)
    ignoreBuildErrors: false,
  },
  // Disable ESLint completely
  experimental: {
    eslint: {
      ignoreDuringBuilds: true,
    },
  },
};

export default nextConfig;

