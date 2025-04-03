// src/pages/Home/FilterSection.jsx
// UPDATE: Added missing useMemo import. Refactored to use React Query for fetching cities.
import React, { useState, useCallback, useMemo } from 'react'; // *** IMPORT useMemo ***
import { useQuery } from '@tanstack/react-query';
// Keep UI store for setting selected city ID
import useUIStateStore from '@/stores/useUIStateStore.js';
// Other imports
import PillButton from '@/components/UI/PillButton.jsx';
import { API_BASE_URL } from '@/config.js';
import { ChevronLeft, XCircle, Loader2, AlertTriangle } from 'lucide-react';

// *** Define Fetcher Function for Cities ***
const fetchCitiesData = async () => {
    console.log("[fetchCitiesData] Fetching cities...");
    const url = `${API_BASE_URL}/api/cities`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorMsg = `Failed to fetch cities (${response.status})`;
            try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
            console.error(`[fetchCitiesData] API Error Status ${response.status}: ${errorMsg}`);
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
             console.error(`[fetchCitiesData] Invalid data format received:`, data);
             throw new Error("Invalid data format for cities.");
        }
        console.log(`[fetchCitiesData] Successfully fetched ${data.length} cities.`);
        // Sort cities alphabetically by name
        return data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (err) {
        console.error(`[fetchCitiesData] Error fetching cities:`, err);
        throw new Error(err.message || "Could not load cities."); // Rethrow error
    }
};


const FilterSection = React.memo(() => {
  // --- Fetch Cities using React Query ---
  const {
      data: cities = [], // Default to empty array
      isLoading: isLoadingCities, // Loading state from useQuery
      isError: isErrorCities,   // Error state from useQuery
      error: errorCities,     // Error object from useQuery
      refetch: refetchCities    // Function to refetch cities
  } = useQuery({
      queryKey: ['cities'], // Unique key for cities query
      queryFn: fetchCitiesData, // Use the fetcher function
      staleTime: 1000 * 60 * 60, // Cities don't change often, keep fresh for 1 hour
      cacheTime: 1000 * 60 * 90, // Keep in cache for 90 minutes
  });
  // --- End React Query ---

  // Keep UI store state/actions for managing selection
  const selectedCityId = useUIStateStore((state) => state.cityId);
  const setCityId = useUIStateStore((state) => state.setCityId);

  // Local state for UI levels and neighborhoods (keep as is)
  const [showLevel, setShowLevel] = useState('cities');
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
  const [neighborhoodFetchError, setNeighborhoodFetchError] = useState(''); // Separate error state for neighborhoods

  const hasCities = Array.isArray(cities) && cities.length > 0;
  // Find selected city from React Query's data using useMemo
  const selectedCity = useMemo(() => cities.find(c => c.id === selectedCityId), [cities, selectedCityId]); // *** USE useMemo HERE ***

  // Fetch neighborhoods logic (keep as is, uses local state/error)
  const fetchNeighborhoods = useCallback(async (cityIdToFetch) => {
      if (!cityIdToFetch) return;
      setIsLoadingNeighborhoods(true);
      setNeighborhoodFetchError(''); // Clear previous neighborhood errors
      try {
          const response = await fetch(`${API_BASE_URL}/api/neighborhoods?cityId=${cityIdToFetch}`);
          if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.error || `Failed to fetch neighborhoods (${response.status})`);
          }
          const data = await response.json();
          setNeighborhoods(Array.isArray(data) ? data : []);
      } catch (err) {
          console.error("[FilterSection] Error fetching neighborhoods:", err);
          setNeighborhoodFetchError(err.message || 'Could not load neighborhoods.');
          setNeighborhoods([]);
      } finally {
          setIsLoadingNeighborhoods(false);
      }
  }, []);

  // Event Handlers (keep largely as is, just clear neighborhood error)
  const handleSelectCity = (cityId) => {
    console.log(`[FilterSection] Selected city ID: ${cityId}`);
    setCityId(cityId); // Update global UI state
    setNeighborhoods([]); // Clear previous neighborhoods
    setNeighborhoodFetchError(''); // Clear neighborhood error
    setShowLevel('neighborhoods'); // Switch view to neighborhoods
    fetchNeighborhoods(cityId); // Fetch neighborhoods for the selected city
  };

  const handleGoBack = () => {
    setCityId(null);
    setNeighborhoods([]);
    setNeighborhoodFetchError(''); // Clear neighborhood error
    setShowLevel('cities');
  };

  const handleClearAll = () => {
     handleGoBack(); // Resets city, neighborhoods, level, and error
  };

  // --- Render Functions using React Query state for cities ---
  const renderCityPills = () => {
      if (isLoadingCities) {
          return <div className="flex items-center text-xs text-gray-500"> <Loader2 className="animate-spin h-4 w-4 mr-1.5" /> <span>Loading cities...</span> </div>;
      }
      // Use isErrorCities and errorCities from useQuery
      if (isErrorCities) {
           return (
               <div className='flex items-center gap-2'>
                   <p className="text-xs text-red-500">Error: {errorCities?.message || 'Could not load cities.'}</p>
                   <Button onClick={() => refetchCities()} variant="tertiary" size="sm" className='!text-xs !py-0 !px-1.5' disabled={isLoadingCities}>Retry</Button>
               </div>
           );
       }
      if (!hasCities) {
          return <p className="text-xs text-gray-500">No cities available.</p>;
      }
      return cities.map((city) => (
          <PillButton
              key={city.id}
              label={city.name}
              isActive={false} // Always inactive in this view as selection switches level
              onClick={() => handleSelectCity(city.id)}
          />
      ));
  };

   const renderNeighborhoodPills = () => {
       if (isLoadingNeighborhoods) {
            return <div className="flex items-center text-xs text-gray-500"> <Loader2 className="animate-spin h-4 w-4 mr-1.5" /> <span>Loading neighborhoods...</span> </div>;
        }
        // Use separate neighborhoodFetchError state
        if (neighborhoodFetchError && neighborhoods.length === 0) {
            return (
                 <div className='flex items-center gap-2'>
                     <p className="text-xs text-red-500">Error: {neighborhoodFetchError}</p>
                     {/* Retry fetching neighborhoods for the currently selected city */}
                     <Button onClick={() => fetchNeighborhoods(selectedCityId)} variant="tertiary" size="sm" className='!text-xs !py-0 !px-1.5' disabled={isLoadingNeighborhoods || !selectedCityId}>Retry</Button>
                 </div>
             );
        }
       if (neighborhoods.length === 0) {
            return <p className="text-xs text-gray-500">No neighborhoods found for {selectedCity?.name || 'this city'}.</p>;
       }
       // Render neighborhood pills
        return neighborhoods.map((n) => (
            <PillButton key={n.id} label={n.name} /* Add isActive/onClick if neighborhoods become selectable */ />
        ));
   };
   // --- End Render Functions ---

  return (
    <div className="mb-4 p-3 bg-white shadow-sm rounded-lg border border-gray-100 min-h-[70px]">
      {/* Header and Buttons (Keep existing structure) */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-y-1">
         <div className="flex items-center gap-2">
             {showLevel === 'neighborhoods' && ( <button onClick={handleGoBack} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Back to cities"> <ChevronLeft size={18} /> </button> )}
             <h3 className="text-sm font-semibold text-gray-700"> {showLevel === 'cities' ? 'Filter by City' : `Neighborhoods in ${selectedCity?.name || 'Selected City'}`} </h3>
         </div>
         {selectedCityId && ( <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5"> <XCircle size={14} /> Clear </button> )}
      </div>

      {/* Display City fetch error only when showing cities */}
       {isErrorCities && showLevel === 'cities' && (
           <div className="flex items-center gap-2 mb-2">
             <AlertTriangle size={14} className="text-red-400" />
             <p className="text-xs text-red-500">{errorCities?.message || 'Could not load cities.'}</p>
             <Button onClick={() => refetchCities()} variant="tertiary" size="sm" className='!text-xs !py-0 !px-1.5' disabled={isLoadingCities}>Retry</Button>
           </div>
       )}
       {/* Neighborhood error is handled within renderNeighborhoodPills */}

      {/* Pills Section */}
      <div className="flex flex-wrap gap-1.5">
        {showLevel === 'cities' && renderCityPills()}
        {showLevel === 'neighborhoods' && renderNeighborhoodPills()}
      </div>
    </div>
  );
});

export default FilterSection;