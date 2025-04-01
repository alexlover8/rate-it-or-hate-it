// src/app/category/page.tsx
import { Metadata } from 'next';
import { getCategories } from '@/lib/server-data';
import CategoriesGrid from './CategoriesGrid';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Browse Categories | Rate It or Hate It',
  description: 'Explore all categories on Rate It or Hate It and discover items to rate or hate in your favorite categories.',
};

export default async function CategoryPage() {
  try {
    // Fetch all categories
    const categories = await getCategories();
    
    // Console log for debugging
    console.log(`CategoryPage: Loaded ${categories.length} categories`);
    
    return (
      <div className="container mx-auto py-10 px-4">
        {/* Hero section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 rounded-xl overflow-hidden mb-10 shadow-lg relative">
          <div className="bg-black/20 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto py-12 px-6 md:px-10 relative z-10">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Browse Categories
              </h1>
              <p className="text-white/90 text-lg max-w-2xl mb-6">
                Explore our diverse collection of categories and find items that interest you. Rate what you love and hate what you don't!
              </p>
            </div>
          </div>
          
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-pink-500/40 blur-3xl"></div>
            <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-indigo-500/40 blur-3xl"></div>
            <div className="absolute left-1/3 top-1/4 w-64 h-64 rounded-full bg-purple-500/40 blur-3xl"></div>
          </div>
        </div>
        
        {/* Categories grid */}
        <CategoriesGrid categories={categories} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    
    // Fallback UI in case of error
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Categories</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">Temporarily Unavailable</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We're having trouble loading the categories. Please try again later.
          </p>
          <Link 
            href="/" 
            className="inline-block px-5 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-sm"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
}