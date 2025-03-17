import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable standalone mode for better Firebase compatibility
  output: 'standalone', 
  
  // Image configuration remains unchanged
  images: {
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
    formats: ['image/avif', 'image/webp'],
  },

  // Redirects remain unchanged
  async redirects() {
    return [];
  },
  
  // Environment variables remain unchanged
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    NEXT_PUBLIC_R2_PUBLIC_URL: process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
  },
  
  // TypeScript and ESLint configuration remain unchanged
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Add Firebase to external packages to handle SSR correctly
  serverExternalPackages: ['firebase'],
  
  largePageDataBytes: 128 * 1000,
  
  // CORS headers remain unchanged
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  
  // Updated webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Add fallbacks for node modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        path: require.resolve('path-browserify'),
      };
      
      // Keep the Firebase aliases but ensure they're properly resolved
      config.resolve.alias = {
        ...config.resolve.alias,
        'firebase/app': require.resolve('firebase/app'),
        'firebase/auth': require.resolve('firebase/auth'),
        'firebase/firestore': require.resolve('firebase/firestore'),
        'firebase/storage': require.resolve('firebase/storage'),
        'firebase/functions': require.resolve('firebase/functions'),
      };
    }
    return config;
  },
};

export default nextConfig;