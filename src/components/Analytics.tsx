'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any; // Allow additional properties
};

// Declare global gtag function
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event', 
      targetId: string, 
      config?: Record<string, unknown>
    ) => void;
    trackEvent?: (eventName: string, properties?: Record<string, unknown>) => void;
  }
}

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // This function will run on component mount and whenever the route changes
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Track page view
    trackPageView(url);
    
    // You can also track additional events here if needed
  }, [pathname, searchParams]);

  // Function to track page views
  const trackPageView = (url: string) => {
    // This is where you would integrate with your analytics service
    // Examples include Google Analytics, Mixpanel, Plausible, etc.
    
    // Google Analytics example (GA4)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-XXXXXXXXXX', {
        page_path: url,
      });
    }
    
    // Cloudflare Web Analytics - already included via script in root layout
    
    // Console log for development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Page view tracked: ${url}`);
    }
  };

  // Helper function to track events
  const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
    // Google Analytics example
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties || {});
    }
    
    // Console log for development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Event tracked: ${eventName}`, properties);
    }
  };

  // Expose the tracking function to the window object for use in other components
  if (typeof window !== 'undefined') {
    window.trackEvent = trackEvent;
  }

  // This component doesn't render anything
  return null;
}

// Export the track event function for use outside React components
export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  // Check if we're in the browser and the function exists
  if (typeof window !== 'undefined' && window.trackEvent) {
    window.trackEvent(eventName, properties);
  }
};