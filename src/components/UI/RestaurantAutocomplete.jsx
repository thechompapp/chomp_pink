/* src/components/UI/RestaurantAutocomplete.jsx */
// ** ADDED: Import React hooks **
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Input from './Input.jsx';
import apiClient from '@/services/apiClient.js';
import { Loader2 } from 'lucide-react'; // Assuming Loader2 is needed for isLoading state

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const RestaurantAutocomplete = ({
  initialValue = '',
  onRestaurantSelected, // Expects to receive { id: number, name: string }
  onChange, // Receives the raw input string value
  disabled = false,
  required = false,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const suggestionsRef = useRef(null); // Ref for the suggestions list

  // Update local query when initialValue changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Debounced fetch function
  const fetchSuggestions = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const response = await apiClient(
            `/api/search?type=restaurant&q=${encodeURIComponent(searchTerm)}&limit=10`,
            'RestaurantAutocomplete Fetch'
        );
        if (response.success && response.data?.restaurants) {
             const validSuggestions = response.data.restaurants.filter(r => r && r.id != null && r.name != null);
             setSuggestions(validSuggestions);
        } else {
            console.warn("Invalid suggestion response:", response);
            setSuggestions([]);
             if (!response.success) setError(response.error || 'Failed to fetch suggestions.');
        }
    } catch (err) {
        console.error("Error fetching restaurant suggestions:", err);
        setError('Failed to fetch suggestions.');
        setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // apiClient is stable, no dependency needed

  // Create the debounced version using useMemo ** (This was the line causing the error) **
  const debouncedFetchSuggestions = useMemo(() => debounce(fetchSuggestions, 350), [fetchSuggestions]);

  // Handle text input changes
  const handleInputChange = (e) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (onChange) {
      onChange(newQuery); // Update parent form state immediately with the text change
    }
    // Trigger debounced fetch
    debouncedFetchSuggestions(newQuery);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    if (!suggestion || suggestion.id == null || suggestion.name == null) return;
    const suggestionName = suggestion.name || ''; // Ensure name is a string
    setQuery(suggestionName); // Update input field
    setSuggestions([]); // Close dropdown
    setError(null); // Clear errors
    if (onRestaurantSelected) {
      // Pass selected restaurant details {id, name}
      onRestaurantSelected({ id: suggestion.id, name: suggestionName });
    }
    if (onChange) {
       // Also trigger the onChange for the name in case parent needs it
       onChange(suggestionName);
    }
  };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                // Check if the click was on the input itself - don't close if so
                const inputElement = document.getElementById('restaurant-autocomplete-input'); // Assuming you add this ID
                if (inputElement && inputElement.contains(event.target)) {
                    return;
                }
                setSuggestions([]); // Close suggestions
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []); // Empty dependency array means this runs once on mount/unmount

  return (
    <div className="relative">
      <Input
        id="restaurant-autocomplete-input" // Add an ID for the click outside check
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Type Restaurant Name..."
        disabled={disabled || isLoading}
        required={required}
        autoComplete="off"
        // Show suggestions dropdown on focus if query is long enough
        onFocus={() => { if (query.length >= 2) { debouncedFetchSuggestions(query); } }}
      />
      {isLoading && <div className="absolute right-2 top-1/2 transform -translate-y-1/2"><Loader2 size={16} className="animate-spin text-gray-400" /></div>}
      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <ul ref={suggestionsRef} className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s) => (
            <li
              key={s.id}
              onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s); }} // Use onMouseDown
              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
            >
              {s.name} {s.city_name ? `(${s.city_name})` : ''}
            </li>
          ))}
        </ul>
      )}
       {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default RestaurantAutocomplete;