// src/components/FilterSection.jsx
import React, { useEffect, useMemo, useCallback } from 'react';
import { X, MapPin, Tag, RotateCcw } from 'lucide-react'; // Added icons
import useUIStateStore from '@/stores/useUIStateStore';
import PillButton from '@/components/UI/PillButton';

const FilterSection = () => {
  // Store State & Actions
  const cities = useUIStateStore(state => state.cities || []);
  const cuisines = useUIStateStore(state => state.cuisines || []);
  const cityId = useUIStateStore(state => state.cityId);
  const selectedHashtags = useUIStateStore(state => state.hashtags || []); // This holds selected cuisine *names*
  const fetchCities = useUIStateStore(state => state.fetchCities);
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const setCityId = useUIStateStore(state => state.setCityId);
  const setHashtags = useUIStateStore(state => state.setHashtags); // Action to set the hashtags array
  const clearAllFilters = useUIStateStore(state => state.clearAllFilters);

  // Initial Data Fetch
  useEffect(() => {
    if (cities.length === 0) {
        fetchCities();
    }
    if (cuisines.length === 0) {
        fetchCuisines();
    }
  }, [fetchCities, fetchCuisines, cities.length, cuisines.length]);

  // Derived State
  const selectedCity = useMemo(() => cities.find(c => c.id === cityId), [cities, cityId]);
  const hasActiveFilters = !!selectedCity || selectedHashtags.length > 0;

  // Handlers
  const handleCityClick = useCallback((id) => {
    // If clicking the already active city, deselect it. Otherwise, select the new one.
    setCityId(cityId === id ? null : id);
    // Neighborhood/Tag resets are handled within the setCityId action in the store
  }, [cityId, setCityId]);

  const handleHashtagClick = useCallback((hashtagName) => {
    // Toggle the presence of the hashtag name in the selectedHashtags array
    const newSelection = selectedHashtags.includes(hashtagName)
      ? selectedHashtags.filter(h => h !== hashtagName)
      : [...selectedHashtags, hashtagName];
    setHashtags(newSelection); // Update the store state
  }, [selectedHashtags, setHashtags]);

  const removeCityFilter = useCallback(() => {
    setCityId(null);
    // Store action should handle dependent filter resets
  }, [setCityId]);

  const removeHashtagFilter = useCallback((hashtagName) => {
    setHashtags(selectedHashtags.filter(h => h !== hashtagName)); // Update store state
  }, [selectedHashtags, setHashtags]);

  // --- Render ---
  return (
    <div className="space-y-3 mb-6 max-w-4xl mx-auto">

      {/* Section 1: Selected Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-gray-100 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-600 mr-1">Filters:</span>
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
          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs text-gray-500 hover:text-red-600 hover:underline font-medium px-2 py-1 flex items-center gap-1"
          > <RotateCcw size={12} /> Reset All </button>
        </div>
      )}

      {/* Section 2: City Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {cities.map(city => (
          <PillButton
            key={city.id} label={city.name} isActive={cityId === city.id}
            onClick={() => handleCityClick(city.id)}
            // className={cityId === city.id ? '!bg-blue-600 !border-blue-600' : ''} // Custom active style
          />
        ))}
         {cities.length === 0 && <span className="text-sm text-gray-400">Loading cities...</span>}
      </div>

      {/* Section 3: Hashtag/Cuisine Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {cuisines.map(cuisine => (
          <PillButton
            key={cuisine.id} label={cuisine.name} prefix="#"
            isActive={selectedHashtags.includes(cuisine.name)} // Check if cuisine name is in the selected array
            onClick={() => handleHashtagClick(cuisine.name)} // Pass cuisine name
            // className={selectedHashtags.includes(cuisine.name) ? '!bg-teal-600 !border-teal-600' : ''} // Custom active style
          />
        ))}
         {cuisines.length === 0 && <span className="text-sm text-gray-400">Loading filters...</span>}
      </div>
    </div>
  );
};

export default FilterSection;