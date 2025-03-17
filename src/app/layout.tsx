// This must be a server component to use metadata
import './globals.css';
import { Poppins } from 'next/font/google';
import Script from 'next/script';
import ClientLayout from '@/components/ClientLayout';

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
    default: 'Rate It or Hate It | Your Opinion, Your MEHtrics',
    template: '%s | Rate It or Hate It'
  },
  description: 'The modern platform to share your opinions on products. Rate It, Meh, or Hate It and discover what the world thinks with our MEHtrics system.',
  keywords: ['rate', 'meh', 'hate', 'review', 'opinion', 'product reviews', 'mehtrics', 'company feedback', 'vote', 'trend'],
  authors: [{ name: 'Your Name', url: 'https://yourwebsite.com' }],
  creator: 'Your Name or Company',
  publisher: 'Your Company',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rateithateit.com',
    siteName: 'Rate It or Hate It',
    title: 'Rate It or Hate It | Your Opinion, Your MEHtrics',
    description: 'The modern platform to share your opinions on products. Express what you love, feel neutral about, or hate.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Rate It or Hate It Platform - Rate It, Meh, or Hate It'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rate It or Hate It | Your Opinion, Your MEHtrics',
    description: 'The modern platform to share your opinions on products. Express what you love, feel neutral about, or hate.',
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
        <ClientLayout>
          {children}
        </ClientLayout>
        
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
              description: 'The modern platform to share your opinions on products. Rate It, Meh, or Hate It and discover what the world thinks.',
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