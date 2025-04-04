// src/pages/Home/FilterSection.jsx
import React, { useEffect, useMemo, useCallback } from 'react'; // Removed useState
// Removed useQuery import
import useUIStateStore from '@/stores/useUIStateStore.js'; // Import the consolidated store
import PillButton from '@/components/UI/PillButton.jsx';
// import { API_BASE_URL } from '@/config.js'; // No longer needed here
import { ChevronLeft, XCircle } from 'lucide-react';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

// Removed internal fetcher functions (fetchCitiesData, fetchNeighborhoodsData)

const FilterSection = React.memo(() => {
  // --- Select state and actions from the UI Store ---
  const {
      cityId,
      setCityId,
      cities,
      isLoadingCities,
      errorCities,
      fetchCities,
      neighborhoods,
      isLoadingNeighborhoods,
      errorNeighborhoods,
      fetchNeighborhoodsByCity,
      clearError // Get clearError action
  } = useUIStateStore(state => ({
      cityId: state.cityId,
      setCityId: state.setCityId,
      cities: state.cities,
      isLoadingCities: state.isLoadingCities,
      errorCities: state.errorCities, // Use specific error state
      fetchCities: state.fetchCities,
      neighborhoods: state.neighborhoods,
      isLoadingNeighborhoods: state.isLoadingNeighborhoods,
      errorNeighborhoods: state.errorNeighborhoods, // Use specific error state
      fetchNeighborhoodsByCity: state.fetchNeighborhoodsByCity,
      clearError: state.clearError,
  }));

  // --- Local state only for UI level control ---
  const showLevel = cityId ? 'neighborhoods' : 'cities';

  // --- Fetch initial cities on mount if needed ---
  useEffect(() => {
      // Fetch only if cities array is empty and not currently loading/error
      if (cities.length === 0 && !isLoadingCities && !errorCities) {
          fetchCities();
      }
  }, [cities.length, isLoadingCities, errorCities, fetchCities]); // Dependencies

  // --- Find selected city name (Memoized) ---
  const selectedCity = useMemo(() => cities.find(c => c.id === cityId), [cities, cityId]);

  // --- Event Handlers ---
  const handleSelectCity = useCallback((selectedCityId) => {
    setCityId(selectedCityId); // Update global UI state (clears neighborhoods in store)
    // Fetch neighborhoods for the selected city using store action
    fetchNeighborhoodsByCity(selectedCityId);
  }, [setCityId, fetchNeighborhoodsByCity]);

  const handleGoBack = useCallback(() => {
    setCityId(null); // This clears cityId and neighborhoods in the store state
    clearError('neighborhoods'); // Clear potential neighborhood errors
  }, [setCityId, clearError]);

  const handleClearAll = useCallback(() => {
     handleGoBack();
     clearError('cities'); // Clear potential city errors as well
  }, [handleGoBack, clearError]);

  // --- Render Functions using Store state ---
  const renderCityPills = () => {
      if (isLoadingCities) {
          return <LoadingSpinner size="sm" message="Loading cities..." spinnerClassName="text-gray-400" messageClassName="text-xs text-gray-400 ml-1" className="py-1" />;
      }
      if (errorCities) { // Check specific error state
           return (
                <ErrorMessage
                    message={errorCities}
                    onRetry={fetchCities} // Retry store action
                    isLoadingRetry={isLoadingCities}
                    containerClassName="flex items-center gap-2 text-xs"
                    messageClassName="text-red-500"
                    iconClassName="h-4 w-4 text-red-400"
                />
           );
       }
      if (cities.length === 0) {
          return <p className="text-xs text-gray-500">No cities available.</p>;
      }
      return cities.map((city) => (
          <PillButton
              key={city.id}
              label={city.name}
              isActive={false} // Always inactive in city view
              onClick={() => handleSelectCity(city.id)}
          />
      ));
  };

   const renderNeighborhoodPills = () => {
       if (isLoadingNeighborhoods) {
            return <LoadingSpinner size="sm" message="Loading neighborhoods..." spinnerClassName="text-gray-400" messageClassName="text-xs text-gray-400 ml-1" className="py-1" />;
        }
        if (errorNeighborhoods) { // Check specific error state
            return (
                 <ErrorMessage
                     message={errorNeighborhoods}
                     // Retry fetching neighborhoods for the currently selected city
                     onRetry={() => fetchNeighborhoodsByCity(cityId)} // Retry store action
                     isLoadingRetry={isLoadingNeighborhoods}
                     containerClassName="flex items-center gap-2 text-xs"
                     messageClassName="text-red-500"
                     iconClassName="h-4 w-4 text-red-400"
                 />
             );
        }
       // Check fetched neighborhoods array from store
       if (neighborhoods.length === 0) {
            return <p className="text-xs text-gray-500">No neighborhoods found for {selectedCity?.name || 'this city'}.</p>;
       }
       // Render neighborhood pills from store data
        return neighborhoods.map((n) => (
            // Make neighborhoods selectable if needed later by adding onClick
            <PillButton key={n.id} label={n.name} />
        ));
   };
   // --- End Render Functions ---

  return (
    <div className="mb-4 p-3 bg-white shadow-sm rounded-lg border border-gray-100 min-h-[70px]">
      {/* Header and Buttons */}
      <div className="flex justify-between items-center mb-2 flex-wrap gap-y-1">
         <div className="flex items-center gap-2">
             {showLevel === 'neighborhoods' && (
                <button onClick={handleGoBack} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Back to cities">
                    <ChevronLeft size={18} />
                </button>
             )}
             <h3 className="text-sm font-semibold text-gray-700">
                {showLevel === 'cities' ? 'Filter by City' : `Neighborhoods in ${selectedCity?.name || 'Selected City'}`}
             </h3>
         </div>
         {/* Show clear only if a city is selected */}
         {cityId && (
            <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5">
                <XCircle size={14} /> Clear
            </button>
         )}
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