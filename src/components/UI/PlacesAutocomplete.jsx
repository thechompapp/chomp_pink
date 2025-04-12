// src/components/UI/PlacesAutocomplete.jsx
import React, { useState, useEffect } from 'react';
import apiClient from '@/services/apiClient';
import { Search } from 'lucide-react';

const PlacesAutocomplete = ({ rowId, initialValue = '', onPlaceSelected, disabled, onAddressChange }) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue || inputValue.length < 3) {
        setSuggestions([]);
        setError(null);
        return;
      }
      try {
        const response = await apiClient(
          `/api/places/autocomplete?input=${encodeURIComponent(inputValue)}`,
          'PlacesAutocomplete Fetch Suggestions'
        );
        if (response.data && Array.isArray(response.data)) {
          setSuggestions(response.data);
          setError(null);
        } else {
          setSuggestions([]);
          setError('No suggestions found.');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch suggestions.');
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [inputValue]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.description);
    setSuggestions([]);
    setIsFocused(false);
    if (onPlaceSelected) {
      onPlaceSelected({
        name: suggestion.description,
        place_id: suggestion.place_id,
      });
    }
    if (onAddressChange) {
      // Validate place_id format (Google Place IDs typically start with "ChIJ")
      const validPlaceId = suggestion.place_id && suggestion.place_id.startsWith('ChIJ') ? suggestion.place_id : null;
      onAddressChange(suggestion.description, validPlaceId);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          disabled={disabled}
          className="w-full pl-8 pr-3 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#A78B71] focus:border-[#A78B71] disabled:bg-gray-100"
          placeholder="Search for a place..."
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
      {isFocused && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlacesAutocomplete;