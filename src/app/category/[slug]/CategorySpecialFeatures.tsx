// src/app/category/[slug]/CategorySpecialFeatures.tsx
'use client';

import React from 'react';
import { Category } from '@/lib/data';
import { Info, BarChart2, FileText, CheckSquare, RefreshCcw, Clock } from 'lucide-react';

interface CategorySpecialFeaturesProps {
  category: Category;
  features: string[];
}

// Component that renders the category-specific features
export default function CategorySpecialFeatures({ category, features }: CategorySpecialFeaturesProps) {
  if (!features || features.length === 0) {
    return null;
  }
  
  // Get styling from category
  const style = category.style || { primaryColor: '#4a5568' };
  
  // Feature definitions (contained within the component)
  const featureDefinitions = {
    specComparison: {
      id: 'specComparison',
      name: 'Spec Comparison',
      description: 'Compare technical specifications across similar items',
      icon: <CheckSquare size={20} />
    },
    priceTracker: {
      id: 'priceTracker',
      name: 'Price Tracker',
      description: 'Track price changes over time',
      icon: <BarChart2 size={20} />
    },
    nutritionInfo: {
      id: 'nutritionInfo',
      name: 'Nutrition Info',
      description: 'View detailed nutritional information',
      icon: <FileText size={20} />
    },
    reviewAggregator: {
      id: 'reviewAggregator',
      name: 'Review Aggregator',
      description: 'See reviews from across the web',
      icon: <RefreshCcw size={20} />
    },
    styleGallery: {
      id: 'styleGallery',
      name: 'Style Gallery',
      description: 'Browse user-submitted styling photos',
      icon: <Info size={20} />
    },
    seasonalTrends: {
      id: 'seasonalTrends',
      name: 'Seasonal Trends',
      description: 'View trending items by season',
      icon: <Clock size={20} />
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap gap-3">
          {features.map(featureId => {
            const feature = featureDefinitions[featureId as keyof typeof featureDefinitions];
            if (!feature) return null;
            
            return (
              <button
                key={feature.id}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm transition-colors"
                style={{ 
                  backgroundColor: `${style.primaryColor}20`,
                  color: style.primaryColor
                }}
                title={feature.description}
              >
                {feature.icon}
                <span className="ml-2">{feature.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}