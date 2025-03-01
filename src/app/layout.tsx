import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Poppins } from 'next/font/google';
import { Analytics } from '@/components/Analytics';
import Script from 'next/script';
import { AuthProvider } from '@/lib/auth';

/**
 * Configure Poppins font with Next.js optimized font loading
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
});

/**
 * Viewport configuration
 */
export const viewport = {
  themeColor: '#3B82F6',
  width: 'device-width',
  initialScale: 1
};

/**
 * Enhanced metadata for SEO and social sharing
 */
export const metadata = {
  metadataBase: new URL('https://rateithateit.com'), // Change to your actual domain
  title: {
    default: 'Rate It or Hate It | Your Voice Matters',
    template: '%s | Rate It or Hate It'
  },
  description: 'The modern platform to share your opinions on products and companies. Vote, discover trends, and see what the world loves or hates.',
  keywords: ['rate', 'hate', 'review', 'opinion', 'product reviews', 'company feedback', 'vote', 'trend'],
  authors: [{ name: 'Your Name', url: 'https://yourwebsite.com' }],
  creator: 'Your Name or Company',
  publisher: 'Your Company',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rateithateit.com',
    siteName: 'Rate It or Hate It',
    title: 'Rate It or Hate It | Your Voice Matters',
    description: 'The modern platform to share your opinions on products and companies.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Rate It or Hate It Platform'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rate It or Hate It | Your Voice Matters',
    description: 'The modern platform to share your opinions on products and companies.',
    images: ['/twitter-image.jpg'],
    creator: '@yourhandle'
  },
  robots: {
    index: true,
    follow: true
  },
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
};

/**
 * Root Layout Component
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} scroll-smooth`}>
      <head>
        {/* Preconnect to important domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebaseapp.com" crossOrigin="anonymous" />
      </head>
      <body className="font-poppins bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 flex flex-col min-h-screen antialiased">
        <AuthProvider>
          {/* Global loading indicator for auth state */}
          <div id="auth-loading-indicator" className="fixed top-0 left-0 w-full h-1 bg-blue-500 opacity-0 transition-opacity duration-300 z-50"></div>
          
          {/* Skip to content link for accessibility */}
          <a 
            href="#main-content" 
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:p-4 focus:bg-blue-500 focus:text-white focus:z-50"
          >
            Skip to content
          </a>
          
          {/* Site header with navigation */}
          <Header />
          
          {/* Main content area - flex-grow ensures it fills available space */}
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          
          {/* Site footer with links and information */}
          <Footer />
          
          {/* Analytics component for tracking (non-rendering) */}
          <Analytics />
        </AuthProvider>
        
        {/* JSON-LD Structured Data for SEO */}
        <Script 
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Rate It or Hate It',
              url: 'https://rateithateit.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://rateithateit.com/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />
        
        {/* Theme switcher script */}
        <Script 
          id="theme-switcher"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Check for dark mode preference
              if (localStorage.theme === 'dark' || 
                  (!('theme' in localStorage) && 
                  window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark')
              } else {
                document.documentElement.classList.remove('dark')
              }
            `
          }}
        />
        
        {/* Cloudflare Analytics integration */}
        {process.env.NODE_ENV === 'production' && (
          <Script 
            src="https://static.cloudflareinsights.com/beacon.min.js" 
            data-cf-beacon='{"token": "your-token-here", "spa": true}'
            strategy="afterInteractive"
            defer
          />
        )}
      </body>
    </html>
  );
}