'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Sparkles, Flame, ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import { useRouter } from 'next/navigation';
import React from 'react';

// Mock data for trending items
const trendingItems = [
  {
    id: '1',
    name: 'Latest Smartphone',
    description: 'Next-generation smartphone with advanced camera features and all-day battery life.',
    category: 'electronics',
    imageUrl: '/images/smartphone.jpg',
    ratePercentage: 87,
    votes: 1243
  },
  {
    id: '2',
    name: 'Wireless Earbuds',
    description: 'Premium sound quality with active noise cancellation and water resistance.',
    category: 'electronics',
    imageUrl: '/images/earbuds.jpg',
    ratePercentage: 92,
    votes: 856
  },
  {
    id: '3',
    name: 'Streaming Service',
    description: 'Popular entertainment platform with original shows and movies.',
    category: 'companies',
    imageUrl: '/images/streaming.jpg',
    ratePercentage: 76,
    votes: 2198
  },
  {
    id: '4',
    name: 'Best-Selling Novel',
    description: 'The latest thriller that everyone is talking about this summer.',
    category: 'books',
    imageUrl: '/images/novel.jpg',
    ratePercentage: 83,
    votes: 732
  },
  {
    id: '5',
    name: 'Coffee Chain',
    description: 'Global coffee shop known for its seasonal drinks and comfortable atmosphere.',
    category: 'companies',
    imageUrl: '/images/coffee.jpg',
    ratePercentage: 68,
    votes: 1567
  },
  {
    id: '6',
    name: 'Smart Watch',
    description: 'Fitness and health tracking with smart notifications and long battery life.',
    category: 'electronics',
    imageUrl: '/images/smartwatch.jpg',
    ratePercentage: 89,
    votes: 945
  }
];

// Top categories with item counts
const categories = [
  { name: 'Electronics', slug: 'electronics', count: 156, icon: '💻' },
  { name: 'Companies', slug: 'companies', count: 89, icon: '🏢' },
  { name: 'Books', slug: 'books', count: 72, icon: '📚' },
  { name: 'Movies', slug: 'movies', count: 65, icon: '🎬' },
];

// Inner component with client-side hooks
function HomeContent() {
  const router = useRouter();
  
  const handleItemClick = (itemId: string, e: React.MouseEvent<HTMLDivElement>) => {
    // If the click is on a link, let the link handle the navigation
    if (e.target instanceof Element && e.target.closest('a')) {
      e.stopPropagation();
      return;
    }
    
    // Otherwise navigate to the item page
    router.push(`/item/${itemId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">
              Rate It or Hate It
            </h1>
            <p className="text-xl md:text-2xl font-light mb-10 text-blue-100">
              Your voice matters. Discover what the world loves and hates today.
            </p>
            
            {/* Search bar with enhanced styling */}
            <div className="max-w-2xl mx-auto">
              <SearchBar />
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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link 
                key={category.slug} 
                href={`/category/${category.slug}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center group"
              >
                <div className="text-4xl mb-2">{category.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{category.count} items</p>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Trending now section - FIXED to avoid nested links */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <Flame size={24} className="mr-2 text-orange-500" />
              Trending Now
            </h2>
            <div className="flex space-x-2 text-sm">
              <button 
                type="button"
                className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm"
              >
                Today
              </button>
              <button 
                type="button"
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded-full text-sm transition-colors"
              >
                This Week
              </button>
              <button 
                type="button"
                className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded-full text-sm transition-colors"
              >
                This Month
              </button>
            </div>
          </div>
          
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
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500">No image available</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90 rounded-full px-2 py-1 text-xs font-medium flex items-center">
                    <TrendingUp size={12} className="mr-1 text-orange-500" />
                    {item.votes.toLocaleString()} votes
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
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 flex-grow">{item.description}</p>
                  
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
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">
              Recently Added
            </h2>
            <Link href="/recent" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
              <span>View all</span>
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4" style={{ minWidth: 'max-content' }}>
              {trendingItems.slice(0, 4).reverse().map((item) => (
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
                className="px-4 py-3 rounded-lg flex-grow text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

// Main page component with Suspense
export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="mt-2 text-gray-600 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}