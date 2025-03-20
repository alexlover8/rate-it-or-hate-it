// src/app/recent/page.tsx
import { Metadata } from 'next';
import { getRecentItems } from '@/lib/server-data';
import RecentItemsList from './RecentItemsList';

// Metadata for the page
export const metadata: Metadata = {
  title: 'Recent Items | Rate It or Hate It',
  description: 'Check out the newest additions to Rate It or Hate It - fresh items waiting for your opinion!',
};

export default async function RecentPage() {
  try {
    // Fetch recent items with error handling
    const recentItems = await getRecentItems(16);
    
    return (
      <div className="container mx-auto py-10 px-4">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 rounded-xl overflow-hidden mb-10 shadow-lg relative">
          <div className="bg-black/20 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto py-12 px-6 md:px-10 relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Recent Items
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mb-6">
                Discover the newest additions to our collection. These are the latest items added to Rate It or Hate It - be among the first to share your opinion!
              </p>
            </div>
          </div>
          
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-teal-500/40 blur-3xl"></div>
            <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-blue-500/40 blur-3xl"></div>
            <div className="absolute left-1/3 top-1/4 w-64 h-64 rounded-full bg-cyan-500/40 blur-3xl"></div>
          </div>
        </div>
        
        {/* Pass the items to the client component */}
        <RecentItemsList initialItems={recentItems} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching recent items:", error);
    
    // Fallback UI in case of error
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Recent Items</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Temporarily Unavailable</h3>
          <p className="text-gray-600 dark:text-gray-300">
            We're having trouble loading the recent items. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}