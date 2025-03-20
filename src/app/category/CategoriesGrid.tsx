'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Search, Tag, Grid3x3, List, Layers } from 'lucide-react';
import { Category } from '@/lib/server-data';

interface CategoriesGridProps {
  categories: Category[];
}

// Define a list of gradient backgrounds to cycle through
const gradients = [
  'from-blue-500 to-teal-400',
  'from-purple-500 to-pink-400',
  'from-red-500 to-orange-400',
  'from-green-500 to-teal-400',
  'from-indigo-500 to-blue-400',
  'from-pink-500 to-rose-400',
  'from-yellow-500 to-amber-400',
  'from-teal-500 to-emerald-400',
  'from-fuchsia-500 to-purple-400',
  'from-orange-500 to-red-400',
  'from-lime-500 to-green-400',
  'from-sky-500 to-blue-400',
];

export default function CategoriesGrid({ categories }: CategoriesGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [categoriesWithCounts, setCategoriesWithCounts] = useState<Category[]>(categories);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  
  // Fetch latest category counts
  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        setIsLoadingCounts(true);
        const response = await fetch('/api/category-counts');
        
        if (response.ok) {
          const data = await response.json();
          const counts = data.categories;
          
          // Update categories with latest counts
          const updatedCategories = categories.map(category => ({
            ...category,
            itemCount: counts[category.id] !== undefined ? counts[category.id] : category.itemCount
          }));
          
          setCategoriesWithCounts(updatedCategories);
        }
      } catch (error) {
        console.error('Error fetching category counts:', error);
      } finally {
        setIsLoadingCounts(false);
      }
    };
    
    fetchCategoryCounts();
  }, [categories]);
  
  // Filter categories based on search term
  const filteredCategories = categoriesWithCounts.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Sort categories alphabetically
  const sortedCategories = [...filteredCategories].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-8">
      {/* Search and view controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            className="block w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">View:</span>
          <button
            onClick={() => setViewType('grid')}
            className={`p-2 rounded ${
              viewType === 'grid' 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="Grid view"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewType('list')}
            className={`p-2 rounded ${
              viewType === 'list' 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Category count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
        {searchTerm && ` matching "${searchTerm}"`}
      </div>
      
      {/* No results */}
      {filteredCategories.length === 0 && (
        <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-full">
              <Tag className="h-10 w-10 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3">No categories found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn't find any categories matching your search.
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors shadow-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}
      
      {/* Grid view */}
      {viewType === 'grid' && filteredCategories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCategories.map((category, index) => (
            <Link 
              href={`/category/${category.slug}`} 
              key={category.id}
              className="block group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 h-full border border-gray-100 dark:border-gray-700 flex flex-col transform hover:-translate-y-1">
                <div className={`h-40 bg-gradient-to-br ${gradients[index % gradients.length]} relative overflow-hidden flex items-center justify-center`}>
                  {category.icon && (
                    <div className="text-6xl absolute opacity-60">
                      {category.icon}
                    </div>
                  )}
                  {!category.icon && !category.imageUrl && (
                    <Layers className="w-20 h-20 text-white/40" />
                  )}
                  {category.imageUrl && (
                    <Image 
                      src={category.imageUrl} 
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.png';
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <h2 className="text-2xl font-bold text-white text-center px-4">
                      {category.name}
                    </h2>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4 flex-grow">
                    {category.description || `Browse items in the ${category.name} category`}
                  </p>
                  
                  <div className="mt-auto text-sm flex items-center">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full">
                      {category.itemCount !== undefined ? category.itemCount : 0} {(category.itemCount === 1) ? 'item' : 'items'}
                    </div>
                    <div className="ml-auto text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline flex items-center">
                      View category
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      
      {/* List view */}
      {viewType === 'list' && filteredCategories.length > 0 && (
        <div className="space-y-4">
          {sortedCategories.map((category, index) => (
            <Link 
              href={`/category/${category.slug}`} 
              key={category.id}
              className="block group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 flex items-center transform hover:-translate-y-1 hover:translate-x-1">
                <div className={`w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br ${gradients[index % gradients.length]} flex-shrink-0 flex items-center justify-center relative`}>
                  {category.icon && (
                    <div className="text-3xl absolute text-white">
                      {category.icon}
                    </div>
                  )}
                  {!category.icon && !category.imageUrl && (
                    <Layers className="w-8 h-8 text-white/60" />
                  )}
                  {category.imageUrl && (
                    <Image 
                      src={category.imageUrl} 
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 96px, 120px"
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder.png';
                      }}
                    />
                  )}
                </div>
                
                <div className="p-4 flex-1">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {category.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-1 mb-1">
                    {category.description || `Browse items in the ${category.name} category`}
                  </p>
                  <div className="text-sm flex items-center">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs">
                      {category.itemCount !== undefined ? category.itemCount : 0} {(category.itemCount === 1) ? 'item' : 'items'}
                    </div>
                  </div>
                </div>
                
                <div className="pr-4 text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="sr-only">View category</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}