'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { Item } from '@/lib/data';

type ItemWithDate = Item & {
  createdAt: string;
};
import { ThumbsUp, ThumbsDown, Meh, MessageSquare, RefreshCw, Filter, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

type SortOption = 'newest' | 'popular' | 'controversial';
type FilterOption = 'all' | 'high-rated' | 'mixed' | 'low-rated';

type CategoryItemsListProps = {
  initialItems: Item[];
  categoryId: string;
  categoryName: string;
};

export default function CategoryItemsList({ 
  initialItems,
  categoryId,
  categoryName 
}: CategoryItemsListProps) {
  // Convert initialItems to ItemWithDate, safely handling missing dateAdded
  const itemsWithCreatedAt: ItemWithDate[] = initialItems.map(item => ({
    ...item,
    createdAt: item.dateAdded || item.lastUpdated || new Date().toISOString()
  }));

  const [items, setItems] = useState<ItemWithDate[]>(itemsWithCreatedAt);
  const [filteredItems, setFilteredItems] = useState<ItemWithDate[]>(itemsWithCreatedAt);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= 20);
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const { toast } = useToast();

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

  // Apply sorting and filtering
  const applySortAndFilter = useCallback(() => {
    let result = [...items];
    
    // Apply filter
    if (filterOption !== 'all') {
      result = result.filter(item => {
        const total = item.rateCount + item.mehCount + item.hateCount;
        if (total === 0) return true;
        
        const ratePercentage = (item.rateCount / total) * 100;
        const hatePercentage = (item.hateCount / total) * 100;
        const mehPercentage = (item.mehCount / total) * 100;
        
        switch (filterOption) {
          case 'high-rated':
            return ratePercentage > 60;
          case 'mixed':
            return mehPercentage > 40;
          case 'low-rated':
            return hatePercentage > 60;
          default:
            return true;
        }
      });
    }
    
    // Apply sort
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'popular':
        result.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
        break;
      case 'controversial':
        result.sort((a, b) => {
          const totalA = a.rateCount + a.mehCount + a.hateCount;
          const totalB = b.rateCount + b.mehCount + b.hateCount;
          
          if (totalA === 0) return 1;
          if (totalB === 0) return -1;
          
          const ratePercentA = (a.rateCount / totalA) * 100;
          const hatePercentA = (a.hateCount / totalA) * 100;
          const diffA = Math.abs(ratePercentA - hatePercentA);
          
          const ratePercentB = (b.rateCount / totalB) * 100;
          const hatePercentB = (b.hateCount / totalB) * 100;
          const diffB = Math.abs(ratePercentB - hatePercentB);
          
          return diffA - diffB; // Smaller difference = more controversial
        });
        break;
    }
    
    setFilteredItems(result);
  }, [items, sortOption, filterOption]);

  // Handle sort change
  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
    toast({
      title: `Sorted by ${option}`,
      type: "default"
    });
  };

  // Handle filter change
  const handleFilterChange = (option: FilterOption) => {
    setFilterOption(option);
    setIsFilterMenuOpen(false);
    toast({
      title: `Filtered: ${option.replace('-', ' ')}`,
      type: "default"
    });
  };

  // Apply sorting and filtering whenever items, sortOption, or filterOption changes
  useEffect(() => {
    applySortAndFilter();
  }, [items, sortOption, filterOption, applySortAndFilter]);

  // Load more items
  const loadMoreItems = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    try {
      // You'd implement pagination here - this is a placeholder
      // For a full implementation, you'd need to track the last document
      const response = await fetch(`/api/items?category=${categoryId}&startAfter=${items.length}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch more items');
      }
      
      const newItems = await response.json();
      
      if (newItems.length > 0) {
        // Convert new items to ItemWithDate format
        const newItemsWithCreatedAt: ItemWithDate[] = newItems.map((item: Item) => ({
          ...item,
          createdAt: item.dateAdded || item.lastUpdated || new Date().toISOString()
        }));
        
        setItems(prevItems => [...prevItems, ...newItemsWithCreatedAt]);
        setHasMore(newItems.length >= 20);
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

  // Load more when scrolling to bottom (optional enhancement)
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 300 &&
        hasMore &&
        !isLoading
      ) {
        loadMoreItems();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading]);

  if (initialItems.length === 0) {
    return (
      <div className="py-12 text-center bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
            <Filter className="h-10 w-10 text-blue-500 dark:text-blue-400" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No items found</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
          There are no items in the {categoryName} category yet. Be the first to add one!
        </p>
        <Link 
          href="/add-item" 
          className="inline-block px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm"
        >
          Add First Item
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort and filter controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
        <div className="flex items-center">
          <span className="text-gray-700 dark:text-gray-300 text-sm mr-3 hidden sm:inline">Sort by:</span>
          <div className="flex space-x-2">
            <button 
              onClick={() => handleSortChange('popular')}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center ${
                sortOption === 'popular' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <ThumbsUp className="h-3.5 w-3.5 mr-1.5" /> Popular
            </button>
            <button 
              onClick={() => handleSortChange('newest')}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center ${
                sortOption === 'newest' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Newest
            </button>
            <button 
              onClick={() => handleSortChange('controversial')}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center ${
                sortOption === 'controversial' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" /> Controversial
            </button>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm flex items-center"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            Filter: {filterOption === 'all' ? 'All Items' : filterOption === 'high-rated' ? 'Highly Rated' : filterOption === 'mixed' ? 'Mixed Reviews' : 'Strongly Disliked'}
          </button>
          
          {isFilterMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-lg z-10 border border-gray-200 dark:border-gray-700">
              <div className="p-2">
                <button 
                  onClick={() => handleFilterChange('all')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${
                    filterOption === 'all' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All Items
                </button>
                <button 
                  onClick={() => handleFilterChange('high-rated')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${
                    filterOption === 'high-rated' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Highly Rated ({'>'}60%)
                </button>
                <button 
                  onClick={() => handleFilterChange('mixed')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm mb-1 ${
                    filterOption === 'mixed' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Mixed Reviews (Meh {'>'}40%)
                </button>
                <button 
                  onClick={() => handleFilterChange('low-rated')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                    filterOption === 'low-rated' 
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Strongly Disliked ({'>'}60%)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results stats */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Showing {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} in {categoryName}
      </div>
      
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            No items match your current filters.
          </p>
          <button
            onClick={() => setFilterOption('all')}
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const sentiment = calculateSentimentPercentage(item);
            const totalVotes = item.rateCount + item.mehCount + item.hateCount;
            
            return (
              <Link href={`/item/${item.id}`} key={item.id} className="block group">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 h-full border border-gray-100 dark:border-gray-700 flex flex-col">
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
                    
                    {/* Vote count badge */}
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {item.name}
                    </h2>
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
      )}
      
      {hasMore && (
        <div className="text-center py-4">
          <button 
            onClick={loadMoreItems}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed font-medium shadow-sm flex items-center justify-center mx-auto"
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