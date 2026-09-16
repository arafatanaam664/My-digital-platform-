/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Native image module — keep external so webpack doesn't try to bundle it.
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
};

export default nextConfig;
