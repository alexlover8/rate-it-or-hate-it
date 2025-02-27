import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Share2, MessageCircle, Bookmark, ArrowLeft } from 'lucide-react';
import VotingButtons from '@/components/VotingButtons';

// Enhanced mock data with more fields - replace with your API/database call
async function getItem(id: string) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    id,
    name: `Item ${id}`,
    description: 'This is a detailed description of the item. It includes information about features, benefits, and what makes it unique compared to similar products in the market.',
    loveCount: 100,
    hateCount: 30,
    category: 'electronics',
    categoryId: 1,
    dateAdded: '2023-10-15',
    imageUrl: `/images/item-${id}.jpg`,
    comments: [
      { id: 1, user: 'User123', text: 'Great product, would recommend!', date: '2023-10-20' },
      { id: 2, user: 'Reviewer', text: 'Not what I expected.', date: '2023-10-18' },
    ],
    relatedItems: [
      { id: '101', name: 'Related Item 1', category: 'electronics', imageUrl: '/images/item-101.jpg' },
      { id: '102', name: 'Related Item 2', category: 'electronics', imageUrl: '/images/item-102.jpg' },
    ]
  };
}

// Simulated fetch for related items in the same category
async function getRelatedItems(categoryId: number, currentItemId: string) {
  // This would be a real database query in production
  return [
    { id: '201', name: 'Similar Product', imageUrl: '/images/item-201.jpg', lovePercentage: 75 },
    { id: '202', name: 'Another Option', imageUrl: '/images/item-202.jpg', lovePercentage: 82 },
    { id: '203', name: 'Alternative Choice', imageUrl: '/images/item-203.jpg', lovePercentage: 68 },
  ].filter(item => item.id !== currentItemId);
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
  const item = await getItem(id);
  const relatedItems = await getRelatedItems(item.categoryId, id);

  // Calculate percentages
  const totalVotes = item.loveCount + item.hateCount;
  const lovePercentage = totalVotes > 0 ? Math.round((item.loveCount / totalVotes) * 100) : 0;
  const hatePercentage = 100 - lovePercentage;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back navigation */}
        <Link 
          href={`/category/${item.category}`} 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to {item.category}</span>
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Image and details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Item image */}
              <div className="relative h-64 md:h-96 bg-gray-200">
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
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
              </div>
              
              {/* Item details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-3xl font-bold">{item.name}</h1>
                    <Link 
                      href={`/category/${item.category}`}
                      className="text-sm text-blue-500 hover:underline"
                    >
                      {item.category}
                    </Link>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-500 hover:text-blue-500 transition-colors">
                      <Share2 size={20} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-blue-500 transition-colors">
                      <Bookmark size={20} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6">{item.description}</p>
                
                {/* Voting section */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">What do you think?</h2>
                  <VotingButtons itemId={item.id} />
                </div>
                
                {/* Vote results */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Vote Results</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-green-600 font-medium">Rate It</p>
                        <p className="text-green-600 font-bold">{lovePercentage}%</p>
                      </div>
                      <div className="bg-green-100 h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full"
                          style={{ width: `${lovePercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">{item.loveCount} votes</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-red-600 font-medium">Hate It</p>
                        <p className="text-red-600 font-bold">{hatePercentage}%</p>
                      </div>
                      <div className="bg-red-100 h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-400 to-red-600 h-4 rounded-full"
                          style={{ width: `${hatePercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">{item.hateCount} votes</p>
                    </div>
                  </div>
                </div>
                
                {/* Date added info */}
                <div className="text-sm text-gray-500">
                  Added on {new Date(item.dateAdded).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
            
            {/* Comments section */}
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <MessageCircle size={20} className="mr-2" />
                  Comments ({item.comments.length})
                </h2>
                <button className="text-blue-500 hover:text-blue-700 text-sm">Add Comment</button>
              </div>
              
              {item.comments.length > 0 ? (
                <div className="space-y-4">
                  {item.comments.map(comment => (
                    <div key={comment.id} className="border-b pb-4">
                      <div className="flex justify-between mb-1">
                        <p className="font-medium">{comment.user}</p>
                        <p className="text-sm text-gray-500">{comment.date}</p>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </div>
          
          {/* Right column - Related items and ads */}
          <div>
            {/* Related items section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Similar Items</h3>
              <div className="space-y-4">
                {relatedItems.map(related => (
                  <Link key={related.id} href={`/item/${related.id}`}>
                    <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="relative w-16 h-16 bg-gray-200 rounded overflow-hidden">
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
                            <span className="text-xs text-gray-400">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{related.name}</p>
                        <div className="flex items-center">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-1.5 bg-green-500 rounded-full" 
                              style={{ width: `${related.lovePercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">{related.lovePercentage}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link 
                href={`/category/${item.category}`}
                className="mt-4 text-blue-500 hover:text-blue-700 text-sm block text-center"
              >
                View more {item.category}
              </Link>
            </div>
            
            {/* Placeholder for future recommendation widget */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">Trending Now</h3>
              <p className="text-gray-500 text-sm mb-4">What people are rating this week</p>
              
              {/* This would be populated with actual trending items */}
              <div className="space-y-2">
                <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}