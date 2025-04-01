// src/app/category/[slug]/CategoryHeader.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Category } from '@/lib/data';
import { Plus, Star, ArrowRight } from 'lucide-react';

interface CategoryHeaderProps {
  category: Category;
}

export default function CategoryHeader({ category }: CategoryHeaderProps) {
  // Use state to track dark mode based on document class
  const [isDark, setIsDark] = useState(false);
  
  // Detect dark mode class on document
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeEnabled = 
        document.documentElement.classList.contains('dark') || 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(darkModeEnabled);
    };
    
    // Check on initial load
    checkDarkMode();
    
    // Set up a MutationObserver to detect class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Clean up
    return () => observer.disconnect();
  }, []);
  
  // Get category-specific theme
  const getCategoryTheme = (categoryId: string) => {
    // Updated themes with better contrast
    const categoryThemes: Record<string, any> = {
      'electronics': {
        primaryColor: '#0070f3',
        secondaryColor: '#000033',
        gradient: 'linear-gradient(135deg, #0070f3, #000033)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'apparel': {
        primaryColor: '#e84393',
        secondaryColor: '#4a1033',
        gradient: 'linear-gradient(135deg, #e84393, #4a1033)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'home-kitchen': {
        primaryColor: '#00b894',
        secondaryColor: '#004433',
        gradient: 'linear-gradient(135deg, #00b894, #004433)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'beauty-personal-care': {
        primaryColor: '#fd79a8',
        secondaryColor: '#6c2436',
        gradient: 'linear-gradient(135deg, #fd79a8, #6c2436)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'sports-outdoors': {
        primaryColor: '#fdcb6e',
        secondaryColor: '#593d05',
        gradient: 'linear-gradient(135deg, #fdcb6e, #593d05)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'automotive': {
        primaryColor: '#636e72',
        secondaryColor: '#1e272e',
        gradient: 'linear-gradient(135deg, #636e72, #1e272e)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'books': {
        primaryColor: '#6c5ce7',
        secondaryColor: '#2c1a72',
        gradient: 'linear-gradient(135deg, #6c5ce7, #2c1a72)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'movies': {
        primaryColor: '#e17055',
        secondaryColor: '#6d1f0b',
        gradient: 'linear-gradient(135deg, #e17055, #6d1f0b)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'tv-shows': {
        primaryColor: '#00cec9',
        secondaryColor: '#00676e',
        gradient: 'linear-gradient(135deg, #00cec9, #00676e)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'video-games': {
        primaryColor: '#a29bfe',
        secondaryColor: '#382580',
        gradient: 'linear-gradient(135deg, #a29bfe, #382580)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'tech-apps': {
        primaryColor: '#74b9ff',
        secondaryColor: '#1c4966',
        gradient: 'linear-gradient(135deg, #74b9ff, #1c4966)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'companies': {
        primaryColor: '#5352ed',
        secondaryColor: '#2e2970',
        gradient: 'linear-gradient(135deg, #5352ed, #2e2970)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      },
      'food-restaurants': {
        primaryColor: '#ff7675',
        secondaryColor: '#8c2c2c',
        gradient: 'linear-gradient(135deg, #ff7675, #8c2c2c)',
        headerStyle: 'featured',
        textColor: '#ffffff'
      }
    };
      
    return categoryThemes[categoryId] || {
      primaryColor: '#4a5568',
      secondaryColor: '#2d3748',
      gradient: 'linear-gradient(135deg, #4a5568, #2d3748)',
      headerStyle: 'default',
      textColor: '#ffffff'
    };
  };
  
  // Get the theme for this category
  const theme = getCategoryTheme(category.id);
  
  // Use category style from DB or default values from our theme
  const style = category.style || {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    headerStyle: theme.headerStyle
  };
  
  // CSS variables for styling
  const headerStyles: React.CSSProperties = {
    '--primary-color': style.primaryColor,
    '--secondary-color': style.secondaryColor || '#f7fafc',
    color: theme.textColor || '#ffffff'
  } as React.CSSProperties;
  
  // Get background style based on header style
  const getHeaderBackground = () => {
    // If category has a banner image, use that
    if (style.bannerImage) {
      return {
        backgroundImage: `url(${style.bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    
    // Use category-specific gradient with a texture overlay
    return {
      background: theme.gradient || `linear-gradient(135deg, ${style.primaryColor}, ${style.secondaryColor || '#ffffff'})`,
      position: 'relative'
    };
  };
  
  // Determine header class based on header style
  const getHeaderClass = () => {
    switch (style.headerStyle) {
      case 'overlay':
        return 'relative pt-16 pb-10 px-4 text-white';
      case 'minimal':
        return 'pt-8 pb-4 px-4';
      case 'featured':
        return 'relative pt-20 pb-16 px-4 text-white';
      default:
        return 'relative pt-12 pb-8 px-4';
    }
  };

  // Function to get icon for a category
  const getCategoryIcon = () => {
    // Map of emoji icons for each category
    const categoryEmojis: Record<string, string> = {
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
    };
    
    // Return the mapped emoji or a custom icon if specified in category data
    if (category.icon && category.icon !== '🔍') {
      // If it's a custom emoji already set in the database
      return <span className="text-2xl">{category.icon}</span>;
    } else if (categoryEmojis[category.id]) {
      // If we have a predefined emoji for this category
      return <span className="text-2xl">{categoryEmojis[category.id]}</span>;
    } else {
      // Default icon for unknown categories
      return <span className="text-2xl">⭐</span>;
    }
  };

  return (
    <div 
      className={`w-full ${getHeaderClass()}`}
      style={{
        ...headerStyles,
        ...getHeaderBackground()
      }}
    >
      {/* Enhanced overlay with subtle pattern for better text visibility */}
      <div className="absolute inset-0 bg-black/40" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M0 0h20v20H0z" fill="%23ffffff" fill-opacity="0.05"/%3E%3C/svg%3E")',
        backgroundSize: '20px 20px'
      }} />
      
      <div className="container mx-auto relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* Category icon and name */}
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-14 h-14 flex items-center justify-center rounded-lg shadow-md"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                {getCategoryIcon()}
              </div>
              <h1 className="text-3xl font-bold text-white drop-shadow-sm">
                {category.name}
              </h1>
            </div>
            
            {/* Category stats */}
            <div className="flex items-center gap-4 text-sm text-white/90 mb-4 font-medium">
              <div className="bg-white/10 px-3 py-1 rounded-full">{category.itemCount || 0} items</div>
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="bg-white/10 px-3 py-1 rounded-full">{category.subcategories.length} subcategories</div>
              )}
            </div>
            
            {/* Category description */}
            <p className="max-w-3xl text-lg text-white/90 drop-shadow-sm">
              {category.description}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <Link 
              href={`/add-item?category=${category.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-900 hover:bg-opacity-90 transition-colors shadow-md"
            >
              <Plus size={18} />
              <span>Add Item</span>
            </Link>
            
            <button 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-md"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Star size={18} />
              <span>Follow</span>
            </button>
          </div>
        </div>
        
        {/* Featured items section for 'featured' header style */}
        {style.headerStyle === 'featured' && category.featuredItems && category.featuredItems.length > 0 && (
          <div className="mt-8 pt-8 border-t border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Featured Items</h2>
              <Link 
                href="#all-items" 
                className="inline-flex items-center text-sm text-white hover:underline"
              >
                <span>View all</span>
                <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Featured items would be rendered here */}
              <div className="h-24 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-24 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-24 bg-white/10 rounded-lg animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}