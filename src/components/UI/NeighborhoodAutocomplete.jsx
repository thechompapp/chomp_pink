/* src/components/UI/NeighborhoodAutocomplete.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

const NeighborhoodAutocomplete = ({
  initialValue = '',
  inputValue = '',
  onNeighborhoodSelected,
  onChange,
  disabled,
  required,
  placeholder = 'Search neighborhoods...',
  neighborhoods = [], // Full list of neighborhoods
  cityId = null, // Optional city ID to filter neighborhoods
}) => {
  console.log('[NeighborhoodAutocomplete] Initial props:', {
    initialValue, 
    inputValue, 
    neighborhoodsLength: neighborhoods?.length || 0,
    cityId
  });
  
  // Derive initial search value from props, handling both ID and name cases
  const initialSearchValue = useMemo(() => {
    // If inputValue is a numeric string, it might be an ID
    const isNumericId = /^\d+$/.test(inputValue);
    
    if (isNumericId && neighborhoods && neighborhoods.length > 0) {
      // Try to find neighborhood by ID
      const foundNeighborhood = neighborhoods.find(n => String(n.id) === inputValue);
      if (foundNeighborhood) {
        console.log('[NeighborhoodAutocomplete] Found neighborhood by ID:', foundNeighborhood);
        return foundNeighborhood.name || foundNeighborhood.neighborhood_name || foundNeighborhood.neighborhoodName || '';
      }
    }
    
    // If not ID or ID not found, use inputValue directly
    return inputValue || initialValue || '';
  }, [inputValue, initialValue, neighborhoods]);
  
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [isFocused, setIsFocused] = useState(false);
  const [debug, setDebug] = useState(true); // Enable debug mode to trace the issue

  // Debug log neighborhoods data - only when debug is enabled
  useEffect(() => {
    if (debug) {
      console.log(`[NeighborhoodAutocomplete] Received ${neighborhoods?.length || 0} neighborhoods, cityId: ${cityId}`);
    }
  }, [neighborhoods, cityId, debug]);

  // Filter neighborhoods by cityId if provided
  const filteredNeighborhoods = useMemo(() => {
    if (!neighborhoods || !Array.isArray(neighborhoods)) {
      if (debug) console.log('[NeighborhoodAutocomplete] Neighborhoods is not an array or is empty');
      return [];
    }
    
    // Log the exact structure of first few neighborhoods when debug is enabled
    if (debug && neighborhoods.length > 0) {
      console.log('[NeighborhoodAutocomplete] First neighborhood structure:', JSON.stringify(neighborhoods[0]));
    }
    
    // If cityId is provided, filter by city_id
    if (cityId) {
      const filtered = neighborhoods.filter(n => {
        const nCityId = String(n.city_id || n.cityId || '');
        return nCityId === String(cityId);
      });
      if (debug) {
        console.log(`[NeighborhoodAutocomplete] Filtered to ${filtered.length} neighborhoods for city ${cityId}`);
      }
      return filtered;
    }
    
    if (debug) {
      console.log(`[NeighborhoodAutocomplete] Using all ${neighborhoods.length} neighborhoods (no city filter)`);
    }
    return neighborhoods;
  }, [neighborhoods, cityId, debug]);

  // Search filtered neighborhoods based on input
  const suggestions = useMemo(() => {
    if (!searchValue || searchValue.length < 1) {
      const initialSuggestions = filteredNeighborhoods.slice(0, 10);
      if (debug) {
        console.log(`[NeighborhoodAutocomplete] Showing initial ${initialSuggestions.length} neighborhood suggestions`);
      }
      return initialSuggestions;
    }
    
    const searchTerm = searchValue.toLowerCase().trim();
    if (debug) {
      console.log(`[NeighborhoodAutocomplete] Searching for neighborhoods with term: "${searchTerm}"`);
    }
    
    const filtered = filteredNeighborhoods
      .filter(n => {
        // Handle different possible neighborhood name properties
        const nbName = n.name || n.neighborhood_name || n.neighborhoodName || '';
        const cityName = n.city_name || n.cityName || '';
        return nbName.toLowerCase().includes(searchTerm) || 
               (cityName && cityName.toLowerCase().includes(searchTerm));
      })
      .slice(0, 10);
    
    if (debug) {
      console.log(`[NeighborhoodAutocomplete] Found ${filtered.length} matching neighborhoods for "${searchTerm}"`);
    }
    return filtered;
  }, [searchValue, filteredNeighborhoods, debug]);

  // Update search value when inputValue or initialValue changes
  useEffect(() => {
    setSearchValue(initialSearchValue);
  }, [initialSearchValue]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (onChange) onChange(value);
  };

  const handleSelect = (neighborhood) => {
    console.log(`[NeighborhoodAutocomplete] Selected neighborhood:`, neighborhood); // Keep this important log
    onNeighborhoodSelected?.({
      id: neighborhood.id || neighborhood.neighborhood_id,
      name: neighborhood.name || neighborhood.neighborhood_name || neighborhood.neighborhoodName || '',
      city_id: neighborhood.city_id || neighborhood.cityId,
      city_name: neighborhood.city_name || neighborhood.cityName || ''
    });
    // Set display value using the appropriate name property
    const displayName = neighborhood.name || neighborhood.neighborhood_name || neighborhood.neighborhoodName || '';
    setSearchValue(displayName);
    if (onChange) onChange(displayName);
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
          className="block w-full p-2 pl-8 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 disabled:opacity-50 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-gray-600 dark:focus:border-gray-600"
          required={required}
          aria-label="Search neighborhoods"
          autoComplete="off"
        />
        <MapPin size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      {isFocused && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((neighborhood) => (
            <li
              key={neighborhood.id || `nb-${Math.random()}`}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => handleSelect(neighborhood)}
            >
              <div className="font-medium">{neighborhood.name || neighborhood.neighborhood_name || neighborhood.neighborhoodName || 'Unknown'}</div>
              <div className="text-xs text-gray-500">{neighborhood.city_name || neighborhood.cityName || 'Unknown City'}</div>
            </li>
          ))}
        </ul>
      )}
      {isFocused && suggestions.length === 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg p-3 text-sm text-gray-500">
          No neighborhoods found{cityId ? ' for the selected city' : ''}
        </div>
      )}
    </div>
  );
};

export default NeighborhoodAutocomplete; 