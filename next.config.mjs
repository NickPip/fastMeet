/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds (optional, but helps if there are type issues)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

