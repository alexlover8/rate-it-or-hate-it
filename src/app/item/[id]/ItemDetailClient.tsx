'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Share2,
  Bookmark,
  ArrowLeft,
  ThumbsUp,
  Meh,
  ThumbsDown
} from 'lucide-react';
import VotingButtons from '@/components/VotingButtons';
import CommentSection from '@/components/CommentSection';
import SentimentAnalysis from '@/components/SentimentAnalysis';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';

export type RelatedItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  ratePercentage: number;
  mehPercentage: number;
  hatePercentage: number;
};

export type Comment = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: Date;
};

export type ItemProps = {
  item: {
    id: string;
    name: string;
    description: string;
    userReview?: string; // Added userReview field
    rateCount: number;
    mehCount: number;
    hateCount: number;
    category: string;
    dateAdded: string;
    imageUrl: string | null;
    commentCount: number;
    comments: Comment[];
    creatorId: string | null;
    creatorName: string;
  };
  relatedItems: RelatedItem[];
  ratePercentage: number;
  mehPercentage: number;
  hatePercentage: number;
};

export default function ItemDetailClient({
  item,
  relatedItems,
  ratePercentage,
  mehPercentage,
  hatePercentage
}: ItemProps) {
  // Retrieve the current authenticated user from your auth hook
  const { user } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  // Check if the item is bookmarked on initial load
  useEffect(() => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      setIsBookmarked(bookmarks.includes(item.id));
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  }, [item.id]);

  // Handle sharing functionality
  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.name,
          text: `Check out ${item.name} on Rate It or Hate It!`,
          url: window.location.href,
        });
        toast({
          title: "Shared successfully",
          type: "success",
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied to clipboard!",
          type: "success",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Failed to share",
        description: "Please try again later",
        type: "error",
      });
    } finally {
      setIsSharing(false);
    }
  };

  // Handle bookmark functionality
  const handleBookmark = () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      if (isBookmarked) {
        // Remove from bookmarks
        const updatedBookmarks = bookmarks.filter((id: string) => id !== item.id);
        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
        setIsBookmarked(false);
        toast({
          title: "Removed from bookmarks",
          type: "default",
        });
      } else {
        // Add to bookmarks
        bookmarks.push(item.id);
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        setIsBookmarked(true);
        toast({
          title: "Added to bookmarks",
          type: "success",
        });
      }
    } catch (error) {
      console.error('Error updating bookmarks:', error);
      toast({
        title: "Couldn't update bookmarks",
        description: "Please try again later",
        type: "error",
      });
    }
  };

  const totalVotes = item.rateCount + item.mehCount + item.hateCount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Back navigation */}
        <Link
          href={`/category/${item.category}`}
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to {item.category}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Image and details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg">
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
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/placeholder.png';
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
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {item.name}
                    </h1>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/category/${item.category}`}
                        className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
                      >
                        {item.category}
                      </Link>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Added by {item.creatorName}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={isSharing}
                      className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                      aria-label="Share"
                    >
                      <Share2 size={20} className={isSharing ? 'animate-pulse' : ''} />
                    </button>
                    <button
                      type="button"
                      onClick={handleBookmark}
                      className={`p-2 rounded-full transition-colors ${
                        isBookmarked
                          ? 'bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-500 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                      }`}
                      aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                    >
                      <Bookmark size={20} />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {item.description}
                </p>

                {/* User Review Section - Add this code */}
                {item.userReview && (
                  <div className="mb-6 border-l-4 border-blue-400 dark:border-blue-600 pl-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-r-md">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Review by {item.creatorName}:
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm italic">
                      {item.userReview}
                    </p>
                  </div>
                )}

                {/* Voting section */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    What do you think?
                  </h2>
                  <VotingButtons
                    itemId={item.id}
                    initialRateCount={item.rateCount}
                    initialMehCount={item.mehCount}
                    initialHateCount={item.hateCount}
                  />
                </div>

                {/* Vote results */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 mb-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    MEHtrics
                    <span className="ml-2 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                      {totalVotes} votes
                    </span>
                  </h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                          <ThumbsUp size={14} className="mr-1" /> Rate It
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-bold">{ratePercentage}%</p>
                      </div>
                      <div className="bg-blue-100 dark:bg-blue-900/30 h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${ratePercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.rateCount} votes</p>
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="flex items-center text-yellow-600 dark:text-yellow-400 font-medium">
                          <Meh size={14} className="mr-1" /> Meh
                        </p>
                        <p className="text-yellow-600 dark:text-yellow-400 font-bold">{mehPercentage}%</p>
                      </div>
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-4 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${mehPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.mehCount} votes</p>
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="flex items-center text-red-600 dark:text-red-400 font-medium">
                          <ThumbsDown size={14} className="mr-1" /> Hate It
                        </p>
                        <p className="text-red-600 dark:text-red-400 font-bold">{hatePercentage}%</p>
                      </div>
                      <div className="bg-red-100 dark:bg-red-900/30 h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-red-400 to-red-600 h-4 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${hatePercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{item.hateCount} votes</p>
                    </div>
                  </div>
                </div>

                {/* Date added info */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Added on{" "}
                  {new Date(item.dateAdded).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </div>

                {/* Edit functionality: only show if the current user is the creator */}
                {user && user.uid === item.creatorId && (
                  <div className="mt-4">
                    <Link
                      href={`/item/${item.id}/edit`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      Edit Item
                    </Link>
                  </div>
                )}
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

          {/* Right column - Related items and trending */}
          <div className="space-y-6">
            {/* Related items section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Similar Items</h3>
              {relatedItems && relatedItems.length > 0 ? (
                <div className="space-y-4">
                  {relatedItems.map((related) => (
                    <div
                      key={related.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Link href={`/item/${related.id}`} className="flex items-center p-2">
                        <div className="relative w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
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
                        <div className="ml-3 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {related.name}
                          </p>
                          <div className="flex items-center mt-1">
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                              <div
                                className="h-1.5 bg-blue-500"
                                style={{ width: `${related.ratePercentage}%` }}
                              ></div>
                              <div
                                className="h-1.5 bg-yellow-500"
                                style={{ width: `${related.mehPercentage}%` }}
                              ></div>
                              <div
                                className="h-1.5 bg-red-500"
                                style={{ width: `${related.hatePercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                  <Link
                    href={`/category/${item.category}`}
                    className="mt-4 inline-block w-full text-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    View more in {item.category}
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No similar items found</p>
                  <Link
                    href="/add-item"
                    className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    Add a similar item
                  </Link>
                </div>
              )}
            </div>

            {/* Trending widget */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 transition-all hover:shadow-lg">
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Trending Now</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">What people are rating this week</p>
              <div className="space-y-3">
                {/* Replace "loading" with your loading state if applicable */}
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              </div>
              <Link
                href="/"
                className="mt-4 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm block text-center"
              >
                Explore trending items
              </Link>
            </div>

            {/* User Contribution Widget */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Add Your Own Item</h3>
              <p className="text-blue-100 mb-4">Have a product you want others to rate? Add it to our platform!</p>
              <Link
                href="/add-item"
                className="block w-full text-center px-4 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Add New Item
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}