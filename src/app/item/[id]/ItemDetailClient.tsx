'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, Bookmark, ArrowLeft } from 'lucide-react';
import VotingButtons from '@/components/VotingButtons';
import CommentSection from '@/components/CommentSection';
import SentimentAnalysis from '@/components/SentimentAnalysis';

type RelatedItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  lovePercentage: number;
};

type Comment = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: Date;
};

type ItemProps = {
  item: {
    id: string;
    name: string;
    description: string;
    loveCount: number;
    hateCount: number;
    category: string;
    categoryId: number;
    dateAdded: string;
    imageUrl: string | null;
    commentCount: number;
    comments: Comment[];
    creatorId: string | null;
    creatorName: string;
  };
  relatedItems: RelatedItem[];
  lovePercentage: number;
  hatePercentage: number;
};

export default function ItemDetailClient({ 
  item, 
  relatedItems, 
  lovePercentage, 
  hatePercentage 
}: ItemProps) {
  // Add any client-side state or effects here
  const [isSharing, setIsSharing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Example of a client-side effect
  useEffect(() => {
    // Could check local storage to see if the item is bookmarked
    const checkBookmarkStatus = () => {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        setIsBookmarked(bookmarks.includes(item.id));
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };
    
    checkBookmarkStatus();
  }, [item.id]);
  
  // Example handler for sharing functionality
  const handleShare = () => {
    setIsSharing(true);
    
    // Check if Web Share API is available
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: item.description,
        url: window.location.href,
      })
      .then(() => console.log('Shared successfully'))
      .catch((error) => console.error('Error sharing:', error))
      .finally(() => setIsSharing(false));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          alert('Link copied to clipboard!');
          setIsSharing(false);
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          setIsSharing(false);
        });
    }
  };
  
  // Example handler for bookmark functionality
  const handleBookmark = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      
      if (isBookmarked) {
        // Remove from bookmarks
        const updatedBookmarks = bookmarks.filter((id: string) => id !== item.id);
        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
        setIsBookmarked(false);
      } else {
        // Add to bookmarks
        bookmarks.push(item.id);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error updating bookmarks:', error);
    }
  };

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
                      onClick={handleShare}
                      disabled={isSharing}
                    >
                      <Share2 size={20} className={isSharing ? 'animate-pulse' : ''} />
                    </button>
                    <button 
                      className={`p-2 transition-colors ${
                        isBookmarked 
                          ? 'text-blue-500 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                      }`}
                      aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                      type="button"
                      onClick={handleBookmark}
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
                
                {/* Vote results */}
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
                {relatedItems.length > 0 ? (
                  relatedItems.map(related => (
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
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">No similar items found</p>
                  </div>
                )}
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