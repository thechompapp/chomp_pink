// src/components/UI/SearchBar.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader, Utensils, Store, List } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// Corrected: Use named import for the store hook
import { useUIStateStore } from '@/stores/useUIStateStore';
import { searchService } from '@/services/searchService';

const SearchBar = () => {
  const navigate = useNavigate();
  // Use the imported hook correctly
  const storedQuery = useUIStateStore(state => state.searchQuery);
  const setSearchQuery = useUIStateStore(state => state.setSearchQuery);

  const [query, setQuery] = useState(storedQuery || '');
  const [results, setResults] = useState({ dishes: [], restaurants: [], lists: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults({ dishes: [], restaurants: [], lists: [] });
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const response = await searchService.search({ q: searchTerm.trim() });
      setResults(response || { dishes: [], restaurants: [], lists: [] });
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    setQuery(storedQuery || '');
  }, [storedQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only search if the query is focused to prevent background searches
      if (document.activeElement === searchRef.current?.querySelector('input')) {
          performSearch(query);
      } else {
          // Optionally clear results if input loses focus and query is empty?
          // if (!query.trim()) {
          //     setResults({ dishes: [], restaurants: [], lists: [] });
          // }
      }
    }, 300); // Debounce time
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
      setSearchQuery(trimmedQuery); // Update the global store
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`); // Navigate to search results page
      setShowResults(false); // Hide dropdown after submitting
    }
  };

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults({ dishes: [], restaurants: [], lists: [] });
    setSearchQuery(''); // Clear global store
    setShowResults(false);
    // Optionally focus the input again
    searchRef.current?.querySelector('input')?.focus();
  }, [setSearchQuery]);

  const handleResultClick = useCallback(() => {
      // Hide results when a link is clicked
      setShowResults(false);
      // Optionally clear the input query after navigating
      // setQuery('');
      // setSearchQuery('');
  }, []);


  const hasResults = results.dishes.length > 0 || results.restaurants.length > 0 || results.lists.length > 0;

  // Define result item rendering
  const renderResultItem = (item, type, Icon) => (
    <li key={`${type}-${item.id}`}>
      <Link
        to={`/${type}/${item.id}`}
        onClick={handleResultClick} // Close dropdown on click
        className="flex items-center px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 transition-colors"
      >
        {Icon && <Icon size={16} className="mr-2 text-gray-500 flex-shrink-0" />}
        <span className="truncate">{item.name}</span>
      </Link>
    </li>
  );

  return (
    <div className="relative w-full" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="flex items-center w-full">
        <div className="relative flex-grow">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
               <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
           </div>
           <input
             type="search" // Use type="search" for better semantics and potential browser features
             value={query}
             onChange={(e) => { setQuery(e.target.value); setShowResults(true); }} // Show results on change
             onFocus={() => setShowResults(true)} // Also show on focus
             placeholder="Search dishes, restaurants, or lists..."
             className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
             aria-label="Search"
           />
           {/* Clear button inside the input area */}
            {query && !isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                 <button
                     type="button"
                     onClick={handleClearSearch}
                     className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-400 rounded-full"
                     aria-label="Clear search"
                 >
                     <X size={16} />
                 </button>
                </div>
             )}
            {/* Loader inside the input area */}
            {isSearching && (
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Loader size={16} className="animate-spin text-gray-400" />
                 </div>
            )}
        </div>
        {/* Explicit submit button removed as Enter key handles it */}
      </form>

      {/* Results Dropdown */}
      {showResults && query && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {/* Removed isSearching check here, loader is now inline */}
          {error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : !hasResults && !isSearching ? ( // Show no results only if not searching
            <div className="px-3 py-2 text-sm text-gray-500">No results found for "{query}".</div>
          ) : (
            <ul>
              {results.dishes.length > 0 && (
                 <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dishes</li>
              )}
              {results.dishes.map(dish => renderResultItem(dish, 'dish', Utensils))}

              {results.restaurants.length > 0 && (
                  <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-100 mt-1">Restaurants</li>
              )}
              {results.restaurants.map(restaurant => renderResultItem(restaurant, 'restaurant', Store))}

              {results.lists.length > 0 && (
                  <li className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-100 mt-1">Lists</li>
              )}
              {results.lists.map(list => renderResultItem(list, 'lists', List))}

               {/* Link to full search page */}
              <li className="border-t border-gray-100 mt-1">
                 <button
                    onClick={(e) => { handleSearchSubmit(e); setShowResults(false); }} // Use form submit handler
                    className="w-full text-left px-3 py-2 text-sm text-[#A78B71] font-medium hover:bg-gray-100 transition-colors"
                 >
                    See all results for "{query}"
                 </button>
               </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;