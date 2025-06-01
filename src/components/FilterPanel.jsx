/* src/components/FilterPanel.jsx */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Loader2, Tag, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { filterService } from '@/services/filterService';
import { hashtagService } from '@/services/hashtagService';
import { neighborhoodService } from '@/services/neighborhoodService';
import PillButton from '@/components/UI/PillButton';
import usePrevious from '@/hooks/usePrevious';
import * as logger from '@/utils/logger';
import { mockTopHashtags, mockCities, mockBoroughs, getMockNeighborhoods } from '@/utils/mockData';

// Memoized safe data fetchers to prevent recreation on every render
const createSafeDataFetcher = (fetchFn, fallbackData, logContext) => {
  return async (...args) => {
    try {
      const result = await fetchFn(...args);
      if (Array.isArray(result) && result.length > 0) {
        return result;
      }
      logger.logWarn(`[FilterPanel] API returned invalid ${logContext} data, using fallback`);
      return fallbackData;
    } catch (error) {
      logger.logError(`[FilterPanel] Error fetching ${logContext}, using fallback:`, error);
      return fallbackData;
    }
  };
};

const FilterPanel = ({
  cityId: initialCityId,
  boroughId: initialBoroughId,
  neighborhoodId: initialNeighborhoodId,
  hashtags: initialCuisines,
  onFiltersChange
}) => {
  const [selectedCityId, setSelectedCityId] = useState(initialCityId);
  const [selectedBoroughId, setSelectedBoroughId] = useState(initialBoroughId);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState(initialNeighborhoodId);
  const [selectedCuisines, setSelectedCuisines] = useState(initialCuisines || []);
  const [showLocationFilters, setShowLocationFilters] = useState(true);
  const [showCuisineFilters, setShowCuisineFilters] = useState(true);

  // Memoized data fetchers - created once and reused
  const safeGetCities = useMemo(
    () => createSafeDataFetcher(filterService.getCities, mockCities, 'cities'),
    []
  );

  const safeGetBoroughs = useMemo(
    () => createSafeDataFetcher(
      (cityId) => neighborhoodService.getBoroughs(cityId),
      mockBoroughs,
      'boroughs'
    ),
    []
  );

  const safeGetNeighborhoods = useMemo(
    () => createSafeDataFetcher(
      (boroughId) => neighborhoodService.getNeighborhoods(boroughId),
      () => getMockNeighborhoods(selectedBoroughId),
      'neighborhoods'
    ),
    [selectedBoroughId]
  );

  // --- Data Fetching ---
  const { data: cities = [], isLoading: isLoadingCities, error: errorCities } = useQuery({
    queryKey: ['filterCities'],
    queryFn: safeGetCities,
    staleTime: Infinity,
    placeholderData: mockCities,
    retry: 1,
    useErrorBoundary: false,
    select: (data) => Array.isArray(data) ? data : mockCities,
  });

  const { 
    data: topHashtagsData = [], 
    isLoading: isLoadingCuisines,
    error: errorCuisines 
  } = useQuery({
    queryKey: ['topCuisines'],
    queryFn: () => hashtagService.getTopHashtags(15),
    staleTime: 60 * 60 * 1000, // 1 hour
    placeholderData: [],
    retry: 2,
    useErrorBoundary: false,
    select: (data) => Array.isArray(data) ? data : [],
  });
  
  // Log errors without disrupting UI
  useEffect(() => {
    if (errorCuisines) {
      logger.logError('[FilterPanel] Error fetching cuisines:', errorCuisines);
    }
  }, [errorCuisines]);
  
  // Memoized derived data to prevent unnecessary recalculations
  const topCuisineNames = useMemo(() => {
    if (!Array.isArray(topHashtagsData)) return [];
    try {
      return topHashtagsData
        .map(tag => tag && typeof tag.name === 'string' ? tag.name : '')
        .filter(Boolean);
    } catch (e) {
      logger.logError('[FilterPanel] Error extracting cuisine names:', e);
      return [];
    }
  }, [topHashtagsData]);

  const selectedCity = useMemo(() => 
    cities.find(c => c.id === selectedCityId), 
    [cities, selectedCityId]
  );
  
  const cityHasBoroughs = useMemo(() => 
    !!selectedCity?.has_boroughs, 
    [selectedCity]
  );

  // Borough query configuration
  const isBoroughQueryEnabled = useMemo(() => 
    !!selectedCityId && !!cityHasBoroughs, 
    [selectedCityId, cityHasBoroughs]
  );
  
  const { 
    data: boroughs = [], 
    isLoading: isLoadingBoroughs, 
    error: errorBoroughs 
  } = useQuery({
    queryKey: ['filterBoroughs', selectedCityId],
    queryFn: () => safeGetBoroughs(selectedCityId),
    enabled: isBoroughQueryEnabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    retry: 1,
    useErrorBoundary: false,
    select: (data) => Array.isArray(data) ? data : [],
  });

  // Neighborhood query configuration
  const isNeighborhoodQueryEnabled = useMemo(() => 
    !!selectedBoroughId && !!cityHasBoroughs, 
    [selectedBoroughId, cityHasBoroughs]
  );
  
  const { 
    data: neighborhoods = [], 
    isLoading: isLoadingNeighborhoods, 
    error: errorNeighborhoods 
  } = useQuery({
    queryKey: ['filterNeighborhoods', selectedBoroughId],
    queryFn: () => safeGetNeighborhoods(selectedBoroughId),
    enabled: isNeighborhoodQueryEnabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
    retry: 1,
    useErrorBoundary: false,
    select: (data) => Array.isArray(data) ? data : [],
  });

  // --- Effects ---
  // Reset borough/neighborhood if city changes
  const previousCityId = usePrevious(selectedCityId);
  useEffect(() => {
    if (selectedCityId !== previousCityId) {
      logger.logDebug('[FilterPanel] City changed, resetting borough/neighborhood');
      setSelectedBoroughId(null);
      setSelectedNeighborhoodId(null);
    }
  }, [selectedCityId, previousCityId]);

  // Reset neighborhood if borough changes
  const previousBoroughId = usePrevious(selectedBoroughId);
  useEffect(() => {
    if (selectedBoroughId !== previousBoroughId) {
      logger.logDebug('[FilterPanel] Borough changed, resetting neighborhood');
      setSelectedNeighborhoodId(null);
    }
  }, [selectedBoroughId, previousBoroughId]);

  // Memoized filter data to prevent unnecessary onFiltersChange calls
  const filterData = useMemo(() => ({
    cityId: selectedCityId,
    boroughId: selectedBoroughId,
    neighborhoodId: selectedNeighborhoodId,
    hashtags: selectedCuisines,
  }), [selectedCityId, selectedBoroughId, selectedNeighborhoodId, selectedCuisines]);

  // Call onFiltersChange when filter data changes
  useEffect(() => {
    logger.logDebug('[FilterPanel] Filters updated, calling onFiltersChange', filterData);
    onFiltersChange?.(filterData);
  }, [filterData, onFiltersChange]);

  // --- Memoized Event Handlers ---
  const handleCityClick = useCallback((id) => {
    const idInt = id ? parseInt(String(id), 10) : null;
    logger.logDebug('[FilterPanel] City clicked:', idInt);
    setSelectedCityId(prevId => (prevId === idInt ? null : idInt));
  }, []);

  const handleBoroughClick = useCallback((id) => {
    const idInt = id ? parseInt(String(id), 10) : null;
    logger.logDebug('[FilterPanel] Borough clicked:', idInt);
    setSelectedBoroughId(prevId => (prevId === idInt ? null : idInt));
  }, []);

  const handleNeighborhoodClick = useCallback((id) => {
    const idInt = id ? parseInt(String(id), 10) : null;
    logger.logDebug('[FilterPanel] Neighborhood clicked:', idInt);
    setSelectedNeighborhoodId(prevId => (prevId === idInt ? null : idInt));
  }, []);

  const handleCuisineClick = useCallback((cuisineName) => {
    logger.logDebug('[FilterPanel] Cuisine clicked:', cuisineName);
    setSelectedCuisines(prev =>
      prev.includes(cuisineName)
        ? prev.filter(c => c !== cuisineName)
        : [...prev, cuisineName]
    );
  }, []);

  // Memoized toggle handlers to prevent recreation
  const toggleLocationFilters = useCallback(() => {
    setShowLocationFilters(prev => !prev);
  }, []);

  const toggleCuisineFilters = useCallback(() => {
    setShowCuisineFilters(prev => !prev);
  }, []);

  // --- Memoized Render Helper ---
  const renderPillButtons = useCallback((items, isLoading, error, selectedValue, handler, noDataMessage = "No options available.") => {
    if (isLoading) {
      return <Loader2 size={16} className="animate-spin text-muted-foreground" />;
    }
    if (error) {
      return <span className="text-sm text-destructive">Error loading options.</span>;
    }
    if (!items || items.length === 0) {
      return <span className="text-sm text-muted-foreground">{noDataMessage}</span>;
    }
    return items.map(item => (
      <PillButton
        key={`${item.id || item.name}`}
        label={item.name}
        isActive={Array.isArray(selectedValue) ? selectedValue.includes(item.name) : selectedValue === item.id}
        onClick={() => handler(item.id || item.name)}
      />
    ));
  }, []);

  // --- Memoized cuisine data for better performance ---
  const cuisineItems = useMemo(() => 
    topCuisineNames.map(name => ({ name })), 
    [topCuisineNames]
  );

  return (
    <div className="bg-white border border-black rounded-lg p-4 space-y-4">
      {/* Location Section */}
      <div className="space-y-3">
        <button
          onClick={toggleLocationFilters}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <span className="flex items-center">
            <MapPin size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
            Location
          </span>
          {showLocationFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {showLocationFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pl-6 space-y-3 overflow-hidden"
            >
              {/* Cities */}
              <div className="flex flex-wrap gap-2">
                {renderPillButtons(cities, isLoadingCities, errorCities, selectedCityId, handleCityClick, "No cities available.")}
              </div>

              {/* Boroughs (conditionally rendered) */}
              {selectedCityId && cityHasBoroughs && (
                <div className="flex flex-wrap gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                  {renderPillButtons(boroughs, isLoadingBoroughs, errorBoroughs, selectedBoroughId, handleBoroughClick, "No boroughs found.")}
                </div>
              )}

              {/* Neighborhoods (conditionally rendered) */}
              {selectedBoroughId && cityHasBoroughs && (
                <div className="flex flex-wrap gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3 ml-3">
                  {renderPillButtons(neighborhoods, isLoadingNeighborhoods, errorNeighborhoods, selectedNeighborhoodId, handleNeighborhoodClick, "No neighborhoods found.")}
                </div>
              )}

              {/* Direct Neighborhoods if city has no boroughs */}
              {selectedCityId && !cityHasBoroughs && (
                <div className="flex flex-wrap gap-2 border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                  <span className="text-sm text-muted-foreground">Neighborhoods direct filter (coming soon)</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <hr className="border-gray-200 dark:border-gray-700" />

      {/* Cuisines Section */}
      <div className="space-y-3">
        <button
          onClick={toggleCuisineFilters}
          className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <span className="flex items-center">
            <Tag size={16} className="mr-2 text-gray-500 dark:text-gray-400" />
            Cuisines / Tags
          </span>
          {showCuisineFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {showCuisineFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pl-6 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {renderPillButtons(
                  cuisineItems,
                  isLoadingCuisines,
                  errorCuisines,
                  selectedCuisines,
                  handleCuisineClick,
                  "No popular cuisines found."
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FilterPanel;