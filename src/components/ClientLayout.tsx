'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@/components/Analytics';
import { AuthProvider } from '@/lib/auth';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
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
  );
}