/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Define your site URL
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://rateithateit.com',
    
    // Firebase Environment Variables
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,

    // Cloudflare R2 Configuration
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    
    // OpenAI Configuration
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },

  // Image configuration
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'placehold.co',
      'placeholder.com',
      'via.placeholder.com',
      'rateithateit.com', // <-- ADD YOUR DOMAIN HERE
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/^https?:\/\//, '') || '',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Webpack modifications for Firebase compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  experimental: {
    serverComponentsExternalPackages: ['firebase'],
  },
};

module.exports = nextConfig;