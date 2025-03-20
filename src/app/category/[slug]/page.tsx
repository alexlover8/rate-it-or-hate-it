// Server Component - no 'use client' directive
import React from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import CategoryItemsList from './CategoryItemsList';
import { getCategories, getCategoryById, getItemsByCategory } from '@/lib/server-data';

// Define the props type
type Props = {
  params: {
    slug: string;
  };
};

// This function generates all possible category routes at build time
export async function generateStaticParams() {
  // Get all categories that should be pre-rendered
  const categories = await getCategories();
  
  return categories.map((category) => ({
    slug: category.id,
  }));
}

// Server component to fetch data and render the page
export default async function CategoryPage({ params }: Props) {
  const { slug } = params;
  
  // Get data during build time - slug is the categoryId in our case
  const category = await getCategoryById(slug);
  const { items } = await getItemsByCategory(slug);
  
  // Handle case where category doesn't exist
  if (!category) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-2xl font-bold mb-4">Category not found</h1>
        <p className="mb-4">The category you're looking for doesn't exist.</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to home page
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{category.name}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">{category.description}</p>
      
      {/* Wrap client component in React.Suspense for streaming */}
      <React.Suspense fallback={
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse h-72 rounded-lg"></div>
          ))}
        </div>
      }>
        <CategoryItemsList 
          initialItems={items} 
          categoryId={slug} 
          categoryName={category.name}
        />
      </React.Suspense>
    </div>
  );
}