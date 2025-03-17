'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Flame, ArrowRight, TrendingUp, Loader2, Sparkles, Clock } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import { useRouter } from 'next/navigation';
// Import your production data fetching functions from your data module
import { getTrendingItems, getCategories, getRecentItems } from '@/lib/data';
import { Item, Category } from '@/lib/data'; // Import the proper types

function HomeContent() {
  const router = useRouter();
  const [trendingItems, setTrendingItems] = useState<Item[]>([]);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('day');

  // Fetch production data on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get trending items based on selected time frame
        const days = timeFrame === 'day' ? 1 : timeFrame === 'week' ? 7 : 30;
        const items = await getTrendingItems(8, days);
        setTrendingItems(items);
        
        // Get categories with their item counts
        const cats = await getCategories();
        setCategories(cats);
        
        // Get recently added items
        const recent = await getRecentItems(4);
        setRecentItems(recent);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [timeFrame]);

  const handleItemClick = (itemId: string, e: React.MouseEvent<HTMLDivElement>) => {
    // If the click is on a nested link, let that handle navigation
    if (e.target instanceof Element && e.target.closest('a')) {
      e.stopPropagation();
      return;
    }
    router.push(`/item/${itemId}`);
  };
  
  const handleTimeFrameChange = (newTimeFrame: 'day' | 'week' | 'month') => {
    setTimeFrame(newTimeFrame);
  };

  // Loading and error states
  if (isLoading && !trendingItems.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span className="mt-2 text-gray-600 dark:text-gray-300">Loading content...</span>
        </div>
      </div>
    );
  }

  if (error && !trendingItems.length && !categories.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Error Loading Content</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">
              Rate It or Hate It
            </h1>
            <p className="text-xl md:text-2xl font-light mb-10 text-blue-100">
              Your voice matters. Discover what the world loves and hates today.
            </p>
            <div className="max-w-2xl mx-auto">
              <SearchBar variant="hero" placeholder="Search for products, brands, or items..." />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        {/* Top categories section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
              Top Categories
            </h2>
            <Link href="/categories" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
              <span>View all</span>
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 4).map((category) => (
                <Link 
                  key={category.slug} 
                  href={`/category/${category.slug}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center group"
                >
                  <div className="text-4xl mb-2">{category.icon || '🔍'}</div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{category.itemCount || 0} items</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">Categories are loading...</p>
            </div>
          )}
        </div>

        {/* Trending now section */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Flame size={24} className="mr-2 text-orange-500" />
              Trending Now
            </h2>
            <div className="flex space-x-2 text-sm">
              <button 
                type="button" 
                onClick={() => handleTimeFrameChange('day')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  timeFrame === 'day' 
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Today
              </button>
              <button 
                type="button"
                onClick={() => handleTimeFrameChange('week')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  timeFrame === 'week' 
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                This Week
              </button>
              <button 
                type="button"
                onClick={() => handleTimeFrameChange('month')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  timeFrame === 'month' 
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                This Month
              </button>
            </div>
          </div>
          
          {isLoading && !trendingItems.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full animate-pulse">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-5">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : trendingItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={(e) => handleItemClick(item.id, e)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full flex flex-col cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/item/${item.id}`);
                    }
                  }}
                >
                  <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        onError={(e) => {
                          // Fallback for broken images
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 dark:text-gray-500">No image available</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 rounded-full px-2 py-1 text-xs font-medium flex items-center">
                      <TrendingUp size={12} className="mr-1 text-orange-500" />
                      {item.totalVotes.toLocaleString()} votes
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col">
                    <div className="mb-2">
                      <Link 
                        href={`/category/${item.category}`}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wide"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.category}
                      </Link>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{item.name}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow line-clamp-3">{item.description}</p>
                    
                    <div className="mt-auto">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating</span>
                        <div className="flex items-center">
                          <Heart size={14} className="text-red-500 mr-1" />
                          <span className="text-sm font-bold">{item.ratePercentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item.ratePercentage > 75 ? 'bg-green-500' : 
                            item.ratePercentage > 50 ? 'bg-blue-500' : 
                            item.ratePercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.ratePercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <Flame className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">No trending items found for this time period.</p>
              <Link 
                href="/add-item"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add a New Item
              </Link>
            </div>
          )}
          
          <div className="text-center mt-8">
            <Link 
              href="/trending"
              className="inline-flex items-center bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full transition-colors font-medium"
            >
              <Sparkles size={16} className="mr-2" />
              See more trending items
            </Link>
          </div>
        </div>

        {/* Recently added section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Clock size={24} className="mr-2 text-green-500" />
              Recently Added
            </h2>
            <Link href="/recent" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
              <span>View all</span>
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {isLoading && !recentItems.length ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md w-64 animate-pulse">
                    <div className="h-36 bg-gray-200 dark:bg-gray-700"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : recentItems.length > 0 ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
                {recentItems.map((item) => (
                  <div 
                    key={`recent-${item.id}`}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow w-64 cursor-pointer"
                    onClick={(e) => handleItemClick(item.id, e)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/item/${item.id}`);
                      }
                    }}
                  >
                    <div className="relative h-36 bg-gray-200 dark:bg-gray-700">
                      {item.imageUrl ? (
                        <Image 
                          src={item.imageUrl} 
                          alt={item.name}
                          fill
                          sizes="256px"
                          className="object-cover"
                          onError={(e) => {
                            // Fallback for broken images
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-gray-400 dark:text-gray-500">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-md font-bold text-gray-900 dark:text-gray-100 truncate">{item.name}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <Link
                          href={`/category/${item.category}`}
                          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.category}
                        </Link>
                        <div className="flex items-center">
                          <Heart size={12} className="text-red-500 mr-1" />
                          <span className="text-xs font-medium">{item.ratePercentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 mb-4">No recent items found.</p>
              <Link 
                href="/add-item"
                className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add a New Item
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Newsletter section */}
      <div className="bg-gray-900 dark:bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-gray-300 mb-6">Get notified about new trending items and be the first to rate them.</p>
            <form className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Your email address" 
                aria-label="Email address"
                className="px-4 py-3 rounded-lg flex-grow text-gray-800 dark:text-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button 
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" />
          <span className="mt-2 text-gray-600 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}