'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Search, User, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';

// Categories organized by sections for dropdown menus
const categoryGroups = [
  {
    name: 'Products',
    categories: [
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Books', slug: 'books' },
      { name: 'Cars', slug: 'cars' },
      { name: 'Food & Restaurants', slug: 'food-restaurants' },
      { name: 'Tech & Apps', slug: 'tech-apps' },
      { name: 'Video Games', slug: 'video-games' },
    ]
  },
  {
    name: 'Entertainment',
    categories: [
      { name: 'Movies', slug: 'movies' },
      { name: 'TV Shows', slug: 'tv-shows' },
      { name: 'Celebrities', slug: 'celebrities' },
      { name: 'Sports', slug: 'sports-teams' },
    ]
  },
  {
    name: 'Business',
    categories: [
      { name: 'Companies', slug: 'companies' },
      { name: 'Brands', slug: 'brands' },
      { name: 'Services', slug: 'services' },
    ]
  },
  {
    name: 'Trends',
    categories: [
      { name: 'Social Issues', slug: 'social-issues' },
      { name: 'Current Events', slug: 'current-events' },
      { name: 'Viral Content', slug: 'viral' },
    ]
  }
];

// Popular categories for quick access
const popularCategories = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Movies', slug: 'movies' },
  { name: 'Companies', slug: 'companies' },
  { name: 'Trending', slug: 'trending' },
];

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  
  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);
  
  // Toggle dropdown menu
  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white bg-opacity-95 shadow-md' 
          : 'bg-white border-b border-gray-200'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Heart className="h-8 w-8 text-red-500 mr-2" />
            <span className="text-xl font-bold text-gray-800 hidden sm:inline">
              Rate It <span className="text-red-500">or</span> Hate It
            </span>
            <span className="text-xl font-bold text-gray-800 sm:hidden">
              RI<span className="text-red-500">o</span>HI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {/* Popular Categories */}
            {popularCategories.map((category) => (
              <Link 
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === `/category/${category.slug}`
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </Link>
            ))}
            
            {/* Category Dropdowns */}
            {categoryGroups.map((group) => (
              <div key={group.name} className="relative group">
                <button 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 flex items-center"
                  aria-expanded={openDropdown === group.name}
                  onClick={() => toggleDropdown(group.name)}
                >
                  {group.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
                {/* Desktop Dropdown */}
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block">
                  {group.categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            
            {/* All Categories Link */}
            <Link
              href="/categories"
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
            >
              All Categories
            </Link>
          </nav>

          {/* Right Navigation Items */}
          <div className="flex items-center">
            {/* Search Button */}
            <Link
              href="/search"
              className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
            
            {/* Profile/Login Button */}
            <Link
              href="/profile"
              className="ml-2 p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Link>
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="ml-2 lg:hidden p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {/* Popular categories */}
            {popularCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === `/category/${category.slug}`
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </Link>
            ))}
            
            {/* Category groups with accordions */}
            {categoryGroups.map((group) => (
              <div key={group.name} className="py-1">
                <button
                  className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                  onClick={() => toggleDropdown(group.name)}
                  aria-expanded={openDropdown === group.name}
                >
                  <span>{group.name}</span>
                  {openDropdown === group.name ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                
                {openDropdown === group.name && (
                  <div className="pl-4 pr-2 py-2 space-y-1 bg-gray-50 rounded-md mt-1">
                    {group.categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        className="block px-3 py-2 rounded-md text-base text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* All Categories Link */}
            <Link
              href="/categories"
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
            >
              View All Categories
            </Link>
            
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">Sign In</div>
                  <div className="text-sm font-medium text-gray-500">Or create an account</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}