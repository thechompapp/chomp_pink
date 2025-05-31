/* src/components/UI/SearchBar.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader, Utensils, Store, List } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUIStateStore } from '@/stores/useUIStateStore';
import { searchService } from '@/services/searchService';

const SearchBar = ({ 
  searchQuery, 
  setSearchQuery, 
  contentType = 'all',
  onSearch,
  initialQuery,
  className = ''
}) => {
  const navigate = useNavigate();
  const storedQuery = useUIStateStore(state => state.searchQuery);
  const setStoredSearchQuery = useUIStateStore(state => state.setSearchQuery);

  // Use initialQuery or searchQuery or storedQuery as fallback
  const [query, setQuery] = useState(initialQuery || searchQuery || storedQuery || '');
  const [results, setResults] = useState({ dishes: [], restaurants: [], lists: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Create a safe setSearchQuery function that handles missing prop
  const safeSetSearchQuery = useCallback((value) => {
    if (typeof setSearchQuery === 'function') {
      setSearchQuery(value);
    }
    // Always update the store as fallback
    setStoredSearchQuery(value);
  }, [setSearchQuery, setStoredSearchQuery]);

  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults({ dishes: [], restaurants: [], lists: [] });
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const response = await searchService.search({ q: searchTerm.trim(), type: contentType });
      setResults({
        dishes: Array.isArray(response?.dishes) ? response.dishes : [],
        restaurants: Array.isArray(response?.restaurants) ? response.restaurants : [],
        lists: Array.isArray(response?.lists) ? response.lists : [],
      });
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error("Search error:", err);
      setResults({ dishes: [], restaurants: [], lists: [] });
    } finally {
      setIsSearching(false);
    }
  }, [contentType]);

  useEffect(() => {
    const newQuery = initialQuery || searchQuery || storedQuery || '';
    setQuery(newQuery);
  }, [initialQuery, searchQuery, storedQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const inputElement = searchRef.current?.querySelector('input');
      if (document.activeElement === inputElement && query.trim().length >= 2) {
        performSearch(query);
      } else if (query.trim().length < 2) {
        setResults({ dishes: [], restaurants: [], lists: [] });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      safeSetSearchQuery(trimmedQuery);
      setShowResults(false);
      
      // If onSearch prop is provided, use it (for Search page)
      if (typeof onSearch === 'function') {
        onSearch(trimmedQuery, contentType);
      } else {
        // Default navigation behavior (for Home page)
        if (!window.location.pathname.startsWith('/search') || new URLSearchParams(window.location.search).get('q') !== trimmedQuery) {
          navigate(`/search?q=${encodeURIComponent(trimmedQuery)}&type=${contentType}`);
        }
      }
    }
  };

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults({ dishes: [], restaurants: [], lists: [] });
    safeSetSearchQuery('');
    setShowResults(false);
    searchRef.current?.querySelector('input')?.focus();
  }, [safeSetSearchQuery]);

  const handleResultClick = useCallback(() => {
    setShowResults(false);
  }, []);

  const hasResults = results.dishes.length > 0 || results.restaurants.length > 0 || results.lists.length > 0;

  const renderResultItem = (item, type, Icon) => (
    <li key={`${type}-${item.id}`}>
      <Link
        to={`/${type}/${item.id}`}
        onClick={handleResultClick}
        className="flex items-center px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors"
      >
        {Icon && <Icon size={16} className="mr-2 text-gray-500 flex-shrink-0" />}
        <span className="truncate">{item.name}</span>
      </Link>
    </li>
  );

  return (
    <div className={`relative w-full ${className}`} ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="flex items-center w-full">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              safeSetSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            placeholder={`Search ${contentType === 'all' ? 'everything' : contentType}...`}
            className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
            aria-label={`Search ${contentType === 'all' ? 'everything' : contentType}`}
            autoComplete="off"
          />
          {query && !isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button type="button" onClick={handleClearSearch} aria-label="Clear search" className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          )}
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Loader size={16} className="animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </form>
      {showResults && query && query.trim().length >= 2 && (
        <div className="absolute z-[60] mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : !isSearching && !hasResults ? (
            <div className="px-3 py-2 text-sm text-gray-500">No results found for "{query}".</div>
          ) : (
            <ul>
              {(contentType === 'dishes' || contentType === 'all') && results.dishes.length > 0 && (
                <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-600">Dishes</li>
              )}
              {(contentType === 'dishes' || contentType === 'all') && results.dishes.map(dish => renderResultItem(dish, 'dish', Utensils))}
              {(contentType === 'restaurants' || contentType === 'all') && results.restaurants.length > 0 && (
                <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-600">Restaurants</li>
              )}
              {(contentType === 'restaurants' || contentType === 'all') && results.restaurants.map(restaurant => renderResultItem(restaurant, 'restaurant', Store))}
              {(contentType === 'lists' || contentType === 'all') && results.lists.length > 0 && (
                <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-600">Lists</li>
              )}
              {(contentType === 'lists' || contentType === 'all') && results.lists.map(list => renderResultItem(list, 'lists', List))}
              {hasResults && (
                <li className="border-t border-gray-100 mt-1">
                  <button onClick={handleSearchSubmit} className="w-full text-left px-3 py-2 text-sm text-[#A78B71] font-medium hover:bg-gray-100 transition-colors">
                    See all results for "{query}"
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;