/* src/components/FilterSection.jsx */
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { X, MapPin, Tag, RotateCcw, Search, Loader2 } from 'lucide-react';
// Corrected: Use named import
import { useUIStateStore } from '@/stores/useUIStateStore';
import PillButton from '@/components/UI/PillButton';

const FilterSection = () => {
  // --- State from Zustand Store ---
  // Use the imported hook correctly
  const cities = useUIStateStore(state => state.cities || []);
  const neighborhoods = useUIStateStore(state => state.neighborhoods || []);
  const cuisines = useUIStateStore(state => state.cuisines || []);
  const cityId = useUIStateStore(state => state.cityId);
  const neighborhoodId = useUIStateStore(state => state.neighborhoodId);
  const selectedHashtags = useUIStateStore(state => state.hashtags || []);
  const isLoadingCities = useUIStateStore(state => state.isLoadingCities);
  const isLoadingNeighborhoods = useUIStateStore(state => state.isLoadingNeighborhoods);
  const isLoadingCuisines = useUIStateStore(state => state.isLoadingCuisines);
  const fetchCities = useUIStateStore(state => state.fetchCities);
  const fetchCuisines = useUIStateStore(state => state.fetchCuisines);
  const fetchNeighborhoods = useUIStateStore(state => state.fetchNeighborhoods); // Use store action
  const setCityId = useUIStateStore(state => state.setCityId);
  const setNeighborhoodId = useUIStateStore(state => state.setNeighborhoodId);
  const setHashtags = useUIStateStore(state => state.setHashtags);
  const clearAllFilters = useUIStateStore(state => state.clearAllFilters);

  // --- Local UI State ---
  const [hashtagSearch, setHashtagSearch] = useState('');
  const [filteredCuisines, setFilteredCuisines] = useState([]); // Initialize as empty

  // --- Effects ---

  // Initial fetch for cities and cuisines
  useEffect(() => {
    // Fetch only if data is not present and not already loading
    if (cities.length === 0 && !isLoadingCities) {
      fetchCities();
    }
    if (cuisines.length === 0 && !isLoadingCuisines) {
      fetchCuisines();
    }
    // Dependencies ensure this runs only when necessary
  }, [fetchCities, fetchCuisines, cities.length, cuisines.length, isLoadingCities, isLoadingCuisines]);

  // Fetch neighborhoods when cityId changes
  useEffect(() => {
    const cityIdInt = parseInt(cityId, 10);
    if (!isNaN(cityIdInt) && cityIdInt > 0) {
      // Only call fetchNeighborhoods if cityId is valid
      // The action inside the store should ideally prevent redundant calls if the ID hasn't changed
      fetchNeighborhoods(cityIdInt);
    } else {
      // Clear neighborhoods in the store if cityId is cleared or invalid
      // Check current state to avoid unnecessary update
      if (useUIStateStore.getState().neighborhoods.length > 0) {
         useUIStateStore.setState({ neighborhoods: [] });
      }
    }
    // This effect should run *only* when cityId changes.
    // fetchNeighborhoods function reference is stable due to Zustand.
  }, [cityId, fetchNeighborhoods]);

  // Filter cuisines based on local search input
  useEffect(() => {
    const searchLower = hashtagSearch.trim().toLowerCase();
    if (searchLower === '') {
      setFilteredCuisines(cuisines); // Show all if search is empty
    } else {
      setFilteredCuisines(
        (cuisines || []).filter(cuisine => // Add safeguard for cuisines potentially being null/undefined initially
          cuisine?.name?.toLowerCase().includes(searchLower)
        )
      );
    }
    // This effect runs when the search term or the main cuisines list changes.
  }, [hashtagSearch, cuisines]);

  // --- Memoized Values ---

  const selectedCity = useMemo(() => {
    // Ensure cityId is treated as a number for comparison
    const currentCityId = parseInt(cityId, 10);
    return (cities || []).find(c => c.id === currentCityId);
  }, [cities, cityId]);

  const selectedNeighborhood = useMemo(() => {
    // Ensure neighborhoodId is treated as a number for comparison
    const currentNeighborhoodId = parseInt(neighborhoodId, 10);
    return (neighborhoods || []).find(n => n.id === currentNeighborhoodId);
  }, [neighborhoods, neighborhoodId]);

  const hasActiveFilters = useMemo(() => {
      // Check against null/undefined and length for arrays
      return !!cityId || !!neighborhoodId || (selectedHashtags && selectedHashtags.length > 0);
  }, [cityId, neighborhoodId, selectedHashtags]);


  // --- Event Handlers (Callbacks) ---

  const handleCityClick = useCallback((id) => {
    const idInt = parseInt(id, 10);
    // Use functional update form of setCityId if it depends on previous state
    const currentCityId = useUIStateStore.getState().cityId;
    const nextCityId = currentCityId === idInt ? null : idInt;
    setCityId(nextCityId); // setCityId action in store handles clearing neighborhoodId
  }, [setCityId]); // Dependency is stable

  const handleNeighborhoodClick = useCallback((id) => {
    const idInt = parseInt(id, 10);
    // Use functional update form if needed
    const currentNeighborhoodId = useUIStateStore.getState().neighborhoodId;
    const nextNeighborhoodId = currentNeighborhoodId === idInt ? null : idInt;
    setNeighborhoodId(nextNeighborhoodId);
  }, [setNeighborhoodId]); // Dependency is stable

  const handleHashtagClick = useCallback((hashtagName) => {
    // Ensure selectedHashtags is always an array before operating
    const currentHashtags = useUIStateStore.getState().hashtags || [];
    const newSelection = currentHashtags.includes(hashtagName)
      ? currentHashtags.filter(h => h !== hashtagName)
      : [...currentHashtags, hashtagName];
    setHashtags(newSelection);
  }, [setHashtags]); // Dependency is stable

  const removeCityFilter = useCallback(() => {
    setCityId(null); // Triggers clearing neighborhoods via useEffect
  }, [setCityId]); // Dependency is stable

  const removeNeighborhoodFilter = useCallback(() => {
    setNeighborhoodId(null);
  }, [setNeighborhoodId]); // Dependency is stable

  const removeHashtagFilter = useCallback((hashtagName) => {
    // Ensure selectedHashtags is always an array
    const currentHashtags = useUIStateStore.getState().hashtags || [];
    setHashtags(currentHashtags.filter(h => h !== hashtagName));
  }, [setHashtags]); // Dependency is stable

  const handleClearAllFilters = useCallback(() => {
    clearAllFilters();
    setHashtagSearch(''); // Also clear local search state
  }, [clearAllFilters]);

  const handleHashtagSearchChange = (e) => {
    setHashtagSearch(e.target.value);
  };

  // --- Render Logic ---

  return (
    <div className="space-y-4 mb-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-gray-700 mr-2">Filters:</span>
          {selectedCity && (
            <span className="inline-flex items-center pl-2.5 pr-1 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <MapPin size={14} className="mr-1 text-blue-600" />
              {selectedCity.name}
              <button
                type="button"
                onClick={removeCityFilter}
                className="ml-1.5 p-0.5 text-blue-500 hover:text-blue-700 hover:bg-blue-200 rounded-full focus:outline-none focus:bg-blue-200 focus:ring-1 focus:ring-blue-400"
                aria-label={`Remove city filter ${selectedCity.name}`}
              >
                <X size={14} />
              </button>
            </span>
          )}
          {selectedNeighborhood && (
            <span className="inline-flex items-center pl-2.5 pr-1 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
              <MapPin size={14} className="mr-1 text-indigo-600" />
              {selectedNeighborhood.name}
              <button
                type="button"
                onClick={removeNeighborhoodFilter}
                 className="ml-1.5 p-0.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-200 rounded-full focus:outline-none focus:bg-indigo-200 focus:ring-1 focus:ring-indigo-400"
                aria-label={`Remove neighborhood filter ${selectedNeighborhood.name}`}
              >
                <X size={14} />
              </button>
            </span>
          )}
          {(selectedHashtags || []).map(hashtag => ( // Safeguard array access
            <span
              key={hashtag}
              className="inline-flex items-center pl-2.5 pr-1 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800 border border-teal-200"
            >
              <Tag size={14} className="mr-1 text-teal-600" />
              {hashtag}
              <button
                type="button"
                onClick={() => removeHashtagFilter(hashtag)}
                className="ml-1.5 p-0.5 text-teal-500 hover:text-teal-700 hover:bg-teal-200 rounded-full focus:outline-none focus:bg-teal-200 focus:ring-1 focus:ring-teal-400"
                aria-label={`Remove hashtag filter ${hashtag}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          <button
            onClick={handleClearAllFilters} // Use updated handler
            className="ml-auto text-xs text-gray-500 hover:text-red-600 hover:underline font-medium px-2 py-1 flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-red-400 rounded"
            aria-label="Reset all filters"
          >
            <RotateCcw size={12} />
            Reset All
          </button>
        </div>
      )}

      {/* City/Neighborhood Selection */}
      <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
        {!cityId ? ( // Show Cities if none selected
          isLoadingCities ? (
            <span className="text-sm text-gray-400 flex items-center"> <Loader2 className='animate-spin mr-1' size={14}/> Loading cities...</span>
          ) : (cities && cities.length > 0) ? ( // Check if cities array has items
            cities.map(city => (
              <PillButton
                key={`city-${city.id}`}
                label={city.name}
                isActive={false} // cityId is null here
                onClick={() => handleCityClick(city.id)}
              />
            ))
          ) : (
            <span className="text-sm text-gray-500 italic">No cities available.</span>
          )
        ) : ( // Show Neighborhoods if a city is selected
          isLoadingNeighborhoods ? (
             <span className="text-sm text-gray-400 flex items-center"> <Loader2 className='animate-spin mr-1' size={14}/> Loading neighborhoods...</span>
          ) : (neighborhoods && neighborhoods.length > 0) ? ( // Check if neighborhoods array has items
            neighborhoods.map(neighborhood => (
              <PillButton
                key={`neigh-${neighborhood.id}`}
                label={neighborhood.name}
                isActive={neighborhoodId === neighborhood.id}
                onClick={() => handleNeighborhoodClick(neighborhood.id)}
              />
            ))
          ) : (
            <span className="text-sm text-gray-500 italic">No neighborhoods listed for {selectedCity?.name}.</span>
          )
        )}
      </div>

      {/* Hashtag Selection */}
      <div className="flex flex-col gap-3 pt-2"> {/* Increased gap */}
        {/* Hashtag Search Input */}
        <div className="relative max-w-xs">
          <label htmlFor="hashtag-search-input" className="sr-only">Search Cuisines/Tags</label> {/* Added label */}
          <input
            id="hashtag-search-input" // Added id
            type="search"
            value={hashtagSearch}
            onChange={handleHashtagSearchChange}
            placeholder="Search cuisines/tags..."
            className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] text-sm"
            aria-label="Search hashtags"
          />
          <Search size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {/* Hashtag Pills */}
        <div className="flex flex-wrap items-center gap-2 min-h-[36px]">
          {isLoadingCuisines ? (
             <span className="text-sm text-gray-400 flex items-center"> <Loader2 className='animate-spin mr-1' size={14}/> Loading tags...</span>
          ) : (filteredCuisines && filteredCuisines.length > 0) ? ( // Check if filteredCuisines has items
            filteredCuisines.map(cuisine => (
              <PillButton
                // Use cuisine.name for key if IDs might not be unique across different filter types
                key={`cuisine-${cuisine.name}`}
                label={cuisine.name}
                prefix="#"
                isActive={(selectedHashtags || []).includes(cuisine.name)} // Safeguard array access
                onClick={() => handleHashtagClick(cuisine.name)}
              />
            ))
          ) : (cuisines && cuisines.length === 0) ? ( // Check if original cuisines list was empty
             <span className="text-sm text-gray-500 italic">No tags available.</span>
          ) : ( // Only show 'no matches' if search is active and filtered list is empty
             hashtagSearch.trim() !== '' && <span className="text-sm text-gray-500 italic">No tags match '{hashtagSearch}'.</span>
          )
         }
        </div>
      </div>
    </div>
  );
};

export default FilterSection;