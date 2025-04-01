// src/pages/Home/FilterSection.jsx (Removed setters from useCallback deps)
import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";
// Removed shallow - selecting individually

const FilterSection = () => {
  // --- Global state ---
  // Select state primitives and arrays individually
  const cityId = useAppStore(state => state.activeFilters.cityId);
  const neighborhoodId = useAppStore(state => state.activeFilters.neighborhoodId);
  const tags = useAppStore(state => state.activeFilters.tags) || [];
  const cities = useAppStore(state => state.cities);
  const neighborhoods = useAppStore(state => state.neighborhoods);
  const cuisines = useAppStore(state => state.cuisines);
  const isLoadingFilterOptions = useAppStore(state => state.isLoadingFilterOptions);
  // Select actions (stable references)
  const clearFilters = useAppStore(state => state.clearFilters);
  const toggleFilterTag = useAppStore(state => state.toggleFilterTag);
  const setFilter = useAppStore(state => state.setFilter);
  const fetchNeighborhoods = useAppStore(state => state.fetchNeighborhoods);


  // --- Effects ---
  // Fetch neighborhoods effect
  useEffect(() => {
    if (cityId) {
      console.log(`[FilterSection useEffect] City changed to ${cityId}, fetching neighborhoods.`);
      fetchNeighborhoods(cityId);
    }
  }, [cityId, fetchNeighborhoods]); // Dependencies should be stable


  // --- Filter Selection Handlers ---
  // ** CORRECTED: Removed stable setters (clearFilters, setFilter) from deps **
  const handleCitySelect = useCallback((selectedCityId) => {
    if (selectedCityId === cityId) {
        clearFilters();
    } else {
        setFilter('cityId', selectedCityId);
    }
  }, [cityId]); // Depends only on primitive cityId

  // ** CORRECTED: Removed stable setter (setFilter) from deps **
  const handleNeighborhoodSelect = useCallback((selectedHoodId) => {
     if (selectedHoodId === neighborhoodId) {
         setFilter('neighborhoodId', null);
     } else {
         setFilter('neighborhoodId', selectedHoodId);
     }
  }, [neighborhoodId]); // Depends only on primitive neighborhoodId

  // ** CORRECTED: Removed stable setter (toggleFilterTag) from deps **
  const handleCuisineSelect = useCallback((cuisineName) => {
     toggleFilterTag(cuisineName);
  }, []); // Action is stable, no need for it in deps

  // ** CORRECTED: Removed stable setter (clearFilters) from deps **
  const handleClearAll = useCallback(() => {
    clearFilters();
  }, []); // Action is stable, no need for it in deps

  // --- Helper to get names ---
  const getCityName = (id) => cities.find(c => c.id === id)?.name || `City ${id}`;
  const getNeighborhoodName = (id) => neighborhoods.find(n => n.id === id)?.name || `Neighborhood ${id}`;


  // --- Render Logic (remains the same) ---
  const renderFilterStep = () => {
    const isLoadingCities = isLoadingFilterOptions && cities.length === 0;
    const isLoadingNeighborhoods = isLoadingFilterOptions && cityId && neighborhoods.length === 0;
    const isLoadingCuisines = isLoadingFilterOptions && cuisines.length === 0;

    // Step 3: Select Cuisine/Tag
    if (cityId && neighborhoodId) {
      return (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">3. Select Cuisine/Tag(s):</p>
          {isLoadingCuisines ? <p className="text-xs text-gray-500">Loading cuisines...</p> : (
            <div className="flex flex-wrap gap-2">
              {cuisines.length > 0 ? cuisines.map((cuisine) => {
                 const isActive = tags.includes(cuisine.name);
                 return ( <button key={cuisine.id} onClick={() => handleCuisineSelect(cuisine.name)} className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${ isActive ? "border-[#D1B399] bg-[#D1B399] text-white ring-1 ring-[#b89e89]" : "border-gray-300 bg-white hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"}`} aria-pressed={isActive} > {cuisine.name} </button> );
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
           {isLoadingNeighborhoods ? <p className="text-xs text-gray-500">Loading neighborhoods...</p> : (
             <div className="flex flex-wrap gap-2">
                {neighborhoods.length > 0 ? neighborhoods.map((hood) => {
                    const isActive = neighborhoodId === hood.id;
                    return ( <button key={hood.id} onClick={() => handleNeighborhoodSelect(hood.id)} className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${ isActive ? "border-[#D1B399] bg-[#D1B399] text-white ring-1 ring-[#b89e89]" : "border-gray-300 bg-white hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"}`} aria-pressed={isActive} > {hood.name} </button> );
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
           {isLoadingCities ? <p className="text-xs text-gray-500">Loading cities...</p> : (
              <div className="flex flex-wrap gap-2">
                {cities.length > 0 ? cities.map((city) => {
                    const isActive = cityId === city.id;
                    return ( <button key={city.id} onClick={() => handleCitySelect(city.id)} className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${ isActive ? "border-[#D1B399] bg-[#D1B399] text-white ring-1 ring-[#b89e89]" : "border-gray-300 bg-white hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"}`} aria-pressed={isActive} > {city.name} </button> );
                   }) : <p className="text-xs text-gray-500">No cities found.</p>}
              </div>
           )}
         </div>
       );
    }
  };

   const hasActiveFilter = cityId || neighborhoodId || tags.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <h3 className="font-medium text-gray-800">Filter Results</h3>
        {hasActiveFilter && ( <button onClick={handleClearAll} className="text-xs text-[#D1B399] hover:text-[#b89e89] font-medium"> Clear All Filters </button> )}
      </div>

       {/* Active Filter Pills */}
       {hasActiveFilter && (
           <div className="flex flex-wrap gap-2 mb-4 items-center min-h-[26px]">
             <span className="text-sm font-medium text-gray-500 mr-1">Active:</span>
             {cityId && ( <span className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center"> {getCityName(cityId)} <button onClick={() => handleCitySelect(null)} className="ml-1.5 opacity-70 hover:opacity-100 focus:outline-none" aria-label={`Remove city filter ${getCityName(cityId)}`}> <X size={12} /> </button> </span> )}
             {neighborhoodId && ( <span className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center"> {getNeighborhoodName(neighborhoodId)} <button onClick={() => handleNeighborhoodSelect(null)} className="ml-1.5 opacity-70 hover:opacity-100 focus:outline-none" aria-label={`Remove neighborhood filter ${getNeighborhoodName(neighborhoodId)}`}> <X size={12} /> </button> </span> )}
             {tags?.map(tag => ( <span key={tag} className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center"> {tag} <button onClick={() => toggleFilterTag(tag)} className="ml-1.5 opacity-70 hover:opacity-100 focus:outline-none" aria-label={`Remove tag filter ${tag}`}> <X size={12} /> </button> </span> ))}
           </div>
       )}

      {/* Filter Steps */}
      <div className="mt-2">
        {renderFilterStep()}
      </div>

      {/* Note */}
      <p className="text-xs text-gray-400 mt-4">Note: Filtering relies on backend APIs.</p>
    </div>
  );
};

export default FilterSection;