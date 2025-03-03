'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

// Define type for individual item
type Item = {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
};

type CategoryItemsListProps = {
  items: Item[];
};

export default function CategoryItemsList({ items }: CategoryItemsListProps) {
  // Optional: Add client-side state or effects if needed
  const [ratingPercentages, setRatingPercentages] = useState<Record<number, number>>({});
  
  // Generate random rating percentages on mount
  useEffect(() => {
    const percentages = items.reduce((acc, item) => {
      acc[item.id] = Math.floor(Math.random() * 100);
      return acc;
    }, {} as Record<number, number>);
    
    setRatingPercentages(percentages);
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Link href={`/item/${item.id}`} key={item.id} className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
            {item.imageUrl ? (
              <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                <Image 
                  src={item.imageUrl} 
                  alt={item.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-400 dark:text-gray-500">No image available</span>
              </div>
            )}
            
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{item.name}</h2>
              <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="bg-gray-100 dark:bg-gray-700 h-2 rounded-full flex-grow mr-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${ratingPercentages[item.id] || 50}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Rate It</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}