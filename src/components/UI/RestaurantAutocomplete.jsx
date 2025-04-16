/* src/components/UI/RestaurantAutocomplete.jsx */
import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';
import { usePlacesApi } from '@/context/PlacesApiContext';

const RestaurantAutocomplete = ({
  initialValue = '',
  inputValue = '',
  onRestaurantSelected,
  onChange,
  disabled,
  required,
  placeholder = 'Search restaurants...',
  useLocalSearch = false,
}) => {
  const [searchValue, setSearchValue] = useState(inputValue || initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const { isAvailable: placesApiAvailable } = usePlacesApi();

  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ['restaurantSuggestions', searchValue],
    queryFn: () => searchService.search({ q: searchValue, type: 'restaurant', limit: 5 }),
    enabled: false,
    placeholderData: { restaurants: [] },
  });

  const { data: placesSuggestions, isLoading: placesLoading } = useQuery({
    queryKey: ['placesSuggestions', searchValue],
    queryFn: async () => {
      const response = await fetch(`/api/places/proxy/autocomplete?input=${encodeURIComponent(searchValue)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) throw new Error('Invalid Places API response');
      return data.data;
    },
    enabled: !useLocalSearch && placesApiAvailable && !!searchValue.trim() && searchValue.length >= 2,
    placeholderData: [],
  });

  useEffect(() => {
    if (useLocalSearch && searchValue.trim() && searchValue.length >= 2) {
      refetch();
    }
  }, [searchValue, useLocalSearch, refetch]);

  useEffect(() => {
    if (useLocalSearch && searchResults?.restaurants) {
      setSuggestions(searchResults.restaurants.map(r => ({
        id: r.id,
        name: r.name,
        description: r.city ? `${r.neighborhood ? r.neighborhood + ', ' : ''}${r.city}` : 'Unknown Location',
      })));
    } else if (!useLocalSearch && placesSuggestions) {
      setSuggestions(placesSuggestions.map(s => ({
        place_id: s.place_id,
        name: s.structured_formatting?.main_text || s.description,
        description: s.structured_formatting?.secondary_text || s.description,
      })));
    } else {
      setSuggestions([]);
    }
  }, [searchResults, placesSuggestions, useLocalSearch]);

  useEffect(() => {
    setSearchValue(inputValue || initialValue);
  }, [inputValue, initialValue]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onChange) onChange(value);
  };

  const handleSelect = (suggestion) => {
    if (useLocalSearch) {
      onRestaurantSelected?.({ id: suggestion.id, name: suggestion.name });
    } else {
      onRestaurantSelected?.({ place_id: suggestion.place_id, name: suggestion.name });
    }
    setSearchValue(suggestion.name);
    if (onChange) onChange(suggestion.name);
    setSuggestions([]);
    setIsFocused(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          disabled={disabled}
          placeholder={placeholder}
          className="block w-full p-2 pl-8 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] disabled:opacity-50 disabled:bg-gray-100"
          required={required}
          aria-label="Search restaurants"
          autoComplete="off"
        />
        <MapPin size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
        {(isLoading || placesLoading) && searchValue && (
          <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>
      {isFocused && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={useLocalSearch ? suggestion.id : suggestion.place_id}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => handleSelect(suggestion)}
            >
              <div className="font-medium">{suggestion.name}</div>
              <div className="text-xs text-gray-500">{suggestion.description}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RestaurantAutocomplete;