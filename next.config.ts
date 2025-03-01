import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable static exports for Cloudflare Pages if needed
  output: 'standalone', 
  
  // Add image domains if you're loading images from external sources
  images: {
    domains: [
      // Add domains you want to load images from, like:
      // 'images.unsplash.com',
      // 'storage.googleapis.com',
    ],
    // Image optimization settings (optional)
    formats: ['image/avif', 'image/webp'],
  },

  // Example of redirects if needed
  async redirects() {
    return [
      // {
      //   source: '/old-page',
      //   destination: '/new-page',
      //   permanent: true,
      // },
    ];
  },
  
  // Environment variables that should be available at build time
  env: {
    // Any env vars you want accessible via process.env in the browser
    // NEXT_PUBLIC_SITE_URL: 'https://rateithateit.com',
  },
  
  // TypeScript configuration (enable type checking)
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  
  // Any webpack configuration if needed
  webpack: (config, { isServer }) => {
    // Custom webpack config if needed
    return config;
  },
};

export default nextConfig;