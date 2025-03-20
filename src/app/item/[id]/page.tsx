import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ItemDetailClient from './ItemDetailClient';
import { Loader2 } from 'lucide-react';
import { getItemById, getRelatedItemsByCategory } from '@/lib/firebase-admin';

// Mock data to generate static paths - in production you would fetch this from your database
const allItems = [
  { id: '1', category: 'electronics' },
  { id: '2', category: 'electronics' },
  { id: '3', category: 'books' },
  { id: '4', category: 'books' },
  { id: '5', category: 'electronics' },
  { id: '6', category: 'companies' },
  { id: '7', category: 'companies' },
  // Add all your known item IDs here
];

// Required for static export - tells Next.js which IDs to generate at build time
export async function generateStaticParams() {
  // Return all item IDs that should be pre-rendered
  // In production, you would fetch this list from your database
  return allItems.map(item => ({
    id: item.id,
  }));
}

// Loading placeholder
function ItemSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
      <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6 mb-6"></div>
      <div className="h-10 bg-gray-200 rounded w-full mb-6"></div>
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
    </div>
  );
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  try {
    // Get item using the Firebase Admin SDK
    const item = await getItemById(id);
    
    if (!item) {
      // Return default data if item doesn't exist yet
      return notFound();
    }
    
    // Get related items using the Firebase Admin SDK
    const relatedItems = await getRelatedItemsByCategory(item.category, id);

    // Calculate percentages using rateCount, mehCount, and hateCount
    const totalVotes = item.rateCount + item.mehCount + item.hateCount;
    const ratePercentage = totalVotes > 0 ? Math.round((item.rateCount / totalVotes) * 100) : 0;
    const mehPercentage = totalVotes > 0 ? Math.round((item.mehCount / totalVotes) * 100) : 0;
    const hatePercentage = totalVotes > 0 ? Math.round((item.hateCount / totalVotes) * 100) : 0;

    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            <span className="mt-2 text-gray-600">Loading...</span>
          </div>
        </div>
      }>
        <ItemDetailClient
          item={item}
          relatedItems={relatedItems}
          ratePercentage={ratePercentage}
          mehPercentage={mehPercentage}
          hatePercentage={hatePercentage}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Error fetching item:', error);
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Item</h1>
            <p className="text-gray-700 dark:text-gray-300">
              There was an error loading this item. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}