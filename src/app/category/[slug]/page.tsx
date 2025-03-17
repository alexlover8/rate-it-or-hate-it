// Server Component - no 'use client' directive
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import CategoryItemsList from './CategoryItemsList';
import { getCategories, getCategoryBySlug, getItemsByCategory } from '@/lib/data';

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
    slug: category.slug,
  }));
}

// Server component to fetch data and render the page
export default async function CategoryPage({ params }: Props) {
  const { slug } = params;
  
  // Get data during build time
  const category = await getCategoryBySlug(slug);
  const items = await getItemsByCategory(slug);
  
  // Handle case where category doesn't exist
  if (!category) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">Category not found</h1>
        <p>The category you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">{category.name}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">{category.description}</p>
      
      {/* Wrap client component in Suspense for streaming */}
      <Suspense fallback={
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse h-72 rounded-lg"></div>
          ))}
        </div>
      }>
        <CategoryItemsList 
          initialItems={items} 
          categorySlug={slug} 
          categoryName={category.name}
        />
      </Suspense>
    </div>
  );
}import { capitalize } from 'lodash';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import CategoryItemsList from './CategoryItemsList';

// Define type for individual item
type Item = {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
};

// Define a type for the items object with index signature
type CategoryItems = {
  [key: string]: Item[];
};

// Mock data that would come from your database or API
const items: CategoryItems = {
  electronics: [
    { 
      id: 1, 
      name: 'Smartphone', 
      description: 'Latest model with high-res camera.',
      imageUrl: '/images/smartphone.jpg'
    },
    { 
      id: 2, 
      name: 'Laptop', 
      description: 'Powerful machine for work and play.',
      imageUrl: '/images/laptop.jpg'
    },
    { 
      id: 5, 
      name: 'Smart Watch', 
      description: 'Track your fitness and stay connected.',
      imageUrl: '/images/smartwatch.jpg'
    },
  ],
  books: [
    { 
      id: 3, 
      name: 'Novel', 
      description: 'A gripping tale of adventure.',
      imageUrl: '/images/novel.jpg'
    },
    { 
      id: 4, 
      name: 'Biography', 
      description: 'The life story of a famous figure.',
      imageUrl: '/images/biography.jpg'
    },
  ],
  companies: [
    { 
      id: 6, 
      name: 'Tech Giant', 
      description: 'Leading innovation in technology.',
      imageUrl: '/images/techcompany.jpg'
    },
    { 
      id: 7, 
      name: 'Retail Chain', 
      description: 'Your one-stop shop for everything.',
      imageUrl: '/images/retail.jpg'
    },
  ],
};

// Required for static export - tells Next.js which slugs to generate at build time
export async function generateStaticParams() {
  // Return all category slugs that should be pre-rendered
  return Object.keys(items).map(slug => ({
    slug,
  }));
}

// Mock function to simulate fetching items by category slug
async function getItemsByCategory(slug: string): Promise<Item[]> {
  // This would be replaced with a real API call or database query
  return items[slug] || []; // Return items for the slug, or an empty array if none exist
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const items = await getItemsByCategory(slug);
  const categoryName = capitalize(slug);

  // Handle case where category doesn't exist
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Category Not Found</h1>
        <p className="mb-4">Sorry, we couldn&apos;t find any items in the &quot;{slug}&quot; category.</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to home page
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{categoryName}</h1>
      
      <Suspense fallback={
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          <span className="ml-2 text-gray-600">Loading items...</span>
        </div>
      }>
        <CategoryItemsList items={items} />
      </Suspense>
    </div>
  );
}