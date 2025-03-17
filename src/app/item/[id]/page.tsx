// Update to include generateStaticParams
import { Suspense } from 'react';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ItemDetailClient from './ItemDetailClient';
import { Loader2 } from 'lucide-react';

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

// Get item details from Firestore
async function getItem(id: string) {
  try {
    const itemRef = doc(db, 'items', id);
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      // Return default data if item doesn't exist yet
      return {
        id,
        name: `Item ${id}`,
        description: 'No description available.',
        rateCount: 0,
        mehCount: 0,
        hateCount: 0,
        category: 'uncategorized',
        categoryId: 0,
        dateAdded: new Date().toISOString(),
        imageUrl: null,
        commentCount: 0,
        comments: [],
        creatorId: null,
        creatorName: 'Unknown',
      };
    }
    
    // Get item data
    const data = itemDoc.data();
    
    // Get comments
    const commentsQuery = query(
      collection(db, 'comments'),
      where('itemId', '==', id),
      limit(20)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      text: doc.data().text,
      userId: doc.data().userId,
      userName: doc.data().userName,
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));
    
    return {
      id,
      name: data.name || `Item ${id}`,
      description: data.description || 'No description available.',
      rateCount: data.rateCount || 0,
      mehCount: data.mehCount || 0,
      hateCount: data.hateCount || 0,
      category: data.category || 'uncategorized',
      categoryId: data.categoryId || 0,
      dateAdded: data.created?.toDate()?.toISOString() || new Date().toISOString(),
      imageUrl: data.imageUrl || null,
      commentCount: data.commentCount || 0,
      comments: comments,
      creatorId: data.creatorId || null,
      creatorName: data.creatorName || 'Unknown',
    };
  } catch (error) {
    console.error('Error fetching item:', error);
    return {
      id,
      name: `Error Loading Item`,
      description: 'There was an error loading this item.',
      rateCount: 0,
      mehCount: 0,
      hateCount: 0,
      category: 'uncategorized',
      categoryId: 0,
      dateAdded: new Date().toISOString(),
      imageUrl: null,
      commentCount: 0,
      comments: [],
      creatorId: null,
      creatorName: 'Unknown',
    };
  }
}

// Simulated fetch for related items in the same category
async function getRelatedItems(category: string, currentItemId: string) {
  try {
    const relatedQuery = query(
      collection(db, 'items'),
      where('category', '==', category),
      where('id', '!=', currentItemId),
      limit(3)
    );
    
    const relatedSnapshot = await getDocs(relatedQuery);
    const relatedItems = relatedSnapshot.docs.map(doc => {
      const data = doc.data();
      const totalVotes = (data.rateCount || 0) + (data.mehCount || 0) + (data.hateCount || 0);
      const ratePercentage = totalVotes > 0 
        ? Math.round(((data.rateCount || 0) / totalVotes) * 100) 
        : 50;
      const mehPercentage = totalVotes > 0 
        ? Math.round(((data.mehCount || 0) / totalVotes) * 100)
        : 0;
      const hatePercentage = totalVotes > 0 
        ? 100 - ratePercentage - mehPercentage
        : 50;
        
      return {
        id: doc.id,
        name: data.name || 'Unknown Item',
        imageUrl: data.imageUrl || null,
        ratePercentage,
        mehPercentage,
        hatePercentage,
      };
    });
    
    return relatedItems;
  } catch (error) {
    console.error('Error fetching related items:', error);
    return [];
  }
}

export default async function ItemDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const item = await getItem(id);
  const relatedItems = await getRelatedItems(item.category, id);

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
}
