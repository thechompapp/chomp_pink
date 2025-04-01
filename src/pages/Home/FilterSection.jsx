// src/pages/Home/FilterSection.jsx
import React, { useState, useEffect, useCallback } from "react"; // Added useState, useEffect
import { X } from "lucide-react";
import useAppStore from "@/hooks/useAppStore";
import { shallow } from 'zustand/shallow';
import { API_BASE_URL } from "@/config"; // Import API base URL

const FilterSection = () => {
  // Global state
  const activeFilters = useAppStore( state => state.activeFilters || { cityId: null, neighborhoodId: null, cuisine: null }, shallow );
  const updateFilters = useAppStore((state) => state.updateFilters);
  const clearFilters = useAppStore((state) => state.clearFilters);

  // Local state for fetched filter options
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
  const [isLoadingCuisines, setIsLoadingCuisines] = useState(false);

  // Fetch initial filter data (Cities, Cuisines)
  useEffect(() => {
    // Fetch Cities
    setIsLoadingCities(true);
    fetch(`${API_BASE_URL}/api/cities`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch cities'))
      .then(data => setCities(data || []))
      .catch(err => console.error("Error fetching cities:", err))
      .finally(() => setIsLoadingCities(false));

    // Fetch Cuisines
    setIsLoadingCuisines(true);
    fetch(`${API_BASE_URL}/api/cuisines`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch cuisines'))
      .then(data => setCuisines(data || []))
      .catch(err => console.error("Error fetching cuisines:", err))
      .finally(() => setIsLoadingCuisines(false));
  }, []); // Run once on mount

  // Fetch neighborhoods when city changes
  useEffect(() => {
    if (activeFilters.cityId) {
      setIsLoadingNeighborhoods(true);
      setNeighborhoods([]); // Clear previous neighborhoods
      fetch(`${API_BASE_URL}/api/neighborhoods?cityId=${activeFilters.cityId}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch neighborhoods'))
        .then(data => setNeighborhoods(data || []))
        .catch(err => console.error(`Error fetching neighborhoods for city ${activeFilters.cityId}:`, err))
        .finally(() => setIsLoadingNeighborhoods(false));
    } else {
      setNeighborhoods([]); // Clear neighborhoods if no city selected
    }
  }, [activeFilters.cityId]); // Run when cityId changes

  // --- Filter Selection Handlers ---
  const handleCitySelect = useCallback((cityId) => {
    const newCityId = cityId === activeFilters.cityId ? null : cityId;
    updateFilters({ cityId: newCityId, neighborhoodId: null, cuisine: null }); // Reset lower levels
  }, [activeFilters.cityId, updateFilters]);

  const handleNeighborhoodSelect = useCallback((neighborhoodId) => {
    const newNeighborhoodId = neighborhoodId === activeFilters.neighborhoodId ? null : neighborhoodId;
    updateFilters({ neighborhoodId: newNeighborhoodId, cuisine: null }); // Reset cuisine
  }, [activeFilters.neighborhoodId, updateFilters]);

  const handleCuisineSelect = useCallback((cuisineName) => { // Assuming we filter by name for now
    const newCuisine = cuisineName === activeFilters.cuisine ? null : cuisineName;
    updateFilters({ cuisine: newCuisine });
  }, [activeFilters.cuisine, updateFilters]);

  const handleClearAll = useCallback(() => {
    clearFilters(); // Clears cityId, neighborhoodId, cuisine in store
  }, [clearFilters]);

  // --- Helper to get names for display ---
  const getCityName = (id) => cities.find(c => c.id === id)?.name || `City ${id}`;
  const getNeighborhoodName = (id) => neighborhoods.find(n => n.id === id)?.name || `Hood ${id}`;

  // --- Render Logic ---
  const renderFilterStep = () => {
    // Step 3: Select Cuisine (if neighborhood selected)
    if (activeFilters.neighborhoodId) {
      return (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">3. Select Cuisine:</p>
          {isLoadingCuisines ? <p className="text-xs text-gray-500">Loading cuisines...</p> : (
            <div className="flex flex-wrap gap-2">
              {cuisines.length > 0 ? cuisines.map((cuisine) => (
                <button
                  key={cuisine.id}
                  onClick={() => handleCuisineSelect(cuisine.name)} // Select by name for now
                  className={`px-3 py-1 rounded-full text-sm border ${
                    activeFilters.cuisine === cuisine.name
                      ? "border-[#D1B399] bg-[#D1B399] text-white"
                      : "border-gray-300 hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"
                  } transition-colors`}
                >
                  {cuisine.name}
                </button>
              )) : <p className="text-xs text-gray-500">No cuisines found.</p>}
            </div>
          )}
        </div>
      );
    }
    // Step 2: Select Neighborhood (if city selected)
    else if (activeFilters.cityId) {
       return (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">2. Select Neighborhood:</p>
          {isLoadingNeighborhoods ? <p className="text-xs text-gray-500">Loading neighborhoods...</p> : (
            <div className="flex flex-wrap gap-2">
               {neighborhoods.length > 0 ? neighborhoods.map((hood) => (
                <button
                  key={hood.id}
                  onClick={() => handleNeighborhoodSelect(hood.id)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    activeFilters.neighborhoodId === hood.id
                      ? "border-[#D1B399] bg-[#D1B399] text-white"
                      : "border-gray-300 hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"
                  } transition-colors`}
                >
                  {hood.name}
                </button>
              )) : <p className="text-xs text-gray-500">No neighborhoods found for this city.</p>}
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
               {cities.length > 0 ? cities.map((city) => (
                 <button
                   key={city.id}
                   onClick={() => handleCitySelect(city.id)}
                   className={`px-3 py-1 rounded-full text-sm border ${
                     activeFilters.cityId === city.id
                       ? "border-[#D1B399] bg-[#D1B399] text-white"
                       : "border-gray-300 hover:border-[#D1B399] hover:text-[#6e5a4c] text-gray-700"
                   } transition-colors`}
                 >
                   {city.name}
                 </button>
               )) : <p className="text-xs text-gray-500">No cities found.</p>}
             </div>
          )}
        </div>
      );
    }
  };

   const hasActiveFilter = activeFilters.cityId || activeFilters.neighborhoodId || activeFilters.cuisine;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8 p-4">
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <h3 className="font-medium text-gray-800">Filter Results</h3>
        {hasActiveFilter && (
          <button onClick={handleClearAll} className="text-xs text-[#D1B399] hover:text-[#b89e89] font-medium"> Clear All Filters </button>
        )}
      </div>

       {/* Display active filters */}
       {hasActiveFilter && (
           <div className="flex flex-wrap gap-2 mb-4 items-center">
             <span className="text-sm font-medium text-gray-500 mr-1">Active:</span>
             {activeFilters.cityId && (
               <span className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center">
                 {getCityName(activeFilters.cityId)}
                 <button onClick={() => handleCitySelect(activeFilters.cityId)} className="ml-1 opacity-70 hover:opacity-100"> <X size={12} /> </button>
               </span>
             )}
             {activeFilters.neighborhoodId && (
               <span className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center">
                 {getNeighborhoodName(activeFilters.neighborhoodId)}
                  <button onClick={() => handleNeighborhoodSelect(activeFilters.neighborhoodId)} className="ml-1 opacity-70 hover:opacity-100"> <X size={12} /> </button>
               </span>
             )}
             {activeFilters.cuisine && (
               <span className="px-2 py-0.5 text-xs rounded-full border border-[#D1B399] bg-[#D1B399]/10 text-[#6e5a4c] flex items-center">
                 {activeFilters.cuisine}
                 <button onClick={() => handleCuisineSelect(activeFilters.cuisine)} className="ml-1 opacity-70 hover:opacity-100"> <X size={12} /> </button>
               </span>
             )}
           </div>
       )}

      {/* Render the current filter step */}
      <div className="mt-2">
        {renderFilterStep()}
      </div>

       <p className="text-xs text-gray-400 mt-4">Note: This filter section requires working backend APIs for Cities, Neighborhoods, and Cuisines.</p>
    </div>
  );
};

export default FilterSection;