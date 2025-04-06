// src/components/UI/SearchBar.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader, Utensils, Store, List } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useUIStateStore from '@/stores/useUIStateStore';
import { searchService } from '@/services/searchService';

const SearchBar = () => {
  const navigate = useNavigate();
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
      performSearch(query);
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
    if (query.trim()) {
      setSearchQuery(query.trim());
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowResults(false);
    }
  };

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setResults({ dishes: [], restaurants: [], lists: [] });
    setSearchQuery('');
    setShowResults(false);
  }, [setSearchQuery]);

  const hasResults = results.dishes.length > 0 || results.restaurants.length > 0 || results.lists.length > 0;

  return (
    <div className="relative" ref={searchRef}>
      <form onSubmit={handleSearchSubmit} className="flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder="Search dishes, restaurants, or lists..."
          className="w-full p-2 border rounded"
        />
        {query && (
          <button type="button" onClick={handleClearSearch} className="p-2">
            <X size={18} />
          </button>
        )}
        <button type="submit" className="p-2">
          <Search size={18} />
        </button>
      </form>
      {showResults && query && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow-lg">
          {isSearching ? (
            <div className="p-2 flex items-center justify-center">
              <Loader className="animate-spin" size={20} />
            </div>
          ) : error ? (
            <div className="p-2 text-red-500">{error}</div>
          ) : !hasResults ? (
            <div className="p-2 text-gray-500">No results found.</div>
          ) : (
            <ul>
              {results.dishes.map(dish => (
                <li key={dish.id}>
                  <Link to={`/dish/${dish.id}`} className="flex items-center p-2 hover:bg-gray-100">
                    <Utensils size={16} className="mr-2" /> {dish.name}
                  </Link>
                </li>
              ))}
              {results.restaurants.map(restaurant => (
                <li key={restaurant.id}>
                  <Link to={`/restaurant/${restaurant.id}`} className="flex items-center p-2 hover:bg-gray-100">
                    <Store size={16} className="mr-2" /> {restaurant.name}
                  </Link>
                </li>
              ))}
              {results.lists.map(list => (
                <li key={list.id}>
                  <Link to={`/lists/${list.id}`} className="flex items-center p-2 hover:bg-gray-100">
                    <List size={16} className="mr-2" /> {list.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;