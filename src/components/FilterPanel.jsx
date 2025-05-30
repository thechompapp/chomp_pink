/* src/components/FilterPanel.jsx */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Loader2, Tag, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { filterService } from '@/services/filterService'; // Updated to use named import for API standardization
import { hashtagService } from '@/services/hashtagService';
import { neighborhoodService } from '@/services/neighborhoodService'; // Updated to use named import for API standardization
import PillButton from '@/components/UI/PillButton'; // Ensure PillButton is imported
import usePrevious from '@/hooks/usePrevious';
import * as logger from '@/utils/logger';
// Import mock data fallbacks for resilience
import { mockTopHashtags, mockCities, mockBoroughs, getMockNeighborhoods } from '@/utils/mockData';

// Placeholder async function for disabled queries
const disabledQueryFn = async () => Promise.resolve([]);

const FilterPanel = ({
  cityId: initialCityId,
  boroughId: initialBoroughId,
  neighborhoodId: initialNeighborhoodId,
  hashtags: initialCuisines, // Renamed for clarity, assuming hashtags are cuisines here
  onFiltersChange
}) => {
  const [selectedCityId, setSelectedCityId] = useState(initialCityId);
  const [selectedBoroughId, setSelectedBoroughId] = useState(initialBoroughId);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState(initialNeighborhoodId);
  const [selectedCuisines, setSelectedCuisines] = useState(initialCuisines || []); // Use initialCuisines
  const [showLocationFilters, setShowLocationFilters] = useState(true);
  const [showCuisineFilters, setShowCuisineFilters] = useState(true);

  // --- Data Fetching ---

  // Create a safe cities fetcher that uses mock data as fallback
  const safeGetCities = async () => {
    try {
      const result = await filterService.getCities();
      if (Array.isArray(result) && result.length > 0) {
        return result;
      }
      logger.logWarn('[FilterPanel] API returned invalid cities data, using mock data');
      return mockCities;
    } catch (error) {
      logger.logError('[FilterPanel] Error fetching cities, using mock data:', error);
      return mockCities;
    }
  };
  
  // Cities with fallback to mock data
  const { data: cities = [], isLoading: isLoadingCities, error: errorCities } = useQuery({
    queryKey: ['filterCities'],
    queryFn: safeGetCities,
    staleTime: Infinity,
    placeholderData: mockCities, // Use mock data as placeholder while loading
    retry: 1,
    useErrorBoundary: false,
    select: (data) => Array.isArray(data) ? data : mockCities,
  });

  // Use the improved hashtagService directly - it already handles errors and provides mock data
  const { 
    data: topHashtagsData = [], 
    isLoading: isLoadingCuisines,
    error: errorCuisines 
  } = useQuery({
    queryKey: ['topCuisines'],
    queryFn: () => hashtagService.getTopHashtags(15),
    staleTime: 60 * 60 * 1000, // 1 hour
    placeholderData: [], // Empty array placeholder
    retry: 2,
    // Prevent query from going to error state which can cause rendering issues
    useErrorBoundary: false,
    // This guarantees even on error we get a valid array
    select: (data) => Array.isArray(data) ? data : [],
  });
  
  // Log any errors for debugging but don't disrupt the UI
  useEffect(() => {
    if (errorCuisines) {
      logger.logError('[FilterPanel] Error fetching cuisines:', errorCuisines);
    }
  }, [errorCuisines]);
  
  // Safely extract cuisine names with additional validation
  const topCuisineNames = useMemo(() => {
    if (!Array.isArray(topHashtagsData)) return [];
    try {
      return topHashtagsData.map(tag => tag && typeof tag.name === 'string' ? tag.name : '').filter(Boolean);
    } catch (e) {
      logger.logError('[FilterPanel] Error extracting cuisine names:', e);
      return [];
    }
  }, [topHashtagsData]);


  // Derived state
  const selectedCity = useMemo(() => cities.find(c => c.id === selectedCityId), [cities, selectedCityId]);
  // Determine if the selected city uses boroughs based on API data
  const cityHasBoroughs = useMemo(() => !!selectedCity?.has_boroughs, [selectedCity]);

  // Boroughs with safe error handling
  const isBoroughQueryEnabled = !!selectedCityId && !!cityHasBoroughs;
  
  // Create a safe borough fetcher that never throws
  const safeGetBoroughs = async () => {
    if (!isBoroughQueryEnabled) return [];
    try {
      const result = await neighborhoodService.getBoroughs(selectedCityId);
      if (Array.isArray(result) && result.length > 0) {
        return result;
      }
      // If the selected city is New York (ID 1) or if it has boroughs, use mock data
      if (selectedCityId === 1 || selectedCity?.has_boroughs) {
        logger.logWarn('[FilterPanel] API returned invalid borough data, using mock data');
        return mockBoroughs;
      }
      return [];
    } catch (error) {
      logger.logError('[FilterPanel] Error in safeGetBoroughs, using mock data:', error);
      // Only use mock data for New York (ID 1) or if city has boroughs
      if (selectedCityId === 1 || selectedCity?.has_boroughs) {
        return mockBoroughs;
      }
      return [];
    }
  };
  
  // Use resilient query configuration for boroughs
  const { 
    data: boroughs = [], 
    isLoading: isLoadingBoroughs, 
    error: errorBoroughs 
  } = useQuery({
    queryKey: ['filterBoroughs', selectedCityId],
    queryFn: safeGetBoroughs,
    enabled: isBoroughQueryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: [],
    retry: 1,
    useErrorBoundary: false,
    select: (data) => Array.isArray(data) ? data : [],
  });

  // Neighborhoods with safe error handling
  // Enable only if a borough is selected AND the city uses boroughs
  const isNeighborhoodQueryEnabled = !!selectedBoroughId && !!cityHasBoroughs;
  
  // Create a safe neighborhood fetcher that never throws
  const safeGetNeighborhoods = async () => {
    if (!isNeighborhoodQueryEnabled) return [];
    try {
      const result = await neighborhoodService.getNeighborhoods(selectedBoroughId);
      if (Array.isArray(result) && result.length > 0) {
        return result;
      }
      // Use mock neighborhoods as fallback
      logger.logWarn('[FilterPanel] API returned invalid neighborhood data, using mock data');
      return getMockNeighborhoods(selectedBoroughId);
    } catch (error) {
      logger.logError('[FilterPanel] Error in safeGetNeighborhoods, using mock data:', error);
      return getMockNeighborhoods(selectedBoroughId);
    }
  };
  
  // Use resilient query configuration for neighborhoods
  const { 
    data: neighborhoods = [], 
    isLoading: isLoadingNeighborhoods, 
    error: errorNeighborhoods 
  } = useQuery({
    queryKey: ['filterNeighborhoods', selectedBoroughId],
    queryFn: safeGetNeighborhoods,
    enabled: isNeighborhoodQueryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // Call onFiltersChange when any relevant state changes
  useEffect(() => {
    logger.logDebug('[FilterPanel] Filters updated, calling onFiltersChange', { cityId: selectedCityId, boroughId: selectedBoroughId, neighborhoodId: selectedNeighborhoodId, hashtags: selectedCuisines });
    onFiltersChange?.({
      cityId: selectedCityId,
      boroughId: selectedBoroughId,
      neighborhoodId: selectedNeighborhoodId,
      hashtags: selectedCuisines, // Pass selected cuisines as 'hashtags' prop
    });
  }, [selectedCityId, selectedBoroughId, selectedNeighborhoodId, selectedCuisines, onFiltersChange]);


  // --- Event Handlers ---

  const handleCityClick = useCallback((id) => {
    const idInt = id ? parseInt(String(id), 10) : null;
    logger.logDebug('[FilterPanel] City clicked:', idInt);
    setSelectedCityId(prevId => (prevId === idInt ? null : idInt)); // Toggle selection
  }, []);

  const handleBoroughClick = useCallback((id) => {
    const idInt = id ? parseInt(String(id), 10) : null;
     logger.logDebug('[FilterPanel] Borough clicked:', idInt);
    setSelectedBoroughId(prevId => (prevId === idInt ? null : idInt)); // Toggle selection
  }, []);

  const handleNeighborhoodClick = useCallback((id) => {
    const idInt = id ? parseInt(String(id), 10) : null;
    logger.logDebug('[FilterPanel] Neighborhood clicked:', idInt);
    setSelectedNeighborhoodId(prevId => (prevId === idInt ? null : idInt)); // Toggle selection
  }, []);

  const handleCuisineClick = useCallback((cuisineName) => {
    logger.logDebug('[FilterPanel] Cuisine clicked:', cuisineName);
    setSelectedCuisines(prev =>
      prev.includes(cuisineName)
        ? prev.filter(c => c !== cuisineName) // Remove if exists
        : [...prev, cuisineName] // Add if doesn't exist
    );
  }, []);

  // --- Render Logic ---

  // Helper to render loading/error/data states for pill buttons
  const renderPillButtons = (items, isLoading, error, selectedId, handler, noDataMessage = "No options available.") => {
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
        key={`${item.id || item.name}`} // Use name if id isn't available (like for cuisines)
        label={item.name}
        isActive={Array.isArray(selectedId) ? selectedId.includes(item.name) : selectedId === item.id}
        onClick={() => handler(item.id || item.name)} // Pass id or name
      />
    ));
  };

  return (
      <div className="bg-white border border-black rounded-lg p-4 space-y-4">
          {/* Location Section */}
          <div className="space-y-3">
              <button
                  onClick={() => setShowLocationFilters(!showLocationFilters)}
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
                  onClick={() => setShowCuisineFilters(!showCuisineFilters)}
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
                                topCuisineNames.map(name => ({ name })), // Map names to objects for consistency if needed
                                isLoadingCuisines,
                                errorCuisines,
                                selectedCuisines, // Pass array of selected names
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