/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Static HTML export
  reactStrictMode: false,
  
  // These options are compatible with static export
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  
  images: {
    unoptimized: true, // Required for 'export' output
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'placehold.co',
      'placeholder.com',
      'via.placeholder.com',
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/^https?:\/\//, '') || '',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Error bypassing for development
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Cleaned up experimental options
  experimental: {
    largePageDataBytes: 128 * 1000,
    // Remove incompatible options:
    // ssr: false,
    // staticPageGenerationTimeout: 1000,
  },
  
  // Server external packages
  serverExternalPackages: [],
};

module.exports = nextConfig;