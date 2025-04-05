import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader, Utensils, Store, List } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '@/utils/apiClient';
import useUIStateStore from '@/stores/useUIStateStore';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ dishes: [], restaurants: [], lists: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Individual selectors to prevent reference equality issues
  const storedQuery = useUIStateStore(state => state.searchQuery);
  const setSearchQuery = useUIStateStore(state => state.setSearchQuery);
  
  // Initialize search field with stored query if exists
  useEffect(() => {
    if (storedQuery) {
      setQuery(storedQuery);
    }
  }, [storedQuery]);
  
  // Function to search
  const performSearch = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults({ dishes: [], restaurants: [], lists: [] });
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      
      const response = await apiClient(
        `/api/search?q=${encodeURIComponent(searchTerm.trim())}`,
        `Search for ${searchTerm}`
      );
      
      if (response && typeof response === 'object') {
        // Format and set results
        setResults({
          dishes: Array.isArray(response.dishes) ? response.dishes : [],
          restaurants: Array.isArray(response.restaurants) ? response.restaurants : [],
          lists: Array.isArray(response.lists) ? response.lists : []
        });
      } else {
        setError('Invalid response from search API');
        setResults({ dishes: [], restaurants: [], lists: [] });
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'An error occurred during search');
      setResults({ dishes: [], restaurants: [], lists: [] });
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  // Debounced search
  useEffect(() => {
    const timerId = setTimeout(() => {
      if (query && query.trim().length >= 2) {
        performSearch(query);
        // Store query in UI state for persistence
        setSearchQuery(query);
      } else {
        setResults({ dishes: [], restaurants: [], lists: [] });
      }
    }, 300);
    
    return () => clearTimeout(timerId);
  }, [query, performSearch, setSearchQuery]);
  
  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    if (query && query.trim()) {
      // Navigate to search results page with query
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
    }
  };
  
  // Clear search
  const handleClearSearch = () => {
    setQuery('');
    setResults({ dishes: [], restaurants: [], lists: [] });
    setSearchQuery(''); // Clear from store too
  };
  
  // Check if we have any results
  const hasResults = 
    results.dishes.length > 0 || 
    results.restaurants.length > 0 || 
    results.lists.length > 0;
  
  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="Search dishes, restaurants, lists..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#A78B71] focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        {query && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label="Clear search"
          >
            {isSearching ? (
              <Loader size={18} className="text-gray-400 animate-spin" />
            ) : (
              <X size={18} className="text-gray-400 hover:text-gray-600" />
            )}
          </button>
        )}
      </form>
      
      {showResults && query && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <Loader size={24} className="mx-auto animate-spin mb-2" />
              <p>Searching...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500">
              <p>{error}</p>
            </div>
          ) : !hasResults ? (
            <div className="p-4 text-center text-gray-500">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {/* Restaurants Section */}
              {results.restaurants.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-2">
                    Restaurants
                  </h3>
                  <ul>
                    {results.restaurants.slice(0, 3).map(restaurant => (
                      <li key={`restaurant-${restaurant.id}`}>
                        <Link
                          to={`/restaurant/${restaurant.id}`}
                          className="block px-4 py-2 hover:bg-gray-100 rounded-md"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="flex items-center">
                            <Store size={14} className="mr-2 text-gray-400" />
                            <div>
                              <div className="font-medium">{restaurant.name}</div>
                              <div className="text-xs text-gray-500">
                                {restaurant.city_name}{restaurant.neighborhood_name ? `, ${restaurant.neighborhood_name}` : ''}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                    {results.restaurants.length > 3 && (
                      <li className="px-4 py-1">
                        <Link 
                          to={`/search?q=${encodeURIComponent(query)}&type=restaurants`}
                          className="text-xs text-[#A78B71] hover:text-[#806959]"
                          onClick={() => setShowResults(false)}
                        >
                          See all {results.restaurants.length} restaurants
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Dishes Section */}
              {results.dishes.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-2">
                    Dishes
                  </h3>
                  <ul>
                    {results.dishes.slice(0, 3).map(dish => (
                      <li key={`dish-${dish.id}`}>
                        <Link
                          to={`/dish/${dish.id}`}
                          className="block px-4 py-2 hover:bg-gray-100 rounded-md"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="flex items-center">
                            <Utensils size={14} className="mr-2 text-gray-400" />
                            <div>
                              <div className="font-medium">{dish.name}</div>
                              <div className="text-xs text-gray-500">
                                {dish.restaurant || dish.restaurant_name || 'Unknown restaurant'}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                    {results.dishes.length > 3 && (
                      <li className="px-4 py-1">
                        <Link 
                          to={`/search?q=${encodeURIComponent(query)}&type=dishes`}
                          className="text-xs text-[#A78B71] hover:text-[#806959]"
                          onClick={() => setShowResults(false)}
                        >
                          See all {results.dishes.length} dishes
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Lists Section */}
              {results.lists.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 px-2">
                    Lists
                  </h3>
                  <ul>
                    {results.lists.slice(0, 3).map(list => (
                      <li key={`list-${list.id}`}>
                        <Link
                          to={`/lists/${list.id}`}
                          className="block px-4 py-2 hover:bg-gray-100 rounded-md"
                          onClick={() => setShowResults(false)}
                        >
                          <div className="flex items-center">
                            <List size={14} className="mr-2 text-gray-400" />
                            <div>
                              <div className="font-medium">{list.name}</div>
                              <div className="text-xs text-gray-500">
                                {list.item_count} item{list.item_count !== 1 ? 's' : ''}
                                {list.creator_handle ? ` • by @${list.creator_handle}` : ''}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                    {results.lists.length > 3 && (
                      <li className="px-4 py-1">
                        <Link 
                          to={`/search?q=${encodeURIComponent(query)}&type=lists`}
                          className="text-xs text-[#A78B71] hover:text-[#806959]"
                          onClick={() => setShowResults(false)}
                        >
                          See all {results.lists.length} lists
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* View all results link */}
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={handleSearchSubmit}
                  className="w-full text-center py-2 text-[#A78B71] hover:text-[#806959] text-sm font-medium"
                >
                  View all results for "{query}"
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;