// Server Component - no 'use client' directive
import React from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import CategoryItemsList from './CategoryItemsList';
import { getCategories, getCategoryById, getItemsByCategory } from '@/lib/server-data';
import CategoryHeader from './CategoryHeader';
import SubcategoriesList from './SubcategoriesList';
import CategorySpecialFeatures from './CategorySpecialFeatures';
// Import the subcategories directly
import { subcategories } from '@/lib/subcategories';

// Define the props type
type Props = {
  params: {
    slug: string;
  };
  searchParams?: {
    subcategory?: string;
    page?: string;
    sort?: string;
    filter?: string;
    layout?: string;
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

// Generate page metadata
export async function generateMetadata({ params }: Props) {
  const { slug } = params;
  const category = await getCategoryById(slug);
  
  if (!category) {
    return {
      title: 'Category not found',
      description: 'The category you\'re looking for doesn\'t exist.'
    };
  }
  
  return {
    title: `${category.name} | Rate It or Hate It`,
    description: category.description,
    openGraph: {
      images: category.imageUrl ? [category.imageUrl] : []
    }
  };
}

// Server component to fetch data and render the page
export default async function CategoryPage({ params, searchParams = {} }: Props) {
  const { slug } = params;
  const { 
    subcategory, 
    page = '1', 
    sort = 'newest',
    filter = 'all',
    layout
  } = searchParams;
  
  // Get category data
  const category = await getCategoryById(slug);
  
  // Get subcategories directly from the imported subcategories array
  const subcategoriesData = category 
    ? subcategories
        .filter(sub => sub.parentCategory === slug)
        .map(sub => ({
          id: sub.id,
          name: sub.name,
          slug: sub.id,
          parentCategory: sub.parentCategory,
          description: `${sub.name} - a subcategory of ${category.name}`,
          icon: '🔍'
        }))
    : [];
  
  console.log(`Found ${subcategoriesData.length} subcategories for ${slug}:`, 
    subcategoriesData.map(s => s.name));
  
  // Get items based on the selected subcategory or category
  let items = [];
  if (subcategory) {
    // If a subcategory is selected, get items for that subcategory
    const { items: subcategoryItems } = await getItemsByCategory(subcategory);
    items = subcategoryItems;
  } else {
    // Otherwise, get items for the main category
    const { items: categoryItems } = await getItemsByCategory(slug);
    items = categoryItems;
  }
  
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

  // Determine the active layout (from URL parameter, category default, or global default)
  const activeLayout = layout || category.defaultLayout || 'grid';

  return (
    <div className="min-h-screen">
      {/* Category Header with Custom Styling */}
      <CategoryHeader category={category} />
      
      {/* Subcategories Navigation */}
      {subcategoriesData.length > 0 && (
        <SubcategoriesList 
          category={category} 
          subcategories={subcategoriesData}
          activeSubcategory={subcategory} 
        />
      )}
      
      {/* Category-specific Features */}
      {category.specialFeatures && category.specialFeatures.length > 0 && (
        <CategorySpecialFeatures 
          category={category} 
          features={category.specialFeatures} 
        />
      )}
      
      {/* Items List with client-side pagination, sorting, filtering */}
      <div className="container mx-auto py-6 px-4">
        <React.Suspense fallback={
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 animate-pulse h-72 rounded-lg"></div>
            ))}
          </div>
        }>
          <CategoryItemsList 
            initialItems={items} 
            categoryId={subcategory || slug}
            categoryName={category.name}
            subcategoryId={subcategory}
            initialSort={sort as any}
            initialFilter={filter as any}
            initialLayout={activeLayout as any}
            categoryStyle={category.style}
          />
        </React.Suspense>
      </div>
    </div>
  );
}