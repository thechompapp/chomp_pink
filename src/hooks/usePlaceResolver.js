/**
 * usePlaceResolver Hook
 * 
 * Manages fetching place details from Google Places API for an array of parsed items.
 * Handles queuing, API calls, and updating items with place information.
 */
import { useState, useCallback, useRef } from 'react';
import { placeService } from '@/services/placeService';
import { filterService } from '@/services/filterService';
import { 
  formatPlaceDetails, 
  extractAddressComponents, 
  batchProcess,
  retryWithBackoff,
  APP_CONFIG
} from '@/utils/generalUtils';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Hook for resolving places from Google Places API
 * @returns {Object} - State and functions for place resolution
 */
const usePlaceResolver = () => {
  // State for items and processing
  const [items, setItems] = useState([]);
  const [resolvedItems, setResolvedItems] = useState([]);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingError, setResolvingError] = useState(null);
  
  // State for place selection
  const [placeSelections, setPlaceSelections] = useState([]);
  const [awaitingSelection, setAwaitingSelection] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  // Refs for caching
  const neighborhoodCache = useRef(new Map());
  const placeCache = useRef(new Map());
  
  /**
   * Fetch neighborhood by zipcode with caching
   * @param {string} zipcode - Zipcode to lookup
   * @param {number} cityId - City ID
   * @returns {Promise<Object>} - Neighborhood data
   */
  const fetchNeighborhoodByZipcode = useCallback(async (zipcode, cityId = APP_CONFIG.defaultCityId) => {
    if (!zipcode) {
      return getDefaultNeighborhood(cityId);
    }
    
    // Check cache first
    const cacheKey = `${zipcode}_${cityId}`;
    if (neighborhoodCache.current.has(cacheKey)) {
      return neighborhoodCache.current.get(cacheKey);
    }
    
    try {
      // Try to find neighborhood by zipcode with retry logic
      const neighborhood = await retryWithBackoff(() => 
        filterService.findNeighborhoodByZipcode(zipcode)
      );
      
      if (neighborhood && neighborhood.id) {
        // Cache the result
        neighborhoodCache.current.set(cacheKey, neighborhood);
        return neighborhood;
      }
      
      // If not found, get default neighborhood
      return await getDefaultNeighborhood(cityId);
    } catch (error) {
      logError(`[usePlaceResolver] Error fetching neighborhood for zipcode ${zipcode}:`, error);
      return await getDefaultNeighborhood(cityId);
    }
  }, []);
  
  /**
   * Get default neighborhood for a city
   * @param {number} cityId - City ID
   * @returns {Promise<Object>} - Default neighborhood
   */
  const getDefaultNeighborhood = useCallback(async (cityId = APP_CONFIG.defaultCityId) => {
    try {
      // Try to get neighborhoods for the city
      const neighborhoods = await retryWithBackoff(() => 
        filterService.getNeighborhoodsByCity(cityId)
      );
      
      if (neighborhoods && Array.isArray(neighborhoods) && neighborhoods.length > 0) {
        return neighborhoods[0];
      }
      
      // Default fallback
      return {
        id: 1,
        name: "Default Neighborhood",
        city_id: cityId
      };
    } catch (error) {
      logError(`[usePlaceResolver] Error getting default neighborhood:`, error);
      
      // Ultimate fallback
      return {
        id: 1,
        name: "Default Neighborhood",
        city_id: cityId
      };
    }
  }, []);
  
  /**
   * Process a single item to resolve place details
   * @param {Object} item - Item to process
   * @returns {Promise<Object>} - Processed item with place details
   */
  const resolvePlace = useCallback(async (item) => {
    if (!item || item.status === 'error') {
      return item;
    }
    
    logDebug(`[usePlaceResolver] Resolving place for: ${item.name}`);
    
    try {
      // Update status to processing
      const updatedItem = {
        ...item,
        status: 'processing',
        message: 'Looking up place...'
      };
      
      // Build search query
      const searchQuery = item.address 
        ? `${item.name}, ${item.address}`
        : item.name;
      
      // Check cache first
      if (placeCache.current.has(searchQuery)) {
        const cachedPlace = placeCache.current.get(searchQuery);
        logDebug(`[usePlaceResolver] Using cached place for: ${searchQuery}`);
        
        // If it's a single place, process it
        if (!Array.isArray(cachedPlace)) {
          return processSinglePlace(updatedItem, cachedPlace);
        }
        
        // If it's multiple places, handle selection
        if (cachedPlace.length > 0) {
          return handleMultiplePlaces(updatedItem, cachedPlace);
        }
        
        // No places found in cache
        return {
          ...updatedItem,
          status: 'error',
          message: 'No places found. Please check the name and address.'
        };
      }
      
      // Look up place with retry logic
      const places = await retryWithBackoff(() => 
        placeService.searchPlaces(searchQuery)
      );
      
      if (!places || places.length === 0) {
        return {
          ...updatedItem,
          status: 'error',
          message: 'No places found. Please check the name and address.'
        };
      }
      
      // Cache the results
      placeCache.current.set(searchQuery, places);
      
      // If multiple places found, handle selection
      if (places.length > 1) {
        return handleMultiplePlaces(updatedItem, places);
      }
      
      // Single place found, process it
      return processSinglePlace(updatedItem, places[0]);
    } catch (error) {
      logError(`[usePlaceResolver] Error resolving place for ${item.name}:`, error);
      return {
        ...item,
        status: 'error',
        message: `Error: ${error.message || 'Unknown error'}`
      };
    }
  }, []);
  
  /**
   * Handle multiple places found for an item
   * @param {Object} item - Item being processed
   * @param {Array} places - Places found
   * @returns {Object} - Updated item
   */
  const handleMultiplePlaces = useCallback((item, places) => {
    // Update global state for place selection dialog
    setPlaceSelections(places);
    setCurrentItem(item);
    setAwaitingSelection(true);
    
    // Return item with waiting status
    return {
      ...item,
      status: 'waiting',
      message: 'Multiple places found. Please select the correct one.',
      placeOptions: places
    };
  }, []);
  
  /**
   * Process a single place for an item
   * @param {Object} item - Item being processed
   * @param {Object} place - Place to process
   * @returns {Promise<Object>} - Processed item
   */
  const processSinglePlace = useCallback(async (item, place) => {
    try {
      // Get place details with retry logic
      const placeDetails = await retryWithBackoff(() => 
        placeService.getPlaceDetails(place.place_id)
      );
      
      if (!placeDetails) {
        return {
          ...item,
          status: 'error',
          message: 'Error getting place details.'
        };
      }
      
      // Format place details
      const formattedDetails = formatPlaceDetails(placeDetails, item.name);
      
      // Extract address components
      const addressComponents = extractAddressComponents(formattedDetails);
      
      // Get neighborhood by zipcode
      const neighborhood = await fetchNeighborhoodByZipcode(
        addressComponents.zipcode,
        APP_CONFIG.defaultCityId
      );
      
      // Return item with place details
      return {
        ...item,
        ...addressComponents,
        placeId: formattedDetails.placeId,
        formatted_address: formattedDetails.formatted_address,
        latitude: formattedDetails.geometry.location.lat,
        longitude: formattedDetails.geometry.location.lng,
        neighborhood_id: neighborhood?.id || 1,
        neighborhood: neighborhood?.name || 'Default Neighborhood',
        city_id: neighborhood?.city_id || APP_CONFIG.defaultCityId,
        status: 'ready',
        message: 'Ready for submission',
        _processed: true
      };
    } catch (error) {
      logError(`[usePlaceResolver] Error processing place details:`, error);
      return {
        ...item,
        status: 'error',
        message: `Error: ${error.message || 'Unknown error'}`
      };
    }
  }, [fetchNeighborhoodByZipcode]);
  
  /**
   * Select a place for an item when multiple options are available
   * @param {Object} selectedPlace - Selected place
   */
  const selectPlace = useCallback(async (selectedPlace) => {
    if (!currentItem || !selectedPlace) return;
    
    try {
      setAwaitingSelection(false);
      
      // Process the selected place
      const processedItem = await processSinglePlace(currentItem, selectedPlace);
      
      // Update the resolved items
      setResolvedItems(prev => {
        const updatedItems = [...prev];
        const itemIndex = updatedItems.findIndex(i => 
          i._lineNumber === currentItem._lineNumber
        );
        
        if (itemIndex !== -1) {
          updatedItems[itemIndex] = processedItem;
        }
        
        return updatedItems;
      });
    } catch (error) {
      logError(`[usePlaceResolver] Error selecting place:`, error);
      
      // Update the item with error
      setResolvedItems(prev => {
        const updatedItems = [...prev];
        const itemIndex = updatedItems.findIndex(i => 
          i._lineNumber === currentItem._lineNumber
        );
        
        if (itemIndex !== -1) {
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            status: 'error',
            message: `Error: ${error.message || 'Unknown error'}`
          };
        }
        
        return updatedItems;
      });
    } finally {
      setCurrentItem(null);
    }
  }, [currentItem, processSinglePlace]);
  
  /**
   * Cancel place selection and mark item as error
   */
  const cancelPlaceSelection = useCallback(() => {
    if (!currentItem) return;
    
    setAwaitingSelection(false);
    
    // Update the item with error
    setResolvedItems(prev => {
      const updatedItems = [...prev];
      const itemIndex = updatedItems.findIndex(i => 
        i._lineNumber === currentItem._lineNumber
      );
      
      if (itemIndex !== -1) {
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          status: 'error',
          message: 'Place selection cancelled'
        };
      }
      
      return updatedItems;
    });
    
    setCurrentItem(null);
  }, [currentItem]);
  
  /**
   * Resolve places for multiple items
   * @param {Array} itemsToResolve - Items to resolve
   * @returns {Promise<Array>} - Resolved items
   */
  const resolvePlaces = useCallback(async (itemsToResolve) => {
    if (!itemsToResolve || !Array.isArray(itemsToResolve) || itemsToResolve.length === 0) {
      setResolvingError('No items to resolve');
      return [];
    }
    
    try {
      setIsResolving(true);
      setResolvingError(null);
      setItems(itemsToResolve);
      
      logInfo(`[usePlaceResolver] Resolving places for ${itemsToResolve.length} items`);
      
      // Process items in batches
      const resolvedResults = await batchProcess(
        itemsToResolve,
        resolvePlace,
        APP_CONFIG.batchSize,
        (batchResults) => {
          // Update resolved items as each batch completes
          setResolvedItems(prev => [...prev, ...batchResults]);
        }
      );
      
      logInfo(`[usePlaceResolver] Finished resolving ${resolvedResults.length} items`);
      
      // Set final resolved items
      setResolvedItems(resolvedResults);
      
      return resolvedResults;
    } catch (error) {
      logError('[usePlaceResolver] Error resolving places:', error);
      setResolvingError(error.message || 'Error resolving places');
      return [];
    } finally {
      setIsResolving(false);
    }
  }, [resolvePlace]);
  
  /**
   * Reset the resolver state
   */
  const resetResolver = useCallback(() => {
    setItems([]);
    setResolvedItems([]);
    setIsResolving(false);
    setResolvingError(null);
    setPlaceSelections([]);
    setAwaitingSelection(false);
    setCurrentItem(null);
  }, []);
  
  return {
    // State
    items,
    resolvedItems,
    isResolving,
    resolvingError,
    placeSelections,
    awaitingSelection,
    currentItem,
    
    // Functions
    resolvePlaces,
    selectPlace,
    cancelPlaceSelection,
    resetResolver
  };
};

export default usePlaceResolver;
