'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Item } from '@/lib/data';
import { ThumbsUp, ThumbsDown, Meh, MessageSquare, RefreshCw, Filter, TrendingUp, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { formatDistanceToNow } from 'date-fns';

type CategoryFilter = string | 'all';

type TrendingItemsListProps = {
  initialItems: Item[];
};

export default function TrendingItemsList({ 
  initialItems,
}: TrendingItemsListProps) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [filteredItems, setFilteredItems] = useState<Item[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 16);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get unique categories from items
  const categories = Array.from(new Set(items.map(item => item.category))).sort();

  // Calculate sentiment percentages
  const calculateSentimentPercentage = (item: Item) => {
    const total = item.rateCount + item.mehCount + item.hateCount;
    if (total === 0) return { rate: 0, meh: 0, hate: 0 };
    
    return {
      rate: Math.round((item.rateCount / total) * 100),
      meh: Math.round((item.mehCount / total) * 100),
      hate: Math.round((item.hateCount / total) * 100)
    };
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  // Apply filtering
  const applyFilters = useCallback(() => {
    let result = [...items];
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(item => item.category === categoryFilter);
    }
    
    // For trending page, we keep the original order (which is by trending score)
    
    setFilteredItems(result);
  }, [items, categoryFilter]);

  // Handle category filter change
  const handleCategoryFilter = (category: CategoryFilter) => {
    setCategoryFilter(category);
    toast({
      title: category === 'all' ? 'Showing all categories' : `Filtered to ${category}`,
      type: "default"
    });
  };

  // Click outside to close filters
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Apply filtering whenever relevant state changes
  useEffect(() => {
    applyFilters();
  }, [items, categoryFilter, applyFilters]);

  // Load more items
  const loadMoreItems = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/trending?startAfter=${items.length}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch more trending items');
      }
      
      const newItems = await response.json();
      
      if (newItems.length > 0) {
        setItems(prevItems => [...prevItems, ...newItems]);
        setHasMore(newItems.length >= 16);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more items:', error);
      toast({
        title: "Error loading items",
        description: "Please try again later",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Empty state
  if (initialItems.length === 0) {
    return (
      <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-orange-500 p-4 rounded-full">
            <TrendingUp className="h-10 w-10 text-white" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">No trending items found</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
          There are no trending items at the moment. Check back later or explore other categories!
        </p>
        <Link 
          href="/recent" 
          className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-orange-500 text-white rounded-lg hover:from-purple-600 hover:to-orange-600 transition-all font-medium shadow-md"
        >
          View Recent Items
        </Link>
      </div>
    );
  }

  // Empty results after filtering
  if (filteredItems.length === 0) {
    return (
      <div>
        {/* Filter controls - keep them visible even when no results */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-end gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6 border border-gray-100 dark:border-gray-700">
            <div className="relative" ref={filtersRef}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-sm rounded-lg flex items-center transition-all ${
                  categoryFilter !== 'all' 
                    ? 'bg-gradient-to-r from-purple-500 to-orange-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="h-4 w-4 mr-1.5" />
                {categoryFilter === 'all' ? 'All Categories' : `Category: ${categoryFilter}`}
              </button>
              
              {showFilters && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-20 border border-gray-100 dark:border-gray-700">
                  <div className="p-2 max-h-64 overflow-y-auto">
                    <button 
                      onClick={() => {
                        handleCategoryFilter('all');
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${
                        categoryFilter === 'all' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      All Categories
                    </button>
                    
                    {categories.map(category => (
                      <button 
                        key={category}
                        onClick={() => {
                          handleCategoryFilter(category);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${
                          categoryFilter === category 
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* No results message */}
        <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">No matching items</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            No trending items found with your current filters.
          </p>
          <button
            onClick={() => setCategoryFilter('all')}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          <span className="bg-gradient-to-r from-purple-500 to-orange-500 text-transparent bg-clip-text font-medium">
            Sorted by trending score
          </span>
        </div>
        
        <div className="relative" ref={filtersRef}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 text-sm rounded-lg flex items-center transition-all ${
              categoryFilter !== 'all' 
                ? 'bg-gradient-to-r from-purple-500 to-orange-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            {categoryFilter === 'all' ? 'All Categories' : `Category: ${categoryFilter}`}
          </button>
          
          {showFilters && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-20 border border-gray-100 dark:border-gray-700">
              <div className="p-2 max-h-64 overflow-y-auto">
                <button 
                  onClick={() => {
                    handleCategoryFilter('all');
                    setShowFilters(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${
                    categoryFilter === 'all' 
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All Categories
                </button>
                
                {categories.map(category => (
                  <button 
                    key={category}
                    onClick={() => {
                      handleCategoryFilter(category);
                      setShowFilters(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${
                      categoryFilter === category 
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Showing {filteredItems.length} trending {filteredItems.length === 1 ? 'item' : 'items'}
        {categoryFilter !== 'all' && ` in ${categoryFilter}`}
      </div>
      
      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => {
          const sentiment = calculateSentimentPercentage(item);
          const totalVotes = item.rateCount + item.mehCount + item.hateCount;
          const dateFormatted = formatDate(item.dateAdded);
          
          return (
            <Link href={`/item/${item.id}`} key={item.id} className="block group">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 h-full border border-gray-100 dark:border-gray-700 flex flex-col transform hover:-translate-y-1">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                  {item.imageUrl ? (
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.png';
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500">No image available</span>
                    </div>
                  )}
                  
                  {/* Trending badge */}
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-orange-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center shadow-md">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending
                  </div>
                  
                  {/* Category badge */}
                  <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-full">
                    {item.category}
                  </div>
                  
                  {/* Vote count badge */}
                  <div className="absolute bottom-3 right-3 bg-purple-500/90 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center shadow-md">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                      {item.name}
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4 flex-grow">
                    {item.description}
                  </p>
                  
                  <div className="mt-auto space-y-2">
                    {/* Rate It sentiment bar */}
                    <div className="flex items-center">
                      <div className="w-16 text-sm flex items-center">
                        <ThumbsUp className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-gray-700 dark:text-gray-300">Rate</span>
                      </div>
                      <div className="flex-grow bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${sentiment.rate}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-xs font-medium text-gray-700 dark:text-gray-300 ml-2">
                        {sentiment.rate}%
                      </div>
                    </div>
                    
                    {/* Meh sentiment bar */}
                    <div className="flex items-center">
                      <div className="w-16 text-sm flex items-center">
                        <Meh className="w-3.5 h-3.5 mr-1.5 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-gray-700 dark:text-gray-300">Meh</span>
                      </div>
                      <div className="flex-grow bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${sentiment.meh}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-xs font-medium text-gray-700 dark:text-gray-300 ml-2">
                        {sentiment.meh}%
                      </div>
                    </div>
                    
                    {/* Hate It sentiment bar */}
                    <div className="flex items-center">
                      <div className="w-16 text-sm flex items-center">
                        <ThumbsDown className="w-3.5 h-3.5 mr-1.5 text-red-600 dark:text-red-400" />
                        <span className="text-gray-700 dark:text-gray-300">Hate</span>
                      </div>
                      <div className="flex-grow bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${sentiment.hate}%` }}
                        />
                      </div>
                      <div className="w-10 text-right text-xs font-medium text-gray-700 dark:text-gray-300 ml-2">
                        {sentiment.hate}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    {item.commentCount || 0} {(item.commentCount || 0) === 1 ? 'comment' : 'comments'}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* Load more button */}
      {hasMore && (
        <div className="text-center py-6">
          <button 
            onClick={loadMoreItems}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-600 hover:to-orange-600 text-white rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium shadow-md flex items-center justify-center mx-auto transform hover:-translate-y-1 active:translate-y-0 duration-200"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Items'
            )}
          </button>
        </div>
      )}
    </div>
  );
}