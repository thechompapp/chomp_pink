// src/pages/Home/FilterSection.jsx
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import useUIStateStore from '@/stores/useUIStateStore.js';
import PillButton from '@/components/UI/PillButton.jsx';
import { ChevronLeft, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

// Individual selectors to prevent reference equality issues
const useCityId = () => useUIStateStore(state => state.cityId);
const useSetCityId = () => useUIStateStore(state => state.setCityId);
const useNeighborhoodId = () => useUIStateStore(state => state.neighborhoodId);
const useSetNeighborhoodId = () => useUIStateStore(state => state.setNeighborhoodId);
const useHashtags = () => useUIStateStore(state => state.hashtags || []);
const useSetHashtags = () => useUIStateStore(state => state.setHashtags);
const useCities = () => useUIStateStore(state => state.cities);
const useIsLoadingCities = () => useUIStateStore(state => state.isLoadingCities);
const useErrorCities = () => useUIStateStore(state => state.errorCities);
const useFetchCities = () => useUIStateStore(state => state.fetchCities);
const useNeighborhoods = () => useUIStateStore(state => state.neighborhoods);
const useIsLoadingNeighborhoods = () => useUIStateStore(state => state.isLoadingNeighborhoods);
const useErrorNeighborhoods = () => useUIStateStore(state => state.errorNeighborhoods);
const useFetchNeighborhoodsByCity = () => useUIStateStore(state => state.fetchNeighborhoodsByCity);
const useFetchCuisines = () => useUIStateStore(state => state.fetchCuisines);
const useCuisines = () => useUIStateStore(state => state.cuisines);
const useIsLoadingCuisines = () => useUIStateStore(state => state.isLoadingCuisines);
const useErrorCuisines = () => useUIStateStore(state => state.errorCuisines);
const useClearError = () => useUIStateStore(state => state.clearError);

const FilterSection = React.memo(() => {
    // Use individual selectors
    const cityId = useCityId();
    const setCityId = useSetCityId();
    const neighborhoodId = useNeighborhoodId();
    const setNeighborhoodId = useSetNeighborhoodId();
    const hashtags = useHashtags();
    const setHashtags = useSetHashtags();
    const cities = useCities();
    const isLoadingCities = useIsLoadingCities();
    const errorCities = useErrorCities();
    const fetchCities = useFetchCities();
    const neighborhoods = useNeighborhoods();
    const isLoadingNeighborhoods = useIsLoadingNeighborhoods();
    const errorNeighborhoods = useErrorNeighborhoods();
    const fetchNeighborhoodsByCity = useFetchNeighborhoodsByCity();
    const fetchCuisines = useFetchCuisines();
    const cuisines = useCuisines();
    const isLoadingCuisines = useIsLoadingCuisines();
    const errorCuisines = useErrorCuisines();
    const clearError = useClearError();

    const [filterLevel, setFilterLevel] = useState('cities');

    // Fetch initial data only on mount if not already loaded/loading
    useEffect(() => {
        if (cities.length === 0 && !isLoadingCities && !errorCities) {
            fetchCities().catch(err => console.error('[FilterSection] Initial fetchCities failed:', err));
        }
        if (cuisines.length === 0 && !isLoadingCuisines && !errorCuisines) {
            fetchCuisines().catch(err => console.error('[FilterSection] Initial fetchCuisines failed:', err));
        }
    // Only run on mount essentially, dependencies ensure fetch isn't repeated if already loaded/loading
    }, [fetchCities, fetchCuisines, cities.length, isLoadingCities, errorCities, cuisines.length, isLoadingCuisines, errorCuisines]);

    // Fetch neighborhoods when cityId changes and is valid
    useEffect(() => {
        if (cityId && !isLoadingNeighborhoods) {
             // Check if neighborhoods for the current cityId are already loaded
             // This check might be too simple if neighborhoods could belong to multiple cities
             // A more robust check might involve storing neighborhoods keyed by cityId
             // const neighborhoodsForCityLoaded = neighborhoods.some(n => n.city_id === cityId);
             // if (!neighborhoodsForCityLoaded) { ... }

            fetchNeighborhoodsByCity(cityId).catch(err =>
                console.error('[FilterSection] fetchNeighborhoodsByCity failed:', err)
            );
        } else if (!cityId) {
            // Optimization: Only reset if neighborhoodId or hashtags are set
            if (neighborhoodId || hashtags.length > 0) {
                 setNeighborhoodId(null);
                 setHashtags([]);
            }
        }
     // Rerun when cityId changes, or when fetchNeighborhoodsByCity function reference changes (should be stable from Zustand)
    }, [cityId, fetchNeighborhoodsByCity, isLoadingNeighborhoods, setNeighborhoodId, setHashtags, neighborhoodId, hashtags.length]);

    // Update filter level display based on selections
    useEffect(() => {
        if (cityId && neighborhoodId) {
            setFilterLevel('hashtags');
        } else if (cityId) {
            setFilterLevel('neighborhoods');
        } else {
            setFilterLevel('cities');
        }
    }, [cityId, neighborhoodId]);

    // Memoize derived data
    const selectedCity = useMemo(() => cities.find(c => c.id === cityId), [cities, cityId]);
    const selectedNeighborhood = useMemo(() => neighborhoods.find(n => n.id === neighborhoodId), [neighborhoods, neighborhoodId]);

    // Callbacks wrapped in useCallback for stable references
    const handleSelectCity = useCallback((selectedCityId) => {
        setCityId(selectedCityId);
        // Let useEffect update filterLevel
    }, [setCityId]);

    const handleSelectNeighborhood = useCallback((selectedNeighborhoodId) => {
        setNeighborhoodId(selectedNeighborhoodId);
        // Let useEffect update filterLevel
    }, [setNeighborhoodId]);

    const handleToggleHashtag = useCallback((hashtag) => {
        setHashtags(prev =>
            prev.includes(hashtag) ? prev.filter(h => h !== hashtag) : [...prev, hashtag]
        );
    }, [setHashtags]);

    const handleGoBack = useCallback(() => {
        if (filterLevel === 'hashtags') {
            setNeighborhoodId(null); // Clear neighborhood ID to go back to neighborhood level
            setHashtags([]); // Clear hashtags when leaving hashtag level
            // filterLevel will update via useEffect based on cityId/neighborhoodId change
        } else if (filterLevel === 'neighborhoods') {
            setCityId(null); // Clear city ID to go back to city level
            setNeighborhoodId(null); // Ensure neighborhood is cleared
             setHashtags([]); // Ensure hashtags are cleared
             clearError('neighborhoods'); // Clear potential neighborhood errors
            // filterLevel will update via useEffect
        }
    }, [filterLevel, setCityId, setNeighborhoodId, setHashtags, clearError]);

    const handleClearAll = useCallback(() => {
        setCityId(null);
        setNeighborhoodId(null);
        setHashtags([]);
        // filterLevel will update via useEffect
        clearError('cities');
        clearError('neighborhoods');
        clearError('cuisines');
    }, [setCityId, setNeighborhoodId, setHashtags, clearError]);

    // Memoize the renderPills function itself, though benefits might be minor here
    // unless FilterSection re-renders very often for other reasons.
    const renderPills = useCallback(() => {
        if (filterLevel === 'cities') {
            if (isLoadingCities) return <LoadingSpinner size="sm" message="Loading cities..." />;
            if (errorCities) return <ErrorMessage message={errorCities} onRetry={fetchCities} isLoadingRetry={isLoadingCities} />;
            if (cities.length === 0) return <p className="text-xs text-gray-500">No cities available.</p>;
            return cities.map((city) => (
                <PillButton
                    key={`city-${city.id}`} // Ensure unique keys
                    label={city.name}
                    isActive={cityId === city.id}
                    onClick={() => handleSelectCity(city.id)}
                />
            ));
        } else if (filterLevel === 'neighborhoods') {
            if (isLoadingNeighborhoods) return <LoadingSpinner size="sm" message="Loading neighborhoods..." />;
            // Only show retry if cityId is valid for the fetch
            const retryFetchNeighborhoods = cityId ? () => fetchNeighborhoodsByCity(cityId) : undefined;
            if (errorNeighborhoods) return <ErrorMessage message={errorNeighborhoods} onRetry={retryFetchNeighborhoods} isLoadingRetry={isLoadingNeighborhoods} />;
            if (neighborhoods.length === 0) return <p className="text-xs text-gray-500">No neighborhoods found for {selectedCity?.name || 'this city'}.</p>;
            return neighborhoods.map((n) => (
                <PillButton
                    key={`neigh-${n.id}`} // Ensure unique keys
                    label={n.name}
                    isActive={neighborhoodId === n.id}
                    onClick={() => handleSelectNeighborhood(n.id)}
                />
            ));
        } else if (filterLevel === 'hashtags') {
            if (isLoadingCuisines) return <LoadingSpinner size="sm" message="Loading hashtags..." />;
            if (errorCuisines) return <ErrorMessage message={errorCuisines} onRetry={fetchCuisines} isLoadingRetry={isLoadingCuisines} />;
            if (cuisines.length === 0) return <p className="text-xs text-gray-500">No hashtags available.</p>;
            return cuisines.map((h) => (
                <PillButton
                    key={`hash-${h.id}`} // Ensure unique keys
                    label={`#${h.name}`}
                    isActive={hashtags.includes(h.name)}
                    onClick={() => handleToggleHashtag(h.name)}
                />
            ));
        }
        return null;
    }, [
        filterLevel, cityId, neighborhoodId, hashtags, cities, isLoadingCities, errorCities, fetchCities,
        neighborhoods, isLoadingNeighborhoods, errorNeighborhoods, fetchNeighborhoodsByCity,
        cuisines, isLoadingCuisines, errorCuisines, fetchCuisines, selectedCity, handleSelectCity,
        handleSelectNeighborhood, handleToggleHashtag // Dependencies for the memoized render function
    ]);

    const displayTitle = useMemo(() => {
        if (filterLevel === 'cities') return 'Filter by City';
        if (filterLevel === 'neighborhoods') return `Neighborhoods in ${selectedCity?.name || 'Selected City'}`;
        if (filterLevel === 'hashtags') return `Filter by Hashtag in ${selectedNeighborhood?.name || selectedCity?.name || 'Selected Area'}`;
        return 'Filter'; // Fallback
    }, [filterLevel, selectedCity, selectedNeighborhood]);

    const showBackButton = cityId || neighborhoodId; // Show back if city or neighborhood is selected
    const showClearButton = cityId || neighborhoodId || hashtags.length > 0; // Show clear if any filter is active

    return (
        <div className="mb-4 p-3 bg-white shadow-sm rounded-lg border border-gray-100 min-h-[70px]">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-y-1">
                <div className="flex items-center gap-1 sm:gap-2">
                    {showBackButton && (
                        <button onClick={handleGoBack} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Back">
                            <ChevronLeft size={18} />
                        </button>
                    )}
                    <h3 className="text-sm font-semibold text-gray-700">
                        {displayTitle}
                    </h3>
                </div>
                {showClearButton && (
                    <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5 px-1">
                        <XCircle size={14} /> Clear Filters
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {renderPills()}
            </div>
        </div>
    );
});

export default FilterSection;