'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, ArrowRight } from 'lucide-react';

type SearchResult = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
};

// Mock search results for demo purposes
// In production, this would be replaced with an API call
const mockSearchResults: SearchResult[] = [
  { id: '1', name: 'iPhone 14 Pro', category: 'electronics', imageUrl: '/images/iphone.jpg' },
  { id: '2', name: 'Samsung Galaxy S22', category: 'electronics', imageUrl: '/images/samsung.jpg' },
  { id: '3', name: 'The Great Gatsby', category: 'books', imageUrl: '/images/gatsby.jpg' },
  { id: '4', name: 'Apple Inc.', category: 'companies', imageUrl: '/images/apple.jpg' },
  { id: '5', name: 'Tesla Model 3', category: 'cars', imageUrl: '/images/tesla.jpg' },
  { id: '6', name: 'Netflix', category: 'companies', imageUrl: '/images/netflix.jpg' },
  { id: '7', name: 'PlayStation 5', category: 'electronics', imageUrl: '/images/ps5.jpg' },
  { id: '8', name: 'Stranger Things', category: 'tv-shows', imageUrl: '/images/stranger.jpg' },
];

// Popular search terms
const popularSearches = [
  'iPhone',
  'Netflix',
  'Tesla',
  'PlayStation',
  'Amazon',
  'Game of Thrones',
];

type SearchBarProps = {
  placeholder?: string;
  variant?: 'default' | 'hero' | 'compact';
  maxResults?: number;
  onSearch?: (query: string) => void;
};

export default function SearchBar({
  placeholder = 'Search for products, companies...',
  variant = 'default',
  maxResults = 5,
  onSearch,
}: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset search when route changes
  useEffect(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  }, [pathname]);

  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.length > 1) {
      performSearch(newQuery);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  // Simulated search function
  // In production, replace with actual API call
  const performSearch = (searchQuery: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const filteredResults = mockSearchResults
        .filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, maxResults);
      
      setResults(filteredResults);
      setShowResults(true);
      setIsLoading(false);
    }, 300);
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (query.trim()) {
      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      
      // Call onSearch callback if provided
      if (onSearch) {
        onSearch(query.trim());
      }
      
      setShowResults(false);
    }
  };

  // Handle selecting a search result
  const handleSelectResult = (result: SearchResult) => {
    router.push(`/item/${result.id}`);
    setShowResults(false);
  };

  // Handle popular search click
  const handlePopularSearch = (term: string) => {
    setQuery(term);
    performSearch(term);
  };

  // Define classes based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'hero':
        return {
          container: 'w-full max-w-2xl mx-auto',
          input: 'w-full py-3 pl-12 pr-12 text-lg rounded-full shadow-lg',
          icon: 'h-6 w-6 left-4',
          clearButton: 'right-12',
          searchButton: 'block',
        };
      case 'compact':
        return {
          container: 'w-full max-w-xs',
          input: 'w-full py-1.5 pl-8 pr-8 text-sm rounded-md',
          icon: 'h-4 w-4 left-2.5',
          clearButton: 'right-8',
          searchButton: 'hidden',
        };
      default:
        return {
          container: 'w-full max-w-md',
          input: 'w-full py-2 pl-10 pr-10 rounded-lg',
          icon: 'h-5 w-5 left-3',
          clearButton: 'right-10',
          searchButton: 'block',
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <div className={`relative ${variantClasses.container}`} ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Search icon */}
        <Search 
          className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${variantClasses.icon}`} 
        />
        
        {/* Search input */}
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleSearchInput}
          onFocus={() => query.length > 1 && setShowResults(true)}
          className={`
            ${variantClasses.input}
            bg-white border border-gray-300 text-gray-900 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-shadow
          `}
          aria-label="Search"
        />
        
        {/* Clear button */}
        {query && (
          <button 
            type="button"
            onClick={clearSearch}
            className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${variantClasses.clearButton}`}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {/* Search button (for hero and default variants) */}
        <button 
          type="submit"
          className={`
            ${variantClasses.searchButton}
            absolute right-1 top-1/2 transform -translate-y-1/2
            bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors
          `}
          aria-label="Submit search"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {/* Search results dropdown */}
      {showResults && (
        <div className="absolute mt-2 w-full bg-white rounded-md shadow-lg z-10 overflow-hidden border border-gray-200">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block h-5 w-5 border-2 border-current border-t-transparent rounded-full mr-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto">
              {results.map((result) => (
                <li 
                  key={result.id}
                  className="border-b border-gray-100 last:border-none hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectResult(result)}
                >
                  <div className="flex items-center p-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-md flex-shrink-0 mr-3">
                      {/* Image would be loaded here in production */}
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium">{result.name}</p>
                      <p className="text-gray-500 text-xs">in {result.category}</p>
                    </div>
                  </div>
                </li>
              ))}
              <li className="p-2 bg-gray-50 text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  See all results for &quot;{query}&quot;
                </button>
              </li>
            </ul>
          ) : query.length > 1 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No results found for &quot;{query}&quot;</p>
              <button
                type="button"
                onClick={handleSubmit}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Search anyway
              </button>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-2">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handlePopularSearch(term)}
                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}