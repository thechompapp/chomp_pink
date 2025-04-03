// src/pages/Home/FilterSection.jsx
// UPDATE: Add useEffect to fetch cities/cuisines on mount
import React, { useState, useEffect, useCallback } from 'react'; // Added useEffect
// Import stores
import useConfigStore from '@/stores/useConfigStore.js';
import useUIStateStore from '@/stores/useUIStateStore.js';
// Other imports
import PillButton from '@/components/UI/PillButton.jsx';
import { API_BASE_URL } from '@/config.js'; // Keep if fetchNeighborhoods uses it
import { ChevronLeft, XCircle, Loader2 } from 'lucide-react';

const FilterSection = React.memo(() => {
  // Select state/actions from specific stores
  const cities = useConfigStore((state) => state.cities);
  const isLoadingCities = useConfigStore((state) => state.isLoadingCities);
  const errorCities = useConfigStore((state) => state.errorCities); // Get error state
  const fetchCities = useConfigStore((state) => state.fetchCities); // Get fetch action
  // Fetch cuisines action - not strictly needed by this component display, but fetch on init
  const fetchCuisines = useConfigStore((state) => state.fetchCuisines);

  const selectedCityId = useUIStateStore((state) => state.cityId);
  const setCityId = useUIStateStore((state) => state.setCityId);

  // Local state for UI levels and neighborhoods
  const [showLevel, setShowLevel] = useState('cities'); // 'cities' or 'neighborhoods'
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
  const [fetchError, setFetchError] = useState(''); // Combined local error state

  const hasCities = Array.isArray(cities) && cities.length > 0;
  const selectedCity = hasCities ? cities.find(c => c.id === selectedCityId) : undefined;

  // --- Fetch Config Data ---
  useEffect(() => {
    // Fetch cities and cuisines only if not already loaded/loading
    if (!cities || cities.length === 0) {
        console.log("[FilterSection useEffect] Fetching cities...");
        fetchCities().catch(err => {
            console.error("[FilterSection] Error fetching cities:", err);
            setFetchError(errorCities || "Failed to load cities."); // Show store error or fallback
        });
    }
    // Fetch cuisines too, perhaps - or move this elsewhere if not needed here
    // const cuisines = useConfigStore.getState().cuisines; // Check without subscribing if needed
    // if (!cuisines || cuisines.length === 0) {
    //    fetchCuisines().catch(err => console.error("[FilterSection] Error fetching cuisines:", err));
    // }
  }, [fetchCities, fetchCuisines, cities, errorCities]); // Add errorCities to dependencies to allow clearing error display


  // Fetch neighborhoods logic (remains mostly the same, uses local state/error)
  const fetchNeighborhoods = useCallback(async (cityIdToFetch) => {
      if (!cityIdToFetch) return;
      setIsLoadingNeighborhoods(true);
      setFetchError(''); // Clear previous errors
      try {
          // Assuming a backend endpoint like /api/neighborhoods?cityId=...
          const response = await fetch(`${API_BASE_URL}/api/neighborhoods?cityId=${cityIdToFetch}`);
          if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.error || `Failed to fetch neighborhoods (${response.status})`);
          }
          const data = await response.json();
          setNeighborhoods(Array.isArray(data) ? data : []);
      } catch (err) {
          console.error("[FilterSection] Error fetching neighborhoods:", err);
          setFetchError(err.message || 'Could not load neighborhoods.');
          setNeighborhoods([]); // Clear neighborhoods on error
      } finally {
          setIsLoadingNeighborhoods(false);
      }
  }, []); // API_BASE_URL could be a dependency if it changes, but likely stable

  // Event Handlers using setCityId from UIStateStore
  const handleSelectCity = (cityId) => {
    console.log(`[FilterSection] Selected city ID: ${cityId}`);
    setCityId(cityId); // Update global UI state
    fetchNeighborhoods(cityId); // Fetch neighborhoods for the selected city
    setShowLevel('neighborhoods'); // Switch view to neighborhoods
    setFetchError(''); // Clear errors on selection
  };

  const handleGoBack = () => { // Go back from neighborhoods to cities
    setCityId(null); // Clear selected city in global state
    setNeighborhoods([]); // Clear local neighborhoods
    setFetchError(''); // Clear errors
    setShowLevel('cities'); // Show city pills again
  };

  const handleClearAll = () => { // Clear everything
     handleGoBack(); // Use handleGoBack logic to reset city/neighborhoods
  };

  const renderCityPills = () => {
      if (isLoadingCities) {
          return <div className="flex items-center text-xs text-gray-500"> <Loader2 className="animate-spin h-4 w-4 mr-1.5" /> <span>Loading cities...</span> </div>;
      }
      if (errorCities && !hasCities) { // Show error only if loading failed and no cities are present
           return <p className="text-xs text-red-500">Error: {errorCities}</p>;
       }
      if (!hasCities) {
          return <p className="text-xs text-gray-500">No cities available.</p>;
      }
      return cities.map((city) => (
          <PillButton
              key={city.id}
              label={city.name}
              isActive={selectedCityId === city.id} // Should always be false here as we switch level on select
              onClick={() => handleSelectCity(city.id)}
          />
      ));
  };

   const renderNeighborhoodPills = () => {
       if (isLoadingNeighborhoods) {
           return <div className="flex items-center text-xs text-gray-500"> <Loader2 className="animate-spin h-4 w-4 mr-1.5" /> <span>Loading neighborhoods...</span> </div>;
       }
        if (fetchError && neighborhoods.length === 0) { // Show error if fetch failed
            return <p className="text-xs text-red-500">Error: {fetchError}</p>;
        }
       if (neighborhoods.length === 0) {
           return <p className="text-xs text-gray-500">No neighborhoods found for {selectedCity?.name || 'this city'}.</p>;
       }
       // TODO: Add neighborhood selection logic similar to city selection if needed
       return neighborhoods.map((n) => (
           <PillButton key={n.id} label={n.name} /* Add isActive/onClick if neighborhoods are selectable */ />
       ));
   };


  return (
    <div className="mb-4 p-3 bg-white shadow-sm rounded-lg border border-gray-100 min-h-[70px]">
      {/* Header and Buttons */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-y-1">
        <div className="flex items-center gap-2">
            {/* Back button only shown when viewing neighborhoods */}
            {showLevel === 'neighborhoods' && (
                <button onClick={handleGoBack} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Back to cities">
                    <ChevronLeft size={18} />
                </button>
            )}
            <h3 className="text-sm font-semibold text-gray-700">
                {showLevel === 'cities' ? 'Filter by City' : `Neighborhoods in ${selectedCity?.name || 'Selected City'}`}
            </h3>
        </div>
        {/* Clear button only shown when a city is selected */}
        {selectedCityId && (
            <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5">
                 <XCircle size={14} /> Clear
            </button>
        )}
      </div>

      {/* Display combined fetch errors if any */}
       {(errorCities && !hasCities && showLevel === 'cities') || (fetchError && neighborhoods.length === 0 && showLevel === 'neighborhoods') ? (
           <p className="text-xs text-red-500 mb-2">{showLevel === 'cities' ? errorCities : fetchError}</p>
       ) : null}

      {/* Pills Section */}
      <div className="flex flex-wrap gap-1.5">
        {showLevel === 'cities' && renderCityPills()}
        {showLevel === 'neighborhoods' && renderNeighborhoodPills()}
      </div>
    </div>
  );
});

export default FilterSection;