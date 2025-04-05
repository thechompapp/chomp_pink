import React, { useEffect, useMemo, useCallback, useState } from 'react';
import useUIStateStore from '@/stores/useUIStateStore.js';
import PillButton from '@/components/UI/PillButton.jsx';
import { ChevronLeft, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';

// Individual selectors for each piece of state to prevent reference equality issues
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

    // Fetch initial data only on mount
    useEffect(() => {
        if (cities.length === 0 && !isLoadingCities && !errorCities) {
            fetchCities().catch(err => console.error('[FilterSection] Initial fetchCities failed:', err));
        }
        if (cuisines.length === 0 && !isLoadingCuisines && !errorCuisines) {
            fetchCuisines().catch(err => console.error('[FilterSection] Initial fetchCuisines failed:', err));
        }
    }, [fetchCities, fetchCuisines, cities.length, isLoadingCities, errorCities, cuisines.length, isLoadingCuisines, errorCuisines]);

    // Fetch neighborhoods when cityId changes
    useEffect(() => {
        if (cityId && !isLoadingNeighborhoods && !errorNeighborhoods) {
            fetchNeighborhoodsByCity(cityId).catch(err => console.error('[FilterSection] fetchNeighborhoodsByCity failed:', err));
        }
    }, [cityId, fetchNeighborhoodsByCity, isLoadingNeighborhoods, errorNeighborhoods]);

    const selectedCity = useMemo(() => cities.find(c => c.id === cityId), [cities, cityId]);
    const selectedNeighborhood = useMemo(() => neighborhoods.find(n => n.id === neighborhoodId), [neighborhoods, neighborhoodId]);

    const handleSelectCity = useCallback((selectedCityId) => {
        setCityId(selectedCityId);
        setNeighborhoodId(null);
        setFilterLevel('neighborhoods');
    }, [setCityId, setNeighborhoodId]);

    const handleSelectNeighborhood = useCallback((selectedNeighborhoodId) => {
        setNeighborhoodId(selectedNeighborhoodId);
        setFilterLevel('hashtags');
    }, [setNeighborhoodId]);

    const handleToggleHashtag = useCallback((hashtag) => {
        setHashtags(prev => 
            prev.includes(hashtag) ? prev.filter(h => h !== hashtag) : [...prev, hashtag]
        );
    }, [setHashtags]);

    const handleGoBack = useCallback(() => {
        if (filterLevel === 'hashtags') {
            setFilterLevel('neighborhoods');
        } else if (filterLevel === 'neighborhoods') {
            setNeighborhoodId(null);
            setFilterLevel('cities');
        } else {
            setCityId(null);
            clearError('neighborhoods');
        }
    }, [filterLevel, setNeighborhoodId, setCityId, clearError]);

    const handleClearAll = useCallback(() => {
        setCityId(null);
        setNeighborhoodId(null);
        setHashtags([]);
        setFilterLevel('cities');
        clearError('cities');
        clearError('neighborhoods');
        clearError('cuisines');
    }, [setCityId, setNeighborhoodId, setHashtags, clearError]);

    const renderPills = useCallback(() => {
        if (filterLevel === 'cities') {
            if (isLoadingCities) return <LoadingSpinner size="sm" message="Loading cities..." />;
            if (errorCities) return <ErrorMessage message={errorCities} onRetry={fetchCities} isLoadingRetry={isLoadingCities} />;
            if (cities.length === 0) return <p className="text-xs text-gray-500">No cities available.</p>;
            return cities.map((city) => (
                <PillButton
                    key={city.id}
                    label={city.name}
                    isActive={cityId === city.id}
                    onClick={() => handleSelectCity(city.id)}
                />
            ));
        } else if (filterLevel === 'neighborhoods') {
            if (isLoadingNeighborhoods) return <LoadingSpinner size="sm" message="Loading neighborhoods..." />;
            if (errorNeighborhoods) return <ErrorMessage message={errorNeighborhoods} onRetry={() => fetchNeighborhoodsByCity(cityId)} isLoadingRetry={isLoadingNeighborhoods} />;
            if (neighborhoods.length === 0) return <p className="text-xs text-gray-500">No neighborhoods found for {selectedCity?.name || 'this city'}.</p>;
            return neighborhoods.map((n) => (
                <PillButton
                    key={n.id}
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
                    key={h.id}
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
        handleSelectNeighborhood, handleToggleHashtag
    ]);

    return (
        <div className="mb-4 p-3 bg-white shadow-sm rounded-lg border border-gray-100 min-h-[70px]">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-y-1">
                <div className="flex items-center gap-2">
                    {(cityId || neighborhoodId || hashtags.length > 0) && (
                        <button onClick={handleGoBack} className="p-1 text-gray-500 hover:text-gray-800" aria-label="Back">
                            <ChevronLeft size={18} />
                        </button>
                    )}
                    <h3 className="text-sm font-semibold text-gray-700">
                        {filterLevel === 'cities' ? 'Filter by City' : 
                         filterLevel === 'neighborhoods' ? `Neighborhoods in ${selectedCity?.name || 'Selected City'}` : 
                         'Filter by Hashtag'}
                    </h3>
                </div>
                {(cityId || neighborhoodId || hashtags.length > 0) && (
                    <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5">
                        <XCircle size={14} /> Clear
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