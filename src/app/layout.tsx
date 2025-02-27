import './globals.css'; // Link to your global styles
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Poppins } from 'next/font/google';
import { Analytics } from '@/components/Analytics';
import Script from 'next/script';

/**
 * Configure Poppins font with Next.js optimized font loading
 * - Includes a wider range of weights for more design flexibility
 * - Uses 'swap' display to ensure text is visible while font loads
 * - Creates a CSS variable to use in Tailwind config
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-poppins',
});

/**
 * Enhanced metadata for SEO and social sharing
 * - Includes comprehensive OpenGraph and Twitter card configurations
 * - Provides favicon and manifest links
 * - Sets up proper title templating for consistent page titles
 */
export const metadata = {
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
  themeColor: '#3B82F6',
  manifest: '/site.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
};

/**
 * Root Layout Component
 * - Provides the base HTML structure for all pages
 * - Applies global fonts and styles
 * - Includes header and footer components
 * - Sets up accessibility features
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <head>
        {/* Viewport meta tag for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Theme color for browser UI */}
        <meta name="theme-color" content="#3B82F6" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      
      <body className="font-poppins bg-gray-50 text-gray-800 flex flex-col min-h-screen antialiased">
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
        
        {/* Optional: Script for any external JavaScript */}
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
        
        {/* Future Cloudflare Analytics integration */}
        {process.env.NODE_ENV === 'production' && (
          <Script 
            src="https://static.cloudflareinsights.com/beacon.min.js" 
            data-cf-beacon='{"token": "your-token-here"}'
            defer
          />
        )}
      </body>
    </html>
  );
}