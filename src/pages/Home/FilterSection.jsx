// src/pages/Home/FilterSection.jsx (Corrected placeholders - FINAL)
import React, { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";

const FilterSection = () => {
  // --- Global state ---
  const cityId = useAppStore(state => state.activeFilters.cityId);
  const neighborhoodId = useAppStore(state => state.activeFilters.neighborhoodId);
  const tags = useAppStore(state => state.activeFilters.tags) || [];
  const cities = useAppStore(state => state.cities) || []; // Default
  const neighborhoods = useAppStore(state => state.neighborhoods) || []; // Default
  const cuisines = useAppStore(state => state.cuisines) || []; // Default
  const isLoadingFilterOptions = useAppStore(state => state.isLoadingFilterOptions);
  const clearFilters = useAppStore(state => state.clearFilters);
  const toggleFilterTag = useAppStore(state => state.toggleFilterTag);
  const setFilter = useAppStore(state => state.setFilter);
  const fetchNeighborhoods = useAppStore(state => state.fetchNeighborhoods);

  // --- Effects ---
  useEffect(() => {
    if (cityId) {
      fetchNeighborhoods(cityId);
    }
  }, [cityId, fetchNeighborhoods]);


  // --- Filter Selection Handlers ---
  const handleCitySelect = useCallback((selectedCityId) => {
    if (selectedCityId === cityId) { clearFilters(); }
    else { setFilter('cityId', selectedCityId); }
  }, [cityId]);

  const handleNeighborhoodSelect = useCallback((selectedHoodId) => {
     if (selectedHoodId === neighborhoodId) { setFilter('neighborhoodId', null); }
     else { setFilter('neighborhoodId', selectedHoodId); }
  }, [neighborhoodId]);

  const handleCuisineSelect = useCallback((cuisineName) => {
     toggleFilterTag(cuisineName);
  }, []);

  const handleClearAll = useCallback(() => {
    clearFilters();
  }, []);

  // --- Helper to get names ---
  const getCityName = (id) => cities.find(c => c.id === id)?.name || `City ${id}`;
  const getNeighborhoodName = (id) => neighborhoods.find(n => n.id === id)?.name || `Neighborhood ${id}`;


  // --- Render Logic (Restored ALL JSX) ---
  const renderFilterStep = () => {
    const currentCityId = cityId;
    const currentHoodId = neighborhoodId;
    const currentTags = tags;
    const safeCities = cities; // Already defaulted above
    const safeNeighborhoods = neighborhoods; // Already defaulted above
    const safeCuisines = cuisines; // Already defaulted above
    const isLoadingCities = isLoadingFilterOptions && safeCities.length === 0;
    const isLoadingNeighborhoods = isLoadingFilterOptions && currentCityId && safeNeighborhoods.length === 0;
    const isLoadingCuisines = isLoadingFilterOptions && safeCuisines.length === 0;

    // Step 3: Select Cuisine/Tag
    if (currentCityId && currentHoodId) {
      return ( // *** JSX for Step 3 ***
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">3. Select Cuisine/Tag(s):</p>
          {isLoadingCuisines ? <p className="text-xs text-gray-500">Loading cuisines...</p> : (
            <div className="flex flex-wrap gap-2">
              {safeCuisines.length > 0 ? safeCuisines.map((cuisine) => {
                 const isActive = currentTags.includes(cuisine.name);
                 return ( <button key={cuisine.id} onClick={() => handleCuisineSelect(cuisine.name)} className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${ isActive ? "border-[#D1B399] bg-[#D1B399] text-white ring-1 ring-[#b89e89]" : "border-gray-300 bg-white hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"}`} aria-pressed={isActive} > {cuisine.name} </button> );
                }) : <p className="text-xs text-gray-500">No cuisines/tags found.</p>}
            </div>
          )}
        </div>
      );
    }
    // Step 2: Select Neighborhood
    else if (currentCityId) {
       return ( // *** JSX for Step 2 ***
        <div>
           <p className="text-sm font-medium text-gray-700 mb-2">2. Select Neighborhood:</p>
           {isLoadingNeighborhoods ? <p className="text-xs text-gray-500">Loading neighborhoods...</p> : (
             <div className="flex flex-wrap gap-2">
                {safeNeighborhoods.length > 0 ? safeNeighborhoods.map((hood) => {
                    const isActive = currentHoodId === hood.id;
                    return ( <button key={hood.id} onClick={() => handleNeighborhoodSelect(hood.id)} className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${ isActive ? "border-[#D1B399] bg-[#D1B399] text-white ring-1 ring-[#b89e89]" : "border-gray-300 bg-white hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"}`} aria-pressed={isActive} > {hood.name} </button> );
                   }) : <p className="text-xs text-gray-500">No neighborhoods available for this city.</p>}
             </div>
            )}
         </div>
       );
    }
    // Step 1: Select City
    else {
       return ( // *** JSX for Step 1 ***
         <div>
           <p className="text-sm font-medium text-gray-700 mb-2">1. Select City:</p>
           {isLoadingCities ? <p className="text-xs text-gray-500">Loading cities...</p> : (
              <div className="flex flex-wrap gap-2">
                {safeCities.length > 0 ? (
                    safeCities.map((city) => {
                        const isActive = currentCityId === city.id;
                        return ( <button key={city.id} onClick={() => handleCitySelect(city.id)} className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${ isActive ? "border-[#D1B399] bg-[#D1B399] text-white ring-1 ring-[#b89e89]" : "border-gray-300 bg-white hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"}`} aria-pressed={isActive} > {city.name} </button> );
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
      <div className="flex items-center justify-between mb-3 border-b pb-2"> <h3 className="font-medium text-gray-800">Filter Results</h3> {hasActiveFilter && ( <button onClick={handleClearAll} className="text-xs text-[#D1B399] hover:text-[#b89e89] font-medium"> Clear All Filters </button> )} </div>
       {hasActiveFilter && ( <div className="flex flex-wrap gap-2 mb-4 items-center min-h-[26px]"> <span className="text-sm font-medium text-gray-500 mr-1">Active:</span> {cityId && ( <span className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center"> {getCityName(cityId)} <button onClick={() => handleCitySelect(null)} className="ml-1.5 opacity-70 hover:opacity-100 focus:outline-none" aria-label={`Remove city filter ${getCityName(cityId)}`}> <X size={12} /> </button> </span> )} {neighborhoodId && ( <span className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center"> {getNeighborhoodName(neighborhoodId)} <button onClick={() => handleNeighborhoodSelect(null)} className="ml-1.5 opacity-70 hover:opacity-100 focus:outline-none" aria-label={`Remove neighborhood filter ${getNeighborhoodName(neighborhoodId)}`}> <X size={12} /> </button> </span> )} {tags?.map(tag => ( <span key={tag} className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center"> {tag} <button onClick={() => toggleFilterTag(tag)} className="ml-1.5 opacity-70 hover:opacity-100 focus:outline-none" aria-label={`Remove tag filter ${tag}`}> <X size={12} /> </button> </span> ))} </div> )}
      <div className="mt-2"> {renderFilterStep()} </div>
      <p className="text-xs text-gray-400 mt-4">Note: Filtering relies on backend APIs.</p>
    </div>
   );
};

export default FilterSection;