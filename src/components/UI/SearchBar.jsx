/* src/components/UI/SearchBar.jsx */
/* REMOVED: All TypeScript syntax */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader, Utensils, Store, List } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUIStateStore } from '@/stores/useUIStateStore'; // Use named import
import { searchService } from '@/services/searchService'; // Use JS service

const SearchBar = () => {
  const navigate = useNavigate();
  // Select state and actions from the store
  const storedQuery = useUIStateStore(state => state.searchQuery);
  const setSearchQuery = useUIStateStore(state => state.setSearchQuery);

  // Local state for the input and results
  const [query, setQuery] = useState(storedQuery || '');
  const [results, setResults] = useState({ dishes: [], restaurants: [], lists: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false); // Control dropdown visibility
  const searchRef = useRef(null); // Ref for the main search container div

  // Fetch search results
  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults({ dishes: [], restaurants: [], lists: [] }); // Clear results if query is too short
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      // Assuming searchService returns { dishes: [], restaurants: [], lists: [] } or throws
      const response = await searchService.search({ q: searchTerm.trim() });
      // Ensure response structure before setting state
      setResults({
          dishes: Array.isArray(response?.dishes) ? response.dishes : [],
          restaurants: Array.isArray(response?.restaurants) ? response.restaurants : [],
          lists: Array.isArray(response?.lists) ? response.lists : []
      });
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error("Search error:", err);
       setResults({ dishes: [], restaurants: [], lists: [] }); // Clear results on error
    } finally {
      setIsSearching(false);
    }
  }, []); // No external dependencies needed for the function logic itself

  // Sync local query with global store query on mount/change
  useEffect(() => {
    setQuery(storedQuery || '');
  }, [storedQuery]);

  // Debounce search API call
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Check if the input element within the ref is the active element
      const inputElement = searchRef.current?.querySelector('input');
      if (document.activeElement === inputElement && query.trim().length >= 2) { // Check length before searching
          performSearch(query);
      } else if (query.trim().length < 2) {
           setResults({ dishes: [], restaurants: [], lists: [] }); // Clear results for short queries
      }
    }, 300); // 300ms debounce time

    return () => clearTimeout(timeoutId); // Cleanup timeout on unmount or query change
  }, [query, performSearch]); // Rerun effect when query or performSearch changes


  // Handle clicks outside the search bar to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); // Empty dependency array, runs once on mount

  // Handle form submission (e.g., pressing Enter)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      setSearchQuery(trimmedQuery); // Update global store immediately
      setShowResults(false); // Hide dropdown
       // Prevent navigating if already on search page with same query
      if (!window.location.pathname.startsWith('/search') || new URLSearchParams(window.location.search).get('q') !== trimmedQuery) {
         navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
      }
    }
  };

  // Clear search input and results
  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults({ dishes: [], restaurants: [], lists: [] });
    setSearchQuery(''); // Clear global store
    setShowResults(false);
    searchRef.current?.querySelector('input')?.focus(); // Focus input after clearing
  }, [setSearchQuery]); // setSearchQuery is stable from Zustand

  // Close dropdown when a result link is clicked
  const handleResultClick = useCallback(() => {
      setShowResults(false);
      // Optionally clear query after click?
      // setQuery('');
      // setSearchQuery('');
  }, []); // No dependencies needed

  // Check if there are any results to display
  const hasResults = results.dishes.length > 0 || results.restaurants.length > 0 || results.lists.length > 0;

  // Helper function to render a single result item link
  const renderResultItem = (item, type, Icon) => (
    <li key={`${type}-${item.id}`}>
      <Link
        to={`/${type}/${item.id}`}
        onClick={handleResultClick} // Close dropdown
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
             type="search"
             value={query}
             onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
             onFocus={() => setShowResults(true)} // Show results when input is focused
             placeholder="Search dishes, restaurants, or lists..."
             className="block w-full pl-9 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm"
             aria-label="Search"
             autoComplete="off" // Disable browser autocomplete if desired
           />
           {/* Clear button */}
            {query && !isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                 <button type="button" onClick={handleClearSearch} className="..." aria-label="Clear search">
                     <X size={16} />
                 </button>
                </div>
             )}
            {/* Loading spinner */}
            {isSearching && (
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Loader size={16} className="animate-spin text-gray-400" />
                 </div>
            )}
        </div>
      </form>

      {/* Results Dropdown */}
      {showResults && query && query.trim().length >= 2 && ( // Only show if focused, query long enough
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : !isSearching && !hasResults ? ( // Show 'no results' only when not actively searching
            <div className="px-3 py-2 text-sm text-gray-500">No results found for "{query}".</div>
          ) : ( // Show results or loading indicator (handled implicitly by sections below)
            <ul>
              {/* Dishes */}
              {results.dishes.length > 0 && (<li className="px-3 pt-2 pb-1 text-xs font-semibold ...">Dishes</li>)}
              {results.dishes.map(dish => renderResultItem(dish, 'dish', Utensils))}

              {/* Restaurants */}
              {results.restaurants.length > 0 && (<li className="px-3 pt-2 pb-1 text-xs font-semibold ...">Restaurants</li>)}
              {results.restaurants.map(restaurant => renderResultItem(restaurant, 'restaurant', Store))}

              {/* Lists */}
              {results.lists.length > 0 && (<li className="px-3 pt-2 pb-1 text-xs font-semibold ...">Lists</li>)}
              {results.lists.map(list => renderResultItem(list, 'lists', List))}

               {/* Link to full search page */}
               {hasResults && ( // Only show "See all" if there are some results
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