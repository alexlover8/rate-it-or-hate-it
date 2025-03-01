'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Search, User, Menu, X, ChevronDown, ChevronUp, LogIn, PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';

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
  const { user, logOut } = useAuth();
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Check auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setIsUserLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check for dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDarkMode(document.documentElement.classList.contains('dark'));
      
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            setDarkMode(document.documentElement.classList.contains('dark'));
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (typeof window !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      }
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      if (logOut) {
        await logOut();
      } else {
        await firebaseSignOut(auth);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('[data-menu]') && !target.closest('[data-menu-button]')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 shadow-md' 
          : 'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Heart className="h-8 w-8 text-red-500 mr-2" />
            <span className="text-xl font-bold text-gray-800 dark:text-white hidden sm:inline">
              Rate It <span className="text-red-500">or</span> Hate It
            </span>
            <span className="text-xl font-bold text-gray-800 dark:text-white sm:hidden">
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
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {category.name}
              </Link>
            ))}
            
            {/* Category Dropdowns */}
            {categoryGroups.map((group) => (
              <div key={group.name} className="relative group">
                <button 
                  type="button"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center"
                  aria-expanded={openDropdown === group.name}
                  onClick={() => toggleDropdown(group.name)}
                >
                  {group.name}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
                {/* Desktop Dropdown */}
                <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block border border-gray-200 dark:border-gray-700 z-50">
                  {group.categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/category/${category.slug}`}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
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
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              All Categories
            </Link>

            {/* Submit Item Button */}
            <Link 
              href="/add-item"
              className="ml-2 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Submit Item
            </Link>
          </nav>

          {/* Right Navigation Items */}
          <div className="flex items-center space-x-1">
            {/* Search Button */}
            <Link
              href="/search"
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>
            
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            
            {/* Profile/Login Button */}
            {!isUserLoading && (
              user ? (
                <div className="relative ml-2">
                  <button
                    type="button"
                    data-menu-button
                    className="flex items-center focus:outline-none"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-expanded={isMenuOpen}
                    aria-label="User Menu"
                  >
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full object-cover border-2 border-white dark:border-gray-700"
                      />
                    ) : (
                      <div className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <User className="h-5 w-5" />
                      </div>
                    )}
                  </button>
                  
                  {/* Profile dropdown menu */}
                  {isMenuOpen && (
                    <div 
                      data-menu
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayName || "User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/profile/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="ml-2 flex items-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign In
                </Link>
              )
            )}
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="ml-2 lg:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
              data-menu-button
            >
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
        <div className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700" data-menu>
          <div className="container mx-auto px-4 py-3 space-y-1">
            {/* Popular categories */}
            {popularCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === `/category/${category.slug}`
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {category.name}
              </Link>
            ))}
            
            {/* Category groups with accordions */}
            {categoryGroups.map((group) => (
              <div key={group.name} className="py-1">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md"
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
                  <div className="pl-4 pr-2 py-2 space-y-1 bg-gray-50 dark:bg-gray-700 rounded-md mt-1">
                    {group.categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        className="block px-3 py-2 rounded-md text-base text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Submit Item Link */}
            <Link 
              href="/add-item"
              className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Submit Item
            </Link>
            
            {/* All Categories Link */}
            <Link
              href="/categories"
              className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              View All Categories
            </Link>
            
            {/* User section */}
            <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
              {!isUserLoading && (
                user ? (
                  <>
                    <div className="flex items-center px-3">
                      <div className="flex-shrink-0">
                        {user.photoURL ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.photoURL}
                            alt={user.displayName || "User profile"}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800 dark:text-white">
                          {user.displayName || "User"}
                        </div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Link
                        href="/profile"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/profile/settings"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center px-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800 dark:text-white">Sign In</div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Or create an account</div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Link
                        href="/login"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Create Account
                      </Link>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}