import Image from 'next/image';
import Link from 'next/link';
import { Share2, Bookmark, ArrowLeft } from 'lucide-react';
import VotingButtons from '@/components/VotingButtons';
import CommentSection from '@/components/CommentSection';
import SentimentAnalysis from '@/components/SentimentAnalysis';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
        loveCount: 0,
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
      loveCount: data.rateCount || 0,
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
      loveCount: 0,
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
      const totalVotes = (data.rateCount || 0) + (data.hateCount || 0);
      const lovePercentage = totalVotes > 0 
        ? Math.round(((data.rateCount || 0) / totalVotes) * 100) 
        : 50;
        
      return {
        id: doc.id,
        name: data.name || 'Unknown Item',
        imageUrl: data.imageUrl || null,
        lovePercentage: lovePercentage
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

  // Calculate percentages
  const totalVotes = item.loveCount + item.hateCount;
  const lovePercentage = totalVotes > 0 ? Math.round((item.loveCount / totalVotes) * 100) : 0;
  const hatePercentage = 100 - lovePercentage;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back navigation */}
        <Link 
          href={`/category/${item.category}`} 
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to {item.category}</span>
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Image and details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              {/* Item image */}
              <div className="relative h-64 md:h-96 bg-gray-200 dark:bg-gray-700">
                {item.imageUrl ? (
                  <Image 
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 66vw"
                    className="object-contain" 
                    priority
                    // Fallback for image errors
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.png';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 dark:text-gray-500">No image available</span>
                  </div>
                )}
              </div>
              
              {/* Item details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{item.name}</h1>
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/category/${item.category}`}
                        className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
                      >
                        {item.category}
                      </Link>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Added by {item.creatorName}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      aria-label="Share"
                      type="button"
                    >
                      <Share2 size={20} />
                    </button>
                    <button 
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      aria-label="Bookmark"
                      type="button"
                    >
                      <Bookmark size={20} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6">{item.description}</p>
                
                {/* Voting section */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">What do you think?</h2>
                  <VotingButtons 
                    itemId={item.id} 
                    initialRateCount={item.loveCount}
                    initialHateCount={item.hateCount}
                  />
                </div>
                
                {/* Vote results - You can remove this if it's already in VotingButtons */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Vote Results</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-green-600 dark:text-green-400 font-medium">Rate It</p>
                        <p className="text-green-600 dark:text-green-400 font-bold">{lovePercentage}%</p>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/30 h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full"
                          style={{ width: `${lovePercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.loveCount} votes</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-red-600 dark:text-red-400 font-medium">Hate It</p>
                        <p className="text-red-600 dark:text-red-400 font-bold">{hatePercentage}%</p>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/30 h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-400 to-red-600 h-4 rounded-full"
                          style={{ width: `${hatePercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.hateCount} votes</p>
                    </div>
                  </div>
                </div>
                
                {/* Date added info */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Added on {new Date(item.dateAdded).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
            
            {/* Comment analysis section */}
            <div className="mt-8">
              <SentimentAnalysis itemId={item.id} comments={item.comments || []} />
            </div>
            
            {/* Comments section */}
            <div className="mt-8">
              <CommentSection itemId={item.id} initialCommentCount={item.commentCount || 0} />
            </div>
          </div>
          
          {/* Right column - Related items and ads */}
          <div>
            {/* Related items section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Similar Items</h3>
              <div className="space-y-4">
                {relatedItems.map(related => (
                  <div key={related.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Link href={`/item/${related.id}`} className="flex items-center p-2">
                      <div className="relative w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                        {related.imageUrl ? (
                          <Image
                            src={related.imageUrl}
                            alt={related.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-400 dark:text-gray-500">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900 dark:text-white">{related.name}</p>
                        <div className="flex items-center">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                            <div 
                              className="h-1.5 bg-green-500 rounded-full" 
                              style={{ width: `${related.lovePercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{related.lovePercentage}%</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              <Link 
                href={`/category/${item.category}`}
                className="mt-4 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm block text-center"
              >
                View more {item.category}
              </Link>
            </div>
            
            {/* Placeholder for future recommendation widget */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Trending Now</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">What people are rating this week</p>
              
              {/* This would be populated with actual trending items */}
              <div className="space-y-2">
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}