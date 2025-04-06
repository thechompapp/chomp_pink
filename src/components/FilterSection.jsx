// src/components/FilterSection.jsx
import React, { useEffect, useMemo, useCallback } from 'react';
import { X, MapPin, Tag, RotateCcw } from 'lucide-react'; // Added icons
import useUIStateStore from '@/stores/useUIStateStore';
import PillButton from '@/components/UI/PillButton';

const FilterSection = () => {
  // Store State & Actions (remain the same)
  const cities = useUIStateStore(state => state.cities || []);
  const cuisines = useUIStateStore(state => state.cuisines || []);
  const cityId = useUIStateStore(state => state.cityId);
  const selectedHashtags = useUIStateStore(state => state.hashtags || []);
  const fetchCities = useUIStateStore(state => state.fetchCities);
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const setCityId = useUIStateStore(state => state.setCityId);
  const setHashtags = useUIStateStore(state => state.setHashtags);
  const clearAllFilters = useUIStateStore(state => state.clearAllFilters);

  // Initial Data Fetch (remains the same)
  useEffect(() => { /* ... */ }, [fetchCities, fetchCuisines, cities.length, cuisines.length]);

  // Derived State (remains the same)
  const selectedCity = useMemo(() => cities.find(c => c.id === cityId), [cities, cityId]);
  const hasActiveFilters = !!selectedCity || selectedHashtags.length > 0;

  // Handlers (remain the same)
  const handleCityClick = useCallback((id) => { /* ... */ }, [cityId, setCityId]);
  const handleHashtagClick = useCallback((hashtagName) => { /* ... */ }, [selectedHashtags, setHashtags]);
  const removeCityFilter = useCallback(() => { /* ... */ }, [setCityId]);
  const removeHashtagFilter = useCallback((hashtagName) => { /* ... */ }, [selectedHashtags, setHashtags]);

  // --- Render ---
  return (
    // Centered container with max-width, adjust 'max-w-4xl' as needed for compactness
    <div className="space-y-3 mb-6 max-w-4xl mx-auto">

      {/* Section 1: Selected Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-600 mr-1">Filters:</span>
          {/* Selected City Pill */}
          {selectedCity && (
            <span className="inline-flex items-center pl-2 pr-1 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <MapPin size={13} className="mr-1 text-blue-600" />
              {selectedCity.name}
              <button
                type="button" onClick={removeCityFilter}
                className="ml-1 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-200 rounded-full focus:outline-none focus:bg-blue-200"
                aria-label={`Remove city filter ${selectedCity.name}`}
              > <X size={14} /> </button>
            </span>
          )}
          {/* Selected Hashtag Pills */}
          {selectedHashtags.map(hashtag => (
            <span key={hashtag} className="inline-flex items-center pl-2 pr-1 py-0.5 rounded-full text-sm font-medium bg-teal-100 text-teal-800 border border-teal-200">
              <Tag size={13} className="mr-1 text-teal-600" />
              {hashtag}
              <button
                type="button" onClick={() => removeHashtagFilter(hashtag)}
                className="ml-1 p-0.5 text-teal-500 hover:text-teal-700 hover:bg-teal-200 rounded-full focus:outline-none focus:bg-teal-200"
                aria-label={`Remove hashtag filter ${hashtag}`}
              > <X size={14} /> </button>
            </span>
          ))}
          {/* Reset All Button */}
          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs text-gray-500 hover:text-red-600 hover:underline font-medium px-2 py-1 flex items-center gap-1"
          > <RotateCcw size={12} /> Reset All </button>
        </div>
      )}

      {/* Section 2: City Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Optional Label */}
        {/* <span className="text-sm font-medium text-gray-500 w-16 text-right pr-2 hidden sm:inline">City:</span> */}
        {cities.map(city => (
          <PillButton
            key={city.id} label={city.name} isActive={cityId === city.id}
            onClick={() => handleCityClick(city.id)}
            className={cityId === city.id ? '!bg-blue-600 !border-blue-600' : ''} // Example city active style
          />
        ))}
         {cities.length === 0 && <span className="text-sm text-gray-400">Loading cities...</span>}
      </div>

      {/* Section 3: Hashtag/Cuisine Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
         {/* Optional Label */}
         {/* <span className="text-sm font-medium text-gray-500 w-16 text-right pr-2 hidden sm:inline">Type:</span> */}
        {cuisines.map(cuisine => (
          <PillButton
            key={cuisine.id} label={cuisine.name} prefix="#"
            isActive={selectedHashtags.includes(cuisine.name)}
            onClick={() => handleHashtagClick(cuisine.name)}
             className={selectedHashtags.includes(cuisine.name) ? '!bg-teal-600 !border-teal-600' : ''} // Example hashtag active style
          />
        ))}
         {cuisines.length === 0 && <span className="text-sm text-gray-400">Loading filters...</span>}
      </div>
    </div>
  );
};

export default FilterSection;