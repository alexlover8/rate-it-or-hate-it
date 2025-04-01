// src/app/category/[slug]/SubcategoriesList.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Category } from '@/lib/data';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SubcategoriesListProps {
  category: Category;
  activeSubcategory?: string;
  subcategories?: Category[];
}

export default function SubcategoriesList({ 
  category, 
  activeSubcategory,
  subcategories = [] 
}: SubcategoriesListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'newest';
  const currentFilter = searchParams.get('filter') || 'all';
  const currentLayout = searchParams.get('layout') || '';
  
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Function to preserve existing query params when navigating
  const createQueryString = (subcategoryId?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (subcategoryId) {
      params.set('subcategory', subcategoryId);
    } else {
      params.delete('subcategory');
    }
    
    return params.toString();
  };
  
  // Get primary color from category style or use default
  const primaryColor = category.style?.primaryColor || '#4a5568';
  
  // If no subcategories exist, don't render the component
  if (subcategories.length === 0 && !category.subcategories?.length) {
    return null;
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-16 z-20 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="py-3 flex items-center overflow-x-auto scrollbar-hide">
            {/* "All" option that shows all items in this category */}
            <Link
              href={`${pathname}?${createQueryString()}`}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm mr-2 ${
                !activeSubcategory
                  ? `bg-opacity-10 dark:bg-opacity-20 font-medium`
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              style={{
                backgroundColor: !activeSubcategory 
                  ? `${primaryColor}20` // 20% opacity using hex
                  : '',
                color: !activeSubcategory ? primaryColor : ''
              }}
            >
              All {category.name}
            </Link>
            
            {/* Only show subcategories when expanded */}
            {isExpanded && (
              <>
                {/* Render subcategories from prop or category object */}
                {subcategories.length > 0 
                  ? subcategories.map((subcategory) => (
                      <Link
                        key={subcategory.id}
                        href={`${pathname}?${createQueryString(subcategory.id)}`}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm mr-2 ${
                          activeSubcategory === subcategory.id
                            ? `bg-opacity-10 dark:bg-opacity-20 font-medium`
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        style={{
                          backgroundColor: activeSubcategory === subcategory.id 
                            ? `${primaryColor}20` // 20% opacity using hex
                            : '',
                          color: activeSubcategory === subcategory.id ? primaryColor : ''
                        }}
                      >
                        {subcategory.name}
                      </Link>
                    ))
                  : category.subcategories?.map((subcategoryId) => (
                      <Link
                        key={subcategoryId}
                        href={`${pathname}?${createQueryString(subcategoryId)}`}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm mr-2 ${
                          activeSubcategory === subcategoryId
                            ? `bg-opacity-10 dark:bg-opacity-20 font-medium`
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        style={{
                          backgroundColor: activeSubcategory === subcategoryId 
                            ? `${primaryColor}20` // 20% opacity using hex
                            : '',
                          color: activeSubcategory === subcategoryId ? primaryColor : ''
                        }}
                      >
                        {subcategoryId}
                      </Link>
                    ))
                }
              </>
            )}
          </div>
          
          {/* Toggle button for mobile */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            {isExpanded ? (
              <ChevronUp size={20} />
            ) : (
              <ChevronDown size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}