// src/app/controversial/page.tsx
import { Metadata } from 'next';
import Image from 'next/image';
import ControversialItemsList from './ControversialItemsList';
import { getControversialItems } from '@/lib/server-data';

// Metadata for the page
export const metadata: Metadata = {
  title: 'Controversial Items | Rate It or Hate It',
  description: 'Items with mixed opinions and divided ratings - explore the most divisive products where opinions are strongly split!',
};

export default async function ControversialPage() {
  // Fetch controversial items
  const controversialItems = await getControversialItems(16);
  
  return (
    <div className="container mx-auto py-10 px-4">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl overflow-hidden mb-10 shadow-lg relative">
        <div className="bg-black/20 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto py-12 px-6 md:px-10 relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Controversial Items
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mb-6">
              Welcome to the most divisive products on Rate It or Hate It. These items have strong opinions on both sides - people either love them or hate them. Where do you stand?
            </p>
            <div className="flex items-center space-x-1 text-white text-sm font-medium">
              <span className="bg-blue-500 px-3 py-1 rounded-l-full">Rate It</span>
              <span className="bg-yellow-500 px-3 py-1">vs</span>
              <span className="bg-red-500 px-3 py-1 rounded-r-full">Hate It</span>
            </div>
          </div>
        </div>
        
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-pink-500/40 blur-3xl"></div>
          <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-blue-500/40 blur-3xl"></div>
          <div className="absolute left-1/3 top-1/4 w-64 h-64 rounded-full bg-purple-500/40 blur-3xl"></div>
        </div>
      </div>
      
      {/* Info card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">What makes an item controversial?</h2>
        <p className="text-gray-600 dark:text-gray-300">
          An item becomes controversial when it has a similar percentage of "Rate It" and "Hate It" votes. 
          The controversy score reaches 100% when exactly half the users love an item and half hate it.
          Items need at least 10 votes to be considered for this list.
        </p>
      </div>
      
      {/* Pass the items to the client component */}
      <ControversialItemsList initialItems={controversialItems} />
    </div>
  );
}