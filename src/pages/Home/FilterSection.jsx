// src/pages/Home/FilterSection.jsx
import React, { useEffect, useCallback } from "react";
import { X, Loader2 } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";
import Button from "@/components/Button";

const FilterSection = () => {
  // --- Global state (using individual selectors) ---
  const cityId = useAppStore(state => state.activeFilters.cityId);
  const neighborhoodId = useAppStore(state => state.activeFilters.neighborhoodId);
  const tags = useAppStore(state => state.activeFilters.tags) || [];
  const cities = useAppStore(state => state.cities) || [];
  const neighborhoods = useAppStore(state => state.neighborhoods) || [];
  const cuisines = useAppStore(state => state.cuisines) || [];
  const isLoadingCities = useAppStore(state => state.isLoadingFilterOptions && state.cities.length === 0);
  const isLoadingNeighborhoods = useAppStore(state => state.isLoadingFilterOptions && !!state.activeFilters.cityId && state.neighborhoods.length === 0);
  const isLoadingCuisines = useAppStore(state => state.isLoadingFilterOptions && state.cuisines.length === 0);
  const clearFilters = useAppStore(state => state.clearFilters);
  const toggleFilterTag = useAppStore(state => state.toggleFilterTag);
  const setFilter = useAppStore(state => state.setFilter);
  const fetchNeighborhoods = useAppStore(state => state.fetchNeighborhoods);
  const initializeApp = useAppStore(state => state.initializeApp);
  const initializationError = useAppStore(state => state.initializationError);

  // --- Effects ---
  useEffect(() => {
    if (cityId) {
      console.log(`[FilterSection useEffect] City changed to ${cityId}, fetching neighborhoods.`);
      fetchNeighborhoods(cityId);
    } else {
      console.log("[FilterSection useEffect] City cleared, skipping neighborhood fetch.");
    }
  }, [cityId, fetchNeighborhoods]);

  // --- Filter Selection Handlers ---
  const handleCitySelect = useCallback((selectedCityId) => {
    // If clicking the already selected city, clear all filters
    if (selectedCityId === cityId) {
      console.log("[FilterSection] Clearing filters because selected city clicked again.");
      clearFilters();
    } else {
      console.log(`[FilterSection] Setting city filter to: ${selectedCityId}`);
      setFilter('cityId', selectedCityId);
      // Clear neighborhood and tags when selecting a new city
      setFilter('neighborhoodId', null);
      setFilter('tags', []);
    }
  }, [cityId, setFilter, clearFilters]);

  const handleNeighborhoodSelect = useCallback((selectedHoodId) => {
    // If clicking the already selected neighborhood, clear only neighborhood and tags
    if (selectedHoodId === neighborhoodId) {
      console.log("[FilterSection] Clearing neighborhood and tag filters.");
      setFilter('neighborhoodId', null);
      setFilter('tags', []);
    } else {
      console.log(`[FilterSection] Setting neighborhood filter to: ${selectedHoodId}`);
      setFilter('neighborhoodId', selectedHoodId);
      // Clear tags when selecting a new neighborhood
      setFilter('tags', []);
    }
  }, [neighborhoodId, setFilter]);

  const handleCuisineSelect = useCallback((cuisineName) => {
    console.log(`[FilterSection] Toggling tag filter: ${cuisineName}`);
    toggleFilterTag(cuisineName);
  }, [toggleFilterTag]);

  const handleClearAll = useCallback(() => {
    console.log("[FilterSection] Clearing all filters via button.");
    clearFilters();
  }, [clearFilters]);

  // --- Helper to get names ---
  const getCityName = useCallback((id) => {
    return cities.find(c => c.id === id)?.name || `City ${id}`;
  }, [cities]);

  const getNeighborhoodName = useCallback((id) => {
    return neighborhoods.find(n => n.id === id)?.name || `Neighborhood ${id}`;
  }, [neighborhoods]);

  // --- Render Logic ---
  if (initializationError && cities.length === 0 && cuisines.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-red-300 shadow-sm overflow-hidden mb-8 p-4 text-center">
        <p className="text-red-600 mb-4">Error loading filter options: {initializationError}</p>
        <Button onClick={() => initializeApp()} variant="primary" size="sm">Retry Load</Button>
      </div>
    );
  }

  // Determine which step to show
  const renderFilterStep = () => {
    // Step 3: Select Cuisine/Tag
    if (cityId && neighborhoodId) {
      return (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">3. Select Cuisine/Tag(s):</p>
          {isLoadingCuisines ? (
            <div className="flex items-center text-xs text-gray-500">
              <Loader2 size={14} className="animate-spin mr-1"/> Loading cuisines...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cuisines.length > 0 ? cuisines.map((cuisine) => {
                const isActive = tags.includes(cuisine.name);
                return (
                  <button
                    key={cuisine.id ?? cuisine.name}
                    onClick={() => handleCuisineSelect(cuisine.name)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                      isActive
                        ? "border-[#D1B399] bg-[#D1B399] text-white ring-1 ring-[#b89e89]"
                        : "border-gray-300 bg-white hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"
                    }`}
                    aria-pressed={isActive}
                  >
                    {cuisine.name}
                  </button>
                );
              }) : <p className="text-xs text-gray-500">No cuisines/tags found.</p>}
            </div>
          )}
        </div>
      );
    }
    // Step 2: Select Neighborhood
    else if (cityId) {
      return (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">2. Select Neighborhood:</p>
          {isLoadingNeighborhoods ? (
            <div className="flex items-center text-xs text-gray-500">
              <Loader2 size={14} className="animate-spin mr-1"/> Loading neighborhoods...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {neighborhoods.length > 0 ? neighborhoods.map((hood) => {
                const isActive = neighborhoodId === hood.id;
                return (
                  <button
                    key={hood.id ?? hood.name}
                    onClick={() => handleNeighborhoodSelect(hood.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                      isActive
                        ? "border-[#D1B399] bg-[#D1B399] text-white ring-1 ring-[#b89e89]"
                        : "border-gray-300 bg-white hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"
                    }`}
                    aria-pressed={isActive}
                  >
                    {hood.name}
                  </button>
                );
              }) : <p className="text-xs text-gray-500">No neighborhoods available for this city.</p>}
            </div>
          )}
        </div>
      );
    }
    // Step 1: Select City
    else {
      return (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">1. Select City:</p>
          {isLoadingCities ? (
            <div className="flex items-center text-xs text-gray-500">
              <Loader2 size={14} className="animate-spin mr-1"/> Loading cities...
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cities.length > 0 ? (
                cities.map((city) => {
                  const isActive = cityId === city.id;
                  return (
                    <button
                      key={city.id ?? city.name}
                      onClick={() => handleCitySelect(city.id)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                        isActive
                          ? "border-[#D1B399] bg-[#D1B399] text-white ring-1 ring-[#b89e89]"
                          : "border-gray-300 bg-white hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"
                      }`}
                      aria-pressed={isActive}
                    >
                      {city.name}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500">No cities found.</p>
              )}
            </div>
          )}
        </div>
      );
    }
  };

  const hasActiveFilter = cityId || neighborhoodId || tags.length > 0;

  // --- Component Return ---
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8 p-4">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <h3 className="font-medium text-gray-800">Filter Results</h3>
        {hasActiveFilter && (
          <button
            onClick={handleClearAll}
            className="text-xs text-[#D1B399] hover:text-[#b89e89] font-medium flex items-center"
          >
            <X size={12} className="mr-1"/> Clear All Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilter && (
        <div className="flex flex-wrap gap-2 mb-4 items-center min-h-[26px]">
          <span className="text-sm font-medium text-gray-500 mr-1">Active:</span>
          {cityId && (
            <span className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center">
              {getCityName(cityId)}
              <button
                onClick={() => handleCitySelect(cityId)}
                className="ml-1.5 opacity-70 hover:opacity-100 focus:outline-none"
                aria-label={`Remove city filter ${getCityName(cityId)}`}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {neighborhoodId && (
            <span className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center">
              {getNeighborhoodName(neighborhoodId)}
              <button
                onClick={() => handleNeighborhoodSelect(neighborhoodId)}
                className="ml-1.5 opacity-70 hover:opacity-100 focus:outline-none"
                aria-label={`Remove neighborhood filter ${getNeighborhoodName(neighborhoodId)}`}
              >
                <X size={12} />
              </button>
            </span>
          )}
          {tags?.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center"
            >
              #{tag}
              <button
                onClick={() => handleCuisineSelect(tag)}
                className="ml-1.5 opacity-70 hover:opacity-100 focus:outline-none"
                aria-label={`Remove tag filter ${tag}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter Selection Steps */}
      <div className="mt-2">
        {renderFilterStep()}
      </div>
    </div>
  );
};

export default FilterSection;