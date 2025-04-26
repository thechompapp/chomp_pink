/* src/components/FilterPanel.jsx */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Loader2, Tag, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import filterService from '@/services/filterService';
import { hashtagService } from '@/services/hashtagService';
import neighborhoodService from '@/services/neighborhoodService';
import PillButton from '@/components/UI/PillButton'; // Ensure PillButton is imported
import usePrevious from '@/hooks/usePrevious';
import * as logger from '@/utils/logger';

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

  // Cities
  const { data: cities = [], isLoading: isLoadingCities, error: errorCities } = useQuery({
    queryKey: ['filterCities'],
    queryFn: filterService.getCities,
    staleTime: Infinity,
    placeholderData: [], // Provide empty array as placeholder
    onError: (err) => logger.logError('[FilterPanel] Error fetching cities:', err),
  });

  // Top Cuisines/Tags (assuming hashtags are used as cuisines)
  const { data: topHashtagsData = [], isLoading: isLoadingCuisines, error: errorCuisines } = useQuery({
      queryKey: ['topCuisines'],
      queryFn: () => hashtagService.getTopHashtags(), // Fetches top hashtags
      staleTime: 60 * 60 * 1000, // 1 hour
      placeholderData: [], // Provide empty array as placeholder
      onError: (err) => logger.logError('[FilterPanel] Error fetching top cuisines:', err),
      retry: 1,
  });
  // Extract just the names for display/selection
  const topCuisineNames = useMemo(() => Array.isArray(topHashtagsData) ? topHashtagsData.map(tag => tag.name) : [], [topHashtagsData]);


  // Derived state
  const selectedCity = useMemo(() => cities.find(c => c.id === selectedCityId), [cities, selectedCityId]);
  // Determine if the selected city uses boroughs based on API data
  const cityHasBoroughs = useMemo(() => !!selectedCity?.has_boroughs, [selectedCity]);

  // Boroughs
  const isBoroughQueryEnabled = !!selectedCityId && !!cityHasBoroughs;
  const { data: boroughs = [], isLoading: isLoadingBoroughs, error: errorBoroughs } = useQuery({
    queryKey: ['filterBoroughs', selectedCityId],
    queryFn: isBoroughQueryEnabled ? () => neighborhoodService.getBoroughs(selectedCityId) : disabledQueryFn,
    enabled: isBoroughQueryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: [], // Provide empty array as placeholder
    onError: (err) => logger.logError('[FilterPanel] Error fetching boroughs:', err),
  });

  // Neighborhoods
  // Enable only if a borough is selected AND the city uses boroughs
  const isNeighborhoodQueryEnabled = !!selectedBoroughId && !!cityHasBoroughs;
  const { data: neighborhoods = [], isLoading: isLoadingNeighborhoods, error: errorNeighborhoods } = useQuery({
    queryKey: ['filterNeighborhoods', selectedBoroughId],
    queryFn: isNeighborhoodQueryEnabled ? () => neighborhoodService.getNeighborhoods(selectedBoroughId) : disabledQueryFn,
    enabled: isNeighborhoodQueryEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: [], // Provide empty array as placeholder
    onError: (err) => logger.logError('[FilterPanel] Error fetching neighborhoods:', err),
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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 space-y-4">
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
                                    {/* Assuming getNeighborhoods works with city_id if no boroughs */}
                                    {/* Adjust query/service if needed */}
                                    {/* Example - you might need a different query here */}
                                    {/* renderPillButtons(neighborhoodsDirect, isLoadingNeighDirect, ..., handleNeighborhoodClick) */}
                                     <span className="text-sm text-muted-foreground">Neighborhoods direct filter (TODO)</span>
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