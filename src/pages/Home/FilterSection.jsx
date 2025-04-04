// src/pages/Home/FilterSection.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
// Keep UI store for setting selected city ID
import useUIStateStore from '@/stores/useUIStateStore.js';
// Other imports
import PillButton from '@/components/UI/PillButton.jsx';
import { API_BASE_URL } from '@/config.js';
import { ChevronLeft, XCircle } from 'lucide-react';
import Button from '@/components/Button';
// Import common UI components
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';


// Fetcher Function for Cities
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
        const sortedData = data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        // Explicitly return the array to avoid undefined possibility
        return sortedData;
    } catch (err) {
        console.error(`[fetchCitiesData] Error fetching cities:`, err);
        // Ensure error is thrown, React Query handles this
        throw new Error(err.message || "Could not load cities.");
    }
};

// Fetcher Function for Neighborhoods
const fetchNeighborhoodsData = async (cityIdToFetch) => {
    if (!cityIdToFetch) throw new Error("City ID is required to fetch neighborhoods.");
    console.log(`[fetchNeighborhoodsData] Fetching neighborhoods for City ID: ${cityIdToFetch}`);
    const url = `${API_BASE_URL}/api/neighborhoods?cityId=${cityIdToFetch}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            let errorMsg = `Failed to fetch neighborhoods (${response.status})`;
            try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch (e) { /* ignore */ }
            throw new Error(errorMsg);
        }
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid data format for neighborhoods.");
        console.log(`[fetchNeighborhoodsData] Successfully fetched ${data.length} neighborhoods.`);
        const sortedData = data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        // Explicitly return the array
        return sortedData;
    } catch (err) {
        console.error(`[fetchNeighborhoodsData] Error fetching neighborhoods:`, err);
        // Ensure error is thrown
        throw new Error(err.message || "Could not load neighborhoods.");
    }
};


const FilterSection = React.memo(() => {
  // --- Fetch Cities using React Query ---
  const {
      data: cities = [], // Default to empty array remains good practice
      isLoading: isLoadingCities,
      isError: isErrorCities,
      error: errorCities,
      refetch: refetchCities
  } = useQuery({
      queryKey: ['cities'],
      queryFn: fetchCitiesData, // Use the updated fetcher
      staleTime: 1000 * 60 * 60,
      cacheTime: 1000 * 60 * 90,
  });

  // Keep UI store state/actions for managing selection
  const selectedCityId = useUIStateStore((state) => state.cityId);
  const setCityId = useUIStateStore((state) => state.setCityId);

  // Local state for UI levels (keep)
  const [showLevel, setShowLevel] = useState('cities');

  // --- Fetch Neighborhoods using React Query (conditionally enabled) ---
  const {
      data: neighborhoods = [], // Default to empty array
      isLoading: isLoadingNeighborhoods,
      isError: isErrorNeighborhoods,
      error: errorNeighborhoods,
      refetch: refetchNeighborhoods
  } = useQuery({
      queryKey: ['neighborhoods', selectedCityId],
      queryFn: () => fetchNeighborhoodsData(selectedCityId), // Use updated fetcher
      enabled: !!selectedCityId && showLevel === 'neighborhoods',
      staleTime: 1000 * 60 * 5,
  });
  // --- End Neighborhoods Fetch ---


  const hasCities = Array.isArray(cities) && cities.length > 0;
  const selectedCity = useMemo(() => cities.find(c => c.id === selectedCityId), [cities, selectedCityId]);

  // Event Handlers (remain the same)
  const handleSelectCity = useCallback((cityId) => {
    console.log(`[FilterSection] Selected city ID: ${cityId}`);
    setCityId(cityId);
    setShowLevel('neighborhoods');
  }, [setCityId]);

  const handleGoBack = useCallback(() => {
    setCityId(null);
    setShowLevel('cities');
  }, [setCityId]);

  const handleClearAll = useCallback(() => {
     handleGoBack();
  }, [handleGoBack]);

  // --- Render Functions using React Query state (remain the same) ---
  const renderCityPills = () => {
      if (isLoadingCities) {
          return <LoadingSpinner size="sm" message="Loading cities..." spinnerClassName="text-gray-400" messageClassName="text-xs text-gray-400 ml-1" className="py-1" />;
      }
      if (isErrorCities) {
           return (
                <ErrorMessage
                    message={errorCities?.message || 'Could not load cities.'}
                    onRetry={refetchCities}
                    isLoadingRetry={isLoadingCities}
                    containerClassName="flex items-center gap-2 text-xs"
                    messageClassName="text-red-500"
                    iconClassName="h-4 w-4 text-red-400"
                />
           );
       }
      if (!hasCities) {
          return <p className="text-xs text-gray-500">No cities available.</p>;
      }
      return cities.map((city) => (
          <PillButton
              key={city.id}
              label={city.name}
              isActive={false}
              onClick={() => handleSelectCity(city.id)}
          />
      ));
  };

   const renderNeighborhoodPills = () => {
       if (isLoadingNeighborhoods) {
            return <LoadingSpinner size="sm" message="Loading neighborhoods..." spinnerClassName="text-gray-400" messageClassName="text-xs text-gray-400 ml-1" className="py-1" />;
        }
        if (isErrorNeighborhoods) {
            return (
                 <ErrorMessage
                     message={errorNeighborhoods?.message || 'Could not load neighborhoods.'}
                     onRetry={() => refetchNeighborhoods()}
                     isLoadingRetry={isLoadingNeighborhoods}
                     containerClassName="flex items-center gap-2 text-xs"
                     messageClassName="text-red-500"
                     iconClassName="h-4 w-4 text-red-400"
                 />
             );
        }
       if (!isLoadingNeighborhoods && !isErrorNeighborhoods && neighborhoods.length === 0) {
            return <p className="text-xs text-gray-500">No neighborhoods found for {selectedCity?.name || 'this city'}.</p>;
       }
        return neighborhoods.map((n) => (
            <PillButton key={n.id} label={n.name} />
        ));
   };
   // --- End Render Functions ---

  return (
    <div className="mb-4 p-3 bg-white shadow-sm rounded-lg border border-gray-100 min-h-[70px]">
      {/* Header and Buttons */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-y-1">
         <div className="flex items-center gap-2">
             {showLevel === 'neighborhoods' && ( <button onClick={handleGoBack} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Back to cities"> <ChevronLeft size={18} /> </button> )}
             <h3 className="text-sm font-semibold text-gray-700"> {showLevel === 'cities' ? 'Filter by City' : `Neighborhoods in ${selectedCity?.name || 'Selected City'}`} </h3>
         </div>
         {selectedCityId && ( <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5"> <XCircle size={14} /> Clear </button> )}
      </div>

      {/* Pills Section */}
      <div className="flex flex-wrap gap-1.5">
        {showLevel === 'cities' && renderCityPills()}
        {showLevel === 'neighborhoods' && renderNeighborhoodPills()}
      </div>
    </div>
  );
});

export default FilterSection;