'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Meh, 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Plus,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import VotingButtons from './VotingButtons';

interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  rateCount: number;
  mehCount: number;
  hateCount: number;
  totalVotes: number;
  createdAt: any;
}

const HomeContent: React.FC = () => {
  const [trendingItems, setTrendingItems] = useState<Item[]>([]);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [controversialItems, setControversialItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch trending items (most votes)
        const trendingQuery = query(
          collection(db, 'items'),
          orderBy('totalVotes', 'desc'),
          where('totalVotes', '>', 0),
          limit(6)
        );
        
        // Fetch recent items
        const recentQuery = query(
          collection(db, 'items'),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        
        // Fetch controversial items (close vote distribution)
        const controversialQuery = query(
          collection(db, 'items'),
          where('totalVotes', '>', 5), // Only items with meaningful vote counts
          orderBy('totalVotes', 'desc'),
          limit(20) // Get more to filter for controversial ones
        );

        const [trendingSnapshot, recentSnapshot, controversialSnapshot] = await Promise.all([
          getDocs(trendingQuery),
          getDocs(recentQuery),
          getDocs(controversialQuery),
        ]);

        const trendingData = trendingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[];

        const recentData = recentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[];
        
        // Process controversial items - find ones with close vote distribution
        const allItems = controversialSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Item[];
        
        // Sort by how close the vote percentages are
        const controversialData = allItems
          .filter(item => item.totalVotes > 0)
          .map(item => {
            const ratePercent = (item.rateCount / item.totalVotes) * 100;
            const mehPercent = (item.mehCount / item.totalVotes) * 100;
            const hatePercent = (item.hateCount / item.totalVotes) * 100;
            
            // Calculate how close the distribution is (lower = more controversial)
            const difference = Math.abs(ratePercent - hatePercent);
            
            return {
              ...item,
              controversy: difference
            };
          })
          .sort((a, b) => a.controversy - b.controversy)
          .slice(0, 6);

        setTrendingItems(trendingData);
        setRecentItems(recentData);
        setControversialItems(controversialData);
      } catch (error) {
        console.error('Error fetching items:', error);
        setError('Failed to load items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Calculate vote percentages
  const getVotePercentages = (item: Item) => {
    const total = item.totalVotes || 1; // Avoid division by zero
    return {
      rate: Math.round((item.rateCount / total) * 100),
      meh: Math.round((item.mehCount / total) * 100),
      hate: Math.round((item.hateCount / total) * 100),
    };
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      // For recent dates (within last 7 days), show relative time
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 1) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      }
      
      // Otherwise show formatted date
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recently';
    }
  };

  // Item card component to reduce duplication
  const ItemCard = ({ item }: { item: Item }) => {
    const percentages = getVotePercentages(item);
    
    return (
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col"
      >
        <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              className="transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder.png';
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400 dark:text-gray-500 text-lg">No image</span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {item.category}
          </div>
          {item.createdAt && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatDate(item.createdAt)}
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <Link href={`/item/${item.id}`} className="group">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {item.name}
            </h3>
          </Link>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 flex-grow">
            {item.description}
          </p>

          {/* Vote progress bars */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center">
              <ThumbsUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${percentages.rate}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
                {percentages.rate}%
              </span>
            </div>
            <div className="flex items-center">
              <Meh className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mr-2" />
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${percentages.meh}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
                {percentages.meh}%
              </span>
            </div>
            <div className="flex items-center">
              <ThumbsDown className="w-4 h-4 text-red-600 dark:text-red-400 mr-2" />
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${percentages.hate}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
                {percentages.hate}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {item.totalVotes.toLocaleString()} {item.totalVotes === 1 ? 'vote' : 'votes'}
            </span>
            <Link 
              href={`/item/${item.id}`}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
            >
              View <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Empty state component
  const EmptyState = ({ message, actionLink, actionText }: { message: string, actionLink?: string, actionText?: string }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
      <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
      {actionLink && actionText && (
        <Link
          href={actionLink}
          className="inline-block bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-16 pt-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center text-red-800 dark:text-red-300">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 pt-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-700 dark:to-blue-500 py-12 px-4 sm:px-6 lg:px-8 rounded-xl mb-12 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Rate It or Hate It <span className="text-yellow-300">MEH</span>trics
          </h1>
          <p className="text-xl text-white opacity-90 mb-8">
            Voice your opinion on products, brands, and more with a simple click
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/category/all"
              className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium shadow-md transition-colors duration-200 flex items-center justify-center"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Browse Products
            </Link>
            <Link
              href="/add-item"
              className="bg-blue-800 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-medium shadow-md transition-colors duration-200 flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Item
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Items Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Trending Items</h2>
          </div>
          <Link 
            href="/trending"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center text-sm font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {trendingItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState 
            message="No trending items yet. Be the first to add an item!" 
            actionLink="/add-item"
            actionText="Add an Item"
          />
        )}
      </section>

      {/* Controversial Items Section */}
      {controversialItems.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-2" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hot Debates</h2>
            </div>
            <Link 
              href="/controversial"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center text-sm font-medium bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {controversialItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Items Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Clock className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recently Added</h2>
          </div>
          <Link 
            href="/recent"
            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 flex items-center text-sm font-medium bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg transition-colors"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {recentItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState 
            message="No items have been added yet. Be the first!" 
            actionLink="/add-item"
            actionText="Add an Item"
          />
        )}
      </section>

      {/* CTA Section for Users */}
      {!user && (
        <section className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 text-center mb-12 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Join our community today!
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            Sign up to start voting, add your own items, and join the conversation.
            Your opinion matters in the Rate It or Hate It community!
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Link
              href="/register"
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-medium shadow-md transition-colors duration-200"
            >
              Sign Up Now
            </Link>
            <Link
              href="/login"
              className="bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 px-6 py-3 rounded-lg font-medium shadow-md transition-colors duration-200"
            >
              Log In
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomeContent;