// src/app/category/CategoriesGrid.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/lib/data';
import { 
  ChevronRight,
  Star
} from 'lucide-react';

interface CategoriesGridProps {
  categories: Category[];
}

export default function CategoriesGrid({ categories }: CategoriesGridProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Sort categories - parent categories first, then subcategories
  const sortedCategories = [...categories].sort((a, b) => {
    // If both are parent categories or both are subcategories, sort alphabetically
    if ((!a.parentCategory && !b.parentCategory) || 
        (a.parentCategory && b.parentCategory)) {
      return a.name.localeCompare(b.name);
    }
    // Parent categories come before subcategories
    return a.parentCategory ? 1 : -1;
  });
  
  // Get parent categories
  const parentCategories = sortedCategories.filter(cat => !cat.parentCategory);
  
  // Group subcategories by parent
  const subcategoriesByParent = sortedCategories.reduce((acc, category) => {
    if (category.parentCategory) {
      if (!acc[category.parentCategory]) {
        acc[category.parentCategory] = [];
      }
      acc[category.parentCategory].push(category);
    }
    return acc;
  }, {} as Record<string, Category[]>);
  
  // Function to get icon for a category
  const getCategoryIcon = (category: Category) => {
    // Comprehensive emoji map for all categories
    const categoryEmojis: Record<string, string> = {
      // Main categories
      'electronics': '📱',
      'apparel': '👕',
      'home-kitchen': '🏠',
      'beauty-personal-care': '💄',
      'sports-outdoors': '⚽',
      'automotive': '🚗',
      'books': '📚',
      'movies': '🎬',
      'tv-shows': '📺',
      'video-games': '🎮',
      'tech-apps': '💻',
      'companies': '🏢',
      'food-restaurants': '🍔',
      
      // Add aliases for possible variations
      'food-beverage': '🍔',
      'food': '🍔',
      'health-wellness': '💊',
      'health': '💊',
      'books-media': '📚',
      'media': '📚',
      'toys-games': '🧸',
      'toys': '🧸'
    };
    
    // Use the emoji icon directly from the category data
    if (category.icon && category.icon !== '🔍') {
      // If it's a custom emoji already set in the database
      return <span className="text-3xl">{category.icon}</span>;
    } else if (categoryEmojis[category.id]) {
      // If we have a predefined emoji for this category
      return <span className="text-3xl">{categoryEmojis[category.id]}</span>;
    } else {
      // Log missing icon for debugging
      console.log(`No icon found for category: ${category.id}`);
      // Default icon for unknown categories
      return <span className="text-3xl">⭐</span>;
    }
  };
  
  // Toggle expanded category
  const toggleExpanded = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {parentCategories.map((category) => {
        const hasSubcategories = subcategoriesByParent[category.id]?.length > 0 || 
                                 category.subcategories?.length > 0;
        
        return (
          <div key={category.id} className="group">
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700">
              {/* Category Card */}
              <Link href={`/category/${category.slug}`} className="block">
                {/* Image/Placeholder */}
                <div className="h-36 bg-gray-100 dark:bg-gray-700 relative">
                  {category.imageUrl ? (
                    <Image 
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                      <div className="h-16 w-16 rounded-full flex items-center justify-center bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                        {getCategoryIcon(category)}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </Link>
              
              {/* Subcategories toggle */}
              {hasSubcategories && (
                <div className="px-4 pb-3 pt-0">
                  <div 
                    className="flex items-center justify-between text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                    onClick={() => toggleExpanded(category.id)}
                  >
                    <span>
                      {expandedCategory === category.id ? 'Hide subcategories' : 'Show subcategories'}
                    </span>
                    <ChevronRight 
                      size={16} 
                      className={`transition-transform ${expandedCategory === category.id ? 'rotate-90' : ''}`} 
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Subcategories list (shown when expanded) */}
            {expandedCategory === category.id && hasSubcategories && (
              <div className="mt-2 bg-gray-50 dark:bg-gray-750 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                <ul className="space-y-1.5">
                  {subcategoriesByParent[category.id]?.map((subcategory) => (
                    <li key={subcategory.id}>
                      <Link 
                        href={`/category/${category.slug}?subcategory=${subcategory.id}`}
                        className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm"
                      >
                        <ChevronRight size={14} className="mr-1.5 text-gray-400" />
                        {subcategory.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}