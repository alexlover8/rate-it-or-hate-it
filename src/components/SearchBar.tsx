'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { collection, query as firestoreQuery, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDebounce } from '../utils/hooks';

export type SearchResult = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
};

const popularSearches = [
  'iPhone',
  'Netflix',
  'Tesla',
  'PlayStation',
  'Amazon',
  'Google',
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debounce search query to reduce API calls
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const storedSearches = localStorage.getItem('recentSearches');
      if (storedSearches) {
        setRecentSearches(JSON.parse(storedSearches).slice(0, 5));
      }
    } catch (err) {
      console.error('Error loading recent searches:', err);
    }
  }, []);

  // Save a search term to recent searches
  const saveToRecentSearches = useCallback((term: string) => {
    try {
      const updatedSearches = [term, ...recentSearches.filter(item => item !== term)].slice(0, 5);
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (err) {
      console.error('Error saving recent search:', err);
    }
  }, [recentSearches]);

  // Close results if clicking outside the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  // Reset search when the route changes
  useEffect(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  }, [pathname]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.length > 1) {
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(newQuery.length > 0);
    }
  };

  // Perform the Firestore query using the name field (case-insensitive)
  useEffect(() => {
    if (debouncedQuery.length < 2) return;
    
    const performSearch = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Convert the query to lowercase for case-insensitive search
        const searchTerm = debouncedQuery.toLowerCase();
        
        // First try to search by name_lower field if it exists
        try {
          const itemsQuery = firestoreQuery(
            collection(db, 'items'),
            where('name_lower', '>=', searchTerm),
            where('name_lower', '<=', searchTerm + '\uf8ff'),
            orderBy('name_lower'),
            limit(maxResults)
          );
          
          const snapshot = await getDocs(itemsQuery);
          
          if (!snapshot.empty) {
            const searchResults = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || 'Unknown Item',
                category: data.category || 'uncategorized',
                imageUrl: data.imageUrl || null,
              };
            });
            
            setResults(searchResults);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.log('Error with name_lower search, falling back:', err);
          // Just proceed to the fallback search
        }
        
        // If we get here, either the first query had no results,
        // or name_lower might not exist, so we'll try a more generic approach
        const fallbackQuery = firestoreQuery(
          collection(db, 'items'),
          orderBy('name'),
          limit(maxResults * 3) // Get more to filter client-side
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        
        // Process results - filter client-side to match search term
        let searchResults = fallbackSnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || 'Unknown Item',
              category: data.category || 'uncategorized',
              imageUrl: data.imageUrl || null,
            };
          })
          .filter(item => item.name.toLowerCase().includes(searchTerm))
          .slice(0, maxResults);
        
        setResults(searchResults);
      } catch (err) {
        console.error('Error searching items:', err);
        setError('Failed to search. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    performSearch();
  }, [debouncedQuery, maxResults]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (query.trim()) {
      saveToRecentSearches(query.trim());
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      if (onSearch) {
        onSearch(query.trim());
      }
      setShowResults(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, result?: SearchResult) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (result) {
        handleSelectResult(result);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    saveToRecentSearches(result.name);
    router.push(`/item/${result.id}`);
    setShowResults(false);
  };

  const handleSearchTerm = (term: string) => {
    setQuery(term);
    setShowResults(true);
  };

  // Determine CSS classes based on the variant prop
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
          className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 ${variantClasses.icon}`} 
        />
        
        {/* Search input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleSearchInput}
          onFocus={() => query.length > 0 && setShowResults(true)}
          className={`
            ${variantClasses.input}
            bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            transition-shadow
          `}
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded={showResults}
          role="combobox"
          aria-controls="search-results"
          autoComplete="off"
        />
        
        {/* Clear button */}
        {query && (
          <button 
            type="button"
            onClick={clearSearch}
            className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 ${variantClasses.clearButton}`}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {/* Submit search button */}
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
        <div 
          className="absolute mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 overflow-hidden border border-gray-200 dark:border-gray-700"
          id="search-results"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 flex items-center justify-center">
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              <span>Searching...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              <p>{error}</p>
              <button
                type="button"
                onClick={() => { setError(null); setQuery(''); }}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                Clear search
              </button>
            </div>
          ) : results.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto" role="listbox">
              {results.map((result) => (
                <li 
                  key={result.id}
                  className="border-b border-gray-100 dark:border-gray-700 last:border-none hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectResult(result)}
                  onKeyDown={(e) => handleKeyDown(e, result)}
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                >
                  <div className="flex items-center p-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md flex-shrink-0 mr-3 relative overflow-hidden">
                      {result.imageUrl ? (
                        <Image 
                          src={result.imageUrl} 
                          alt={result.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full text-gray-400 dark:text-gray-500">
                          <Search className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-800 dark:text-gray-200 font-medium">{result.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">in {result.category}</p>
                    </div>
                  </div>
                </li>
              ))}
              <li className="p-2 bg-gray-50 dark:bg-gray-700 text-center">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
                >
                  See all results for &quot;{query}&quot;
                </button>
              </li>
            </ul>
          ) : query.length > 1 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No results found for &quot;{query}&quot;</p>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
              >
                Search anyway
              </button>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={`recent-${term}`}
                    type="button"
                    onClick={() => handleSearchTerm(term)}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Popular searches:</p>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={`popular-${term}`}
                      type="button"
                      onClick={() => handleSearchTerm(term)}
                      className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md text-blue-600 dark:text-blue-400 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Popular searches:</p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSearchTerm(term)}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200 transition-colors"
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