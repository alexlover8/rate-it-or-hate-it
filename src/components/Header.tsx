'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, User, Menu, X, ChevronDown, ChevronUp, LogIn, PlusCircle, LogOut, 
  Settings, Home, Sun, Moon, TrendingUp, Clock, Sparkles, Filter
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import { Meh } from 'lucide-react';

// Categories organized by sections for dropdown menus
const categoryGroups = [
  {
    name: 'Products',
    categories: [
      { name: 'Electronics', slug: 'electronics' },
      { name: 'Apparel', slug: 'apparel' },
      { name: 'Home & Kitchen', slug: 'home-kitchen' },
      { name: 'Beauty & Personal Care', slug: 'beauty-personal-care' },
      { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
      { name: 'Automotive', slug: 'automotive' },
    ]
  }
];

// Popular categories for quick access
const popularCategories = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Apparel', slug: 'apparel' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Improved loading state handling
  useEffect(() => {
    if (user !== undefined) {
      setIsUserLoading(false);
    }
  }, [user]);

  // Check for dark mode on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(isDark);
    }
  }, []);

  // Handle scroll events for header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
      setIsProfileMenuOpen(false);
    };

    if (openDropdown || isProfileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown, isProfileMenuOpen]);

  const toggleDropdown = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    setOpenDropdown(prevOpen => prevOpen === name ? null : name);
    // Close other menus
    if (name !== 'profile') setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProfileMenuOpen(!isProfileMenuOpen);
    setOpenDropdown(null);
  };

  const toggleDarkMode = () => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark');
      localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setDarkMode(!darkMode);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsProfileMenuOpen(false);
      await logOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-200 bg-white dark:bg-gray-800 ${
      scrolled ? 'shadow-md' : 'border-b border-gray-200 dark:border-gray-700'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-16 justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl md:text-2xl font-bold flex items-center">
          <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Rate It</span>
          <Meh className="mx-1 text-yellow-500 w-6 h-6" />
          <span className="bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">Hate It</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          <Link 
            href="/" 
            className={`px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              pathname === '/' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : ''
            }`}
          >
            <span className="flex items-center">
              <Home className="w-4 h-4 mr-1.5" />
              Home
            </span>
          </Link>

          <Link 
            href="/trending" 
            className={`px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              pathname === '/trending' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : ''
            }`}
          >
            <span className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Trending
            </span>
          </Link>

          <Link 
            href="/recent" 
            className={`px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              pathname === '/recent' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : ''
            }`}
          >
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1.5" />
              Recent
            </span>
          </Link>

          <Link 
            href="/controversial" 
            className={`px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              pathname === '/controversial' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : ''
            }`}
          >
            <span className="flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Hot Debates
            </span>
          </Link>

          {/* Categories Dropdown */}
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={(e) => toggleDropdown(e, 'categories')}
              className={`px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center ${
                pathname.includes('/category/') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' : ''
              }`}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Categories
              {openDropdown === 'categories' ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </button>
            
            {openDropdown === 'categories' && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
                <div className="p-2">
                  <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-1">
                    Popular Categories
                  </div>
                  {popularCategories.map(category => (
                    <Link 
                      key={category.slug} 
                      href={`/category/${category.slug}`}
                      className={`block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors ${
                        pathname === `/category/${category.slug}` ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                      }`}
                      onClick={closeMenu}
                    >
                      {category.name}
                    </Link>
                  ))}
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  
                  <div className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400 px-3 py-1">
                    All Categories
                  </div>
                  {categoryGroups[0].categories.map(category => (
                    <Link 
                      key={category.slug} 
                      href={`/category/${category.slug}`}
                      className={`block px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors ${
                        pathname === `/category/${category.slug}` ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''
                      }`}
                      onClick={closeMenu}
                    >
                      {category.name}
                    </Link>
                  ))}
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  
                  <Link 
                    href="/category"
                    className="block px-3 py-2 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 font-medium text-center transition-colors"
                    onClick={closeMenu}
                  >
                    View All Categories
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Add Item Button */}
          <Link 
            href="/add-item"
            className="ml-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Add Item
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center">
          {/* Search */}
          <Link 
            href="/search" 
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>
          
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode} 
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ml-1"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* User Menu */}
          {!isUserLoading && (
            <>
              {user ? (
                <div className="relative ml-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={toggleProfileMenu}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex items-center"
                    aria-label="User menu"
                  >
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                      {user.photoURL ? (
                        <Image 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          fill 
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </button>
                  
                  {isProfileMenuOpen && (
                    <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.displayName || 'User'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user.email}
                        </div>
                      </div>
                      <div className="p-2">
                        <Link 
                          href="/profile" 
                          className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <User className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                          My Profile
                        </Link>
                        <Link 
                          href="/add-item" 
                          className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <PlusCircle className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                          Add New Item
                        </Link>
                        <Link 
                          href="/settings" 
                          className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-3 text-gray-500 dark:text-gray-400" />
                          Settings
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="ml-1 flex items-center">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors hidden sm:flex items-center"
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="ml-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors hidden sm:block"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors sm:hidden"
                    aria-label="Sign in"
                  >
                    <LogIn className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ml-1 lg:hidden"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
          <div className="px-4 py-2 space-y-1">
            <Link 
              href="/" 
              className={`block px-3 py-2.5 rounded-lg transition-colors flex items-center ${
                pathname === '/' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={closeMenu}
            >
              <Home className="w-5 h-5 mr-3" />
              Home
            </Link>
            
            <Link 
              href="/trending" 
              className={`block px-3 py-2.5 rounded-lg transition-colors flex items-center ${
                pathname === '/trending' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={closeMenu}
            >
              <TrendingUp className="w-5 h-5 mr-3" />
              Trending
            </Link>
            
            <Link 
              href="/recent" 
              className={`block px-3 py-2.5 rounded-lg transition-colors flex items-center ${
                pathname === '/recent' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={closeMenu}
            >
              <Clock className="w-5 h-5 mr-3" />
              Recent
            </Link>
            
            <Link 
              href="/controversial" 
              className={`block px-3 py-2.5 rounded-lg transition-colors flex items-center ${
                pathname === '/controversial' 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              onClick={closeMenu}
            >
              <Sparkles className="w-5 h-5 mr-3" />
              Hot Debates
            </Link>
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            
            <div className="px-3 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              Popular Categories
            </div>
            
            {popularCategories.map(category => (
              <Link 
                key={category.slug} 
                href={`/category/${category.slug}`}
                className={`block px-3 py-2.5 rounded-lg transition-colors ${
                  pathname === `/category/${category.slug}` 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={closeMenu}
              >
                {category.name}
              </Link>
            ))}
            
            <Link 
              href="/category"
              className="block px-3 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-center mt-2"
              onClick={closeMenu}
            >
              All Categories
            </Link>
            
            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
            
            <Link 
              href="/add-item"
              className="block px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-center flex items-center justify-center"
              onClick={closeMenu}
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add New Item
            </Link>
            
            <Link 
              href="/search"
              className="block px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center"
              onClick={closeMenu}
            >
              <Search className="w-5 h-5 mr-3" />
              Search
            </Link>
            
            {!isUserLoading && !user && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Link 
                  href="/login"
                  className="block px-3 py-2.5 rounded-lg border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors text-center"
                  onClick={closeMenu}
                >
                  Sign In
                </Link>
                <Link 
                  href="/register"
                  className="block px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors text-center"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            {!isUserLoading && user && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                
                <div className="flex items-center px-3 py-2">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 mr-3">
                    {user.photoURL ? (
                      <Image 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {user.displayName || 'User'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                      {user.email}
                    </div>
                  </div>
                </div>
                
                <Link 
                  href="/profile"
                  className="block px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center"
                  onClick={closeMenu}
                >
                  <User className="w-5 h-5 mr-3" />
                  My Profile
                </Link>
                
                <Link 
                  href="/settings"
                  className="block px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center"
                  onClick={closeMenu}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Settings
                </Link>
                
                <button 
                  onClick={handleSignOut}
                  className="w-full px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors flex items-center mt-2"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}