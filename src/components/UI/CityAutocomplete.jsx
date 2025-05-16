/* src/components/UI/CityAutocomplete.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Loader2 } from 'lucide-react';

const CityAutocomplete = ({
  initialValue = '',
  inputValue = '',
  onCitySelected,
  onChange,
  disabled,
  required,
  placeholder = 'Search cities...',
  cities = [], // Full list of cities
}) => {
  console.log('[CityAutocomplete] Initial props:', {
    initialValue, 
    inputValue, 
    citiesLength: cities?.length || 0
  });
  
  // Derive initial search value from props, handling both ID and name cases
  const initialSearchValue = useMemo(() => {
    // If inputValue is a numeric string, it might be an ID
    const isNumericId = /^\d+$/.test(inputValue);
    
    if (isNumericId && cities && cities.length > 0) {
      // Try to find city by ID
      const foundCity = cities.find(c => String(c.id) === inputValue);
      if (foundCity) {
        console.log('[CityAutocomplete] Found city by ID:', foundCity);
        return foundCity.name || foundCity.city_name || foundCity.cityName || '';
      }
    }
    
    // If not ID or ID not found, use inputValue directly
    return inputValue || initialValue || '';
  }, [inputValue, initialValue, cities]);
  
  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [isFocused, setIsFocused] = useState(false);
  const [debug, setDebug] = useState(true); // Enable debug mode to trace the issue

  // Debug log cities data - only when debug is enabled
  useEffect(() => {
    if (debug) {
      console.log(`[CityAutocomplete] Received ${cities?.length || 0} cities:`, cities);
    }
  }, [cities, debug]);

  // Search cities based on input
  const suggestions = useMemo(() => {
    if (!cities || !Array.isArray(cities)) {
      if (debug) console.log('[CityAutocomplete] Cities is not an array or is empty');
      return [];
    }
    
    // Log the exact structure of first few cities only when debug is enabled
    if (debug && cities.length > 0) {
      console.log('[CityAutocomplete] Cities data analysis:', {
        totalCities: cities.length,
        firstCity: cities[0],
        cityNames: cities.map(c => c.name || c.city_name || c.cityName || 'Unknown').slice(0, 5),
        objectKeys: cities[0] ? Object.keys(cities[0]) : []
      });
    }
    
    if (!searchValue || searchValue.length < 1) {
      const initialSuggestions = cities.slice(0, 10);
      if (debug) {
        console.log(`[CityAutocomplete] Showing initial ${initialSuggestions.length} city suggestions:`, 
          initialSuggestions.map(c => c.name || c.city_name || c.cityName || 'Unknown'));
      }
      return initialSuggestions;
    }
    
    const searchTerm = searchValue.toLowerCase().trim();
    if (debug) {
      console.log(`[CityAutocomplete] Searching for cities with term: "${searchTerm}"`);
    }
    
    const filtered = cities
      .filter(city => {
        // Handle different possible city name properties
        const cityName = city.name || city.city_name || city.cityName || '';
        const match = cityName.toLowerCase().includes(searchTerm);
        if (debug) console.log(`City ${cityName}: ${match ? 'MATCH' : 'no match'} for "${searchTerm}"`);
        return match;
      })
      .slice(0, 10); // Limit to 10 results for performance
    
    if (debug) {
      console.log(`[CityAutocomplete] Found ${filtered.length} matching cities for "${searchTerm}"`);
    }
    return filtered;
  }, [searchValue, cities, debug]);

  // Update search value when inputValue or initialValue changes
  useEffect(() => {
    setSearchValue(initialSearchValue);
  }, [initialSearchValue]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    if (debug) {
      console.log(`[CityAutocomplete] Input changed to: "${value}"`);
    }
    setSearchValue(value);
    if (onChange) onChange(value);
  };

  const handleSelect = (city) => {
    const cityName = city.name || city.city_name || city.cityName || 'Unknown City';
    const cityId = city.id || city.city_id || null;
    
    console.log(`[CityAutocomplete] Selected city:`, { 
      originalCity: city,
      extractedData: {
        id: cityId,
        name: cityName,
        has_boroughs: !!city.has_boroughs
      }
    });
    
    onCitySelected?.({
      id: cityId,
      name: cityName,
      has_boroughs: !!city.has_boroughs
    });
    
    // Set display value using the appropriate name property
    setSearchValue(cityName);
    if (onChange) onChange(cityName);
    setIsFocused(false);
  };

  // Debug Log focus state changes only when needed
  const handleFocus = () => {
    if (debug) {
      console.log('[CityAutocomplete] Input focused, suggestions:', suggestions.length);
    }
    setIsFocused(true);
  };

  const handleBlur = () => {
    // No need to log every blur event
    setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="block w-full p-2 pl-8 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 disabled:opacity-50 disabled:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-gray-600 dark:focus:border-gray-600"
          required={required}
          aria-label="Search cities"
          autoComplete="off"
        />
        <Building2 size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      {isFocused && (
        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          {Array.isArray(suggestions) && suggestions.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {suggestions.map((city) => {
                const cityName = city.name || city.city_name || city.cityName || 'Unknown City';
                const cityId = city.id || city.city_id || null;
                // Always log each suggestion for debugging
                console.log(`[CityAutocomplete] Rendering suggestion:`, { cityName, cityId, city });
                return (
                  <li
                    key={cityId || `city-${Math.random()}`}
                    className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={() => handleSelect(city)}
                  >
                    <div className="font-medium">{cityName}</div>
                    {cityId && <div className="text-xs text-gray-500">ID: {cityId}</div>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-3 text-sm text-gray-500">
              {cities && cities.length > 0 
                ? `No matches found for "${searchValue}"`
                : 'No cities data available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete; 