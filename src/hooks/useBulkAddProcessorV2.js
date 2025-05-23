/* src/hooks/useBulkAddProcessorV2.js */
/**
 * Refactored hook for processing bulk add operations.
 * Improves performance with batch processing and reduces complexity.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { placeService } from '../services/placeService.js';
import { filterService } from '../services/filterService.js';
import { adminService } from '../services/adminService.js';
import { restaurantService } from '../services/restaurantService.js';
import { 
  logDebug, 
  logError, 
  logWarn, 
  logInfo,
  startPerformanceTracking,
  endPerformanceTracking
} from '../utils/logger.js';
import {
  findLocalDuplicates,
  markLocalDuplicates,
  formatPlaceDetails,
  extractAddressComponents,
  formatItemForSubmission,
  batchProcess,
  parseRawInput,
  zipToNeighborhoodMap,
  BULK_ADD_CONFIG
} from '../utils/bulkAddUtils.js';

/**
 * Hook for processing bulk add operations with improved performance.
 * @param {string} itemType - Type of items to process ('restaurants' or 'dishes')
 * @returns {Object} - State and functions for bulk add processing
 */
function useBulkAddProcessorV2(itemType = 'restaurants') {
  // State for items and processed items
  const [items, setItems] = useState([]);
  const [processedItems, setProcessedItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  
  // State for place selection
  const [placeSelections, setPlaceSelections] = useState([]);
  const [awaitingSelection, setAwaitingSelection] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1);
  const [currentProcessingItem, setCurrentProcessingItem] = useState(null);
  const [error, setError] = useState(null);
  
  // State for submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // Refs for caching and optimization
  const neighborhoodCache = useRef(new Map());
  const cityCache = useRef(new Map());
  const processingQueue = useRef([]);
  
  const queryClient = useQueryClient();
  
  /**
   * Enhanced error handler with specific error messages based on error type
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   */
  const handleError = useCallback((error, context = 'Unknown context') => {
    // Log the error with context
    logError(`[BulkAddProcessor] ${context}:`, error);
    console.error(`[BulkAddProcessor] ${context} details:`, error);
    
    // Set the error state
    setError({
      message: error.message || 'An unknown error occurred',
      context,
      timestamp: new Date().toISOString(),
      details: error
    });
    
    // Return a formatted error message
    return `Error: ${error.message || 'An unknown error occurred'}`;
  }, []);
  
  /**
   * Parse raw input text into structured items
   * @param {string} rawText - Raw input text
   * @returns {Array} - Parsed items
   */
  const parseItems = useCallback((rawText) => {
    if (!rawText || !rawText.trim()) {
      setError('Please enter some data to process');
      return [];
    }
    
    try {
      // Use the parseRawInput utility from bulkAddUtils
      const parsedItems = parseRawInput(rawText);
      logInfo(`[BulkAddProcessor] Parsed ${parsedItems.length} items from input`);
      
      // Check for local duplicates
      const duplicates = findLocalDuplicates(parsedItems);
      
      if (duplicates.length > 0) {
        logWarn(`[BulkAddProcessor] Found ${duplicates.length} duplicate items in input`);
        
        // Mark duplicates in the parsed items
        const markedItems = markLocalDuplicates(parsedItems, duplicates);
        setItems(markedItems);
      } else {
        setItems(parsedItems);
      }
      
      // Reset processed items when parsing new input
      setProcessedItems([]);
      setError(null);
      
      return parsedItems;
    } catch (err) {
      logError('[BulkAddProcessor] Error parsing input:', err);
      setError(`Error parsing input: ${err.message}`);
      return [];
    }
  }, []);
  
  /**
   * Reset the processor state
   */
  const resetProcessor = useCallback(() => {
    setItems([]);
    setProcessedItems([]);
    setIsProcessing(false);
    setProcessingError(null);
    setPlaceSelections([]);
    setAwaitingSelection(false);
    setCurrentProcessingIndex(-1);
    setCurrentProcessingItem(null);
    setError(null);
    setIsSubmitting(false);
    setSubmissionResult(null);
    
    // Clear caches
    neighborhoodCache.current.clear();
    cityCache.current.clear();
    processingQueue.current = [];
    
    logDebug('[BulkAddProcessor] Processor state reset');
  }, []);
  
  /**
   * Fetch neighborhood by zipcode with enhanced caching and fallback
   * @param {string} zipcode - Zipcode to lookup
   * @param {number} cityId - City ID for context
   * @returns {Promise<Object>} - Neighborhood data
   */
  const fetchNeighborhoodByZipcode = useCallback(async (zipcode, cityId = BULK_ADD_CONFIG.defaultCityId) => {
    if (!zipcode) {
      logDebug(`[BulkAddProcessor] No zipcode provided, using default neighborhood`);
      return getDefaultNeighborhood(cityId);
    }
    
    // Check cache first
    const cacheKey = `${zipcode}_${cityId}`;
    if (neighborhoodCache.current.has(cacheKey)) {
      const cachedNeighborhood = neighborhoodCache.current.get(cacheKey);
      logDebug(`[BulkAddProcessor] Using cached neighborhood for zipcode ${zipcode}:`, cachedNeighborhood.name);
      return cachedNeighborhood;
    }
    
    // Check hardcoded map for testing/fallback
    if (zipToNeighborhoodMap[zipcode]) {
      const hardcodedNeighborhood = zipToNeighborhoodMap[zipcode];
      logDebug(`[BulkAddProcessor] Using hardcoded neighborhood for zipcode ${zipcode}:`, hardcodedNeighborhood.name);
      neighborhoodCache.current.set(cacheKey, hardcodedNeighborhood);
      return hardcodedNeighborhood;
    }
    
    try {
      // Try to find neighborhood by zipcode
      logDebug(`[BulkAddProcessor] Fetching neighborhood for zipcode ${zipcode} from API`);
      const neighborhood = await filterService.findNeighborhoodByZipcode(zipcode);
      
      if (neighborhood && neighborhood.id && neighborhood.name) {
        // Cache the result
        logDebug(`[BulkAddProcessor] Found neighborhood for zipcode ${zipcode}:`, neighborhood.name);
        neighborhoodCache.current.set(cacheKey, neighborhood);
        return neighborhood;
      }
      
      // If not found, try to get default neighborhood for city
      logDebug(`[BulkAddProcessor] No neighborhood found for zipcode ${zipcode}, using default`);
      return await getDefaultNeighborhood(cityId);
    } catch (error) {
      logError(`[BulkAddProcessor] Error fetching neighborhood for zipcode ${zipcode}:`, error);
      console.error(`[BulkAddProcessor] Error details:`, error);
      return await getDefaultNeighborhood(cityId);
    }
  }, []);

  /**
   * Get default neighborhood for a city
   * @param {number} cityId - City ID
   * @returns {Promise<Object>} - Default neighborhood
   */
  const getDefaultNeighborhood = useCallback(async (cityId = BULK_ADD_CONFIG.defaultCityId) => {
    // Ensure cityId is a number
    const numericCityId = Number(cityId) || BULK_ADD_CONFIG.defaultCityId;
    
    // Check cache first
    if (cityCache.current.has(numericCityId)) {
      const cachedNeighborhood = cityCache.current.get(numericCityId);
      logDebug(`[BulkAddProcessor] Using cached default neighborhood for city ${numericCityId}:`, cachedNeighborhood.name);
      return cachedNeighborhood;
    }
    
    try {
      // Try to get neighborhoods for the city
      logDebug(`[BulkAddProcessor] Fetching neighborhoods for city ${numericCityId} from API`);
      const cityNeighborhoods = await filterService.getNeighborhoodsByCity(numericCityId);
      
      if (cityNeighborhoods && Array.isArray(cityNeighborhoods) && cityNeighborhoods.length > 0) {
        // Use the first neighborhood as default
        const defaultNeighborhood = cityNeighborhoods[0];
        logDebug(`[BulkAddProcessor] Using first neighborhood for city ${numericCityId}:`, defaultNeighborhood.name);
        
        cityCache.current.set(numericCityId, defaultNeighborhood);
        return defaultNeighborhood;
      }
      
      logWarn(`[BulkAddProcessor] No neighborhoods found for city ${numericCityId}, using fallback`);
    } catch (error) {
      logError(`[BulkAddProcessor] Error getting neighborhoods for city_id ${numericCityId}:`, error);
      console.error(`[BulkAddProcessor] Error details:`, error);
    }
    
    // Fallback to hardcoded default
    const fallbackNeighborhood = { name: "Default Neighborhood", id: BULK_ADD_CONFIG.defaultNeighborhoodId };
    logDebug(`[BulkAddProcessor] Using fallback neighborhood:`, fallbackNeighborhood.name);
    return fallbackNeighborhood;
  }, []);

  /**
   * Process place details for a restaurant
   * @param {Object} placeDetails - Place details from Google Places API
   * @returns {Object} - Processed place details
   */
  const processPlaceDetails = useCallback(async (placeDetails) => {
    if (!placeDetails || !placeDetails.place_id) {
      throw new Error('Invalid place details provided');
    }
    
    try {
      // Format place details
      const formattedPlace = formatPlaceDetails(placeDetails);
      
      // Extract address components
      const addressComponents = extractAddressComponents(placeDetails);
      
      // Get neighborhood by zipcode
      let neighborhood = null;
      if (addressComponents.postalCode) {
        neighborhood = await fetchNeighborhoodByZipcode(addressComponents.postalCode);
      } else {
        // Fallback to default neighborhood
        neighborhood = await getDefaultNeighborhood();
      }
      
      // Return processed place with neighborhood
      return {
        ...formattedPlace,
        neighborhood_id: neighborhood.id,
        neighborhood_name: neighborhood.name,
        address_components: addressComponents
      };
    } catch (error) {
      logError('[BulkAddProcessor] Error processing place details:', error);
      console.error('[BulkAddProcessor] Place details:', placeDetails);
      throw error;
    }
  }, [fetchNeighborhoodByZipcode, getDefaultNeighborhood]);

  /**
   * Process a single bulk add item
   * @param {Object} item - Item to process
   * @param {number} index - Index of the item in the array
   * @param {Array} currentItems - Current items array for updates
   * @returns {Promise<Object>} - Processed item
   */
  const processBulkAddItem = useCallback(async (item, index, currentItems) => {
    if (!item) {
      return {
        _lineNumber: index + 1,
        status: 'error',
        message: 'Invalid item: empty or undefined'
      };
    }
    
    // Update status to processing
    const updatedItems = [...currentItems];
    updatedItems[index] = {
      ...updatedItems[index],
      status: 'processing',
      message: 'Processing...'
    };
    setProcessedItems([...updatedItems]);
    
    try {
      const { name, type: itemType } = item;
      
      if (!name) {
        updatedItems[index].status = 'error';
        updatedItems[index].message = 'Name is required';
        setProcessedItems([...updatedItems]);
        return updatedItems[index];
      }
      
      if (itemType === 'restaurant') {
        try {
          // Search for place
          const searchResult = await placeService.searchPlaces(name);
          
          if (!searchResult || !Array.isArray(searchResult.results) || searchResult.results.length === 0) {
            updatedItems[index].status = 'error';
            updatedItems[index].message = 'No places found for this restaurant name';
            setProcessedItems([...updatedItems]);
            return updatedItems[index];
          }
          
          // If multiple places found, handle selection
          if (searchResult.results.length > 1) {
            // Check if we're already awaiting selection
            if (awaitingSelection) {
              updatedItems[index].status = 'pending';
              updatedItems[index].message = 'Waiting for previous selection to complete';
              setProcessedItems([...updatedItems]);
              return updatedItems[index];
            }
            
            // Set up for place selection
            setPlaceSelections(searchResult.results);
            setAwaitingSelection(true);
            setCurrentProcessingIndex(index);
            setCurrentProcessingItem(item);
            
            updatedItems[index].status = 'pending';
            updatedItems[index].message = 'Multiple places found. Please select one.';
            setProcessedItems([...updatedItems]);
            return updatedItems[index];
          }
          
          // Single place found, get details
          const place = searchResult.results[0];
          const placeDetails = await placeService.getPlaceDetails(place.place_id);
          
          if (!placeDetails) {
            updatedItems[index].status = 'error';
            updatedItems[index].message = 'Failed to get place details';
            setProcessedItems([...updatedItems]);
            return updatedItems[index];
          }
          
          // Process place details
          const processedPlace = await processPlaceDetails(placeDetails);
          
          // Update item with place details
          updatedItems[index] = {
            ...updatedItems[index],
            ...processedPlace,
            status: 'ready',
            message: 'Ready for submission'
          };
          
          setProcessedItems([...updatedItems]);
          return updatedItems[index];
        } catch (error) {
          // Log directly to console for immediate visibility
          console.error(`[BulkAddProcessor] Error processing restaurant at index ${index}:`, error);
          console.error(`[BulkAddProcessor] Restaurant name:`, name);
          console.error(`[BulkAddProcessor] Item data:`, item);
          
          logError(`[BulkAddProcessor] Error processing restaurant:`, error);
          updatedItems[index].status = 'error';
          updatedItems[index].message = `Error processing restaurant: ${error.message}`;
          setProcessedItems([...updatedItems]);
          return updatedItems[index];
        }
      } else if (itemType === 'dish') {
        try {
          const restaurantName = item.restaurant_name || item.location;
          
          if (!restaurantName) {
            updatedItems[index].status = 'error';
            updatedItems[index].message = 'Restaurant name is required for dishes';
            setProcessedItems([...updatedItems]);
            return updatedItems[index];
          }
          
          // Search for restaurant
          const searchResult = await restaurantService.searchRestaurants(restaurantName);
          
          if (!searchResult || !Array.isArray(searchResult) || searchResult.length === 0) {
            updatedItems[index].status = 'error';
            updatedItems[index].message = `Restaurant "${restaurantName}" not found`;
            setProcessedItems([...updatedItems]);
            return updatedItems[index];
          }
          
          // If multiple restaurants found, handle selection
          if (searchResult.length > 1) {
            updatedItems[index].status = 'pending';
            updatedItems[index].message = 'Multiple restaurants found. Please select one.';
            
            // Add to restaurant selections queue (would need to implement this part of the UI)
            // For now, just use the first restaurant
            const selectedRestaurant = searchResult[0];
            updatedItems[index].restaurant_id = selectedRestaurant.id;
            updatedItems[index].restaurant_name = selectedRestaurant.name;
            updatedItems[index].status = 'ready';
            updatedItems[index].message = `Dish will be added to ${selectedRestaurant.name}`;
          } else {
            // Single restaurant match found
            const restaurant = searchResult[0];
            updatedItems[index].restaurant_id = restaurant.id;
            updatedItems[index].restaurant_name = restaurant.name;
            updatedItems[index].status = 'ready';
            updatedItems[index].message = `Dish will be added to ${restaurant.name}`;
          }
          
          setProcessedItems([...updatedItems]);
          return updatedItems[index];
        } catch (searchError) {
          // Log directly to console for immediate visibility
          console.error(`[BulkAddProcessor] Error searching for restaurant at index ${index}:`, searchError);
          console.error(`[BulkAddProcessor] Restaurant name:`, item.restaurant_name || item.location);
          console.error(`[BulkAddProcessor] Item data:`, item);
          
          logError(`[BulkAddProcessor] Error searching for restaurant:`, searchError);
          updatedItems[index].status = 'error';
          updatedItems[index].message = `Error finding restaurant: ${searchError.message}`;
          setProcessedItems([...updatedItems]);
          return updatedItems[index];
        }
      } else {
        // Unknown item type
        updatedItems[index].status = 'error';
        updatedItems[index].message = `Unknown item type: ${itemType}`;
        setProcessedItems([...updatedItems]);
        return updatedItems[index];
      }
    } catch (error) {
      // Log directly to console for immediate visibility
      console.error(`[BulkAddProcessor] Unexpected error processing item at index ${index}:`, error);
      console.error(`[BulkAddProcessor] Item data:`, item);
      console.error(`[BulkAddProcessor] Stack trace:`, error.stack);
      
      logError(`[BulkAddProcessor] Unexpected error processing item:`, error);
      
      // Create a detailed error message
      let errorMessage = `Unexpected error: ${error.message || 'Unknown error'}`;
      
      // Add more context based on error type
      if (error.name === 'NetworkError' || error.message?.includes('network')) {
        errorMessage = `Network error: Please check your internet connection. ${error.message}`;
      } else if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
        errorMessage = `Request timed out: The server took too long to respond. ${error.message}`;
      } else if (error.response?.status === 401 || error.message?.includes('unauthorized')) {
        errorMessage = `Authentication error: Please log in again. ${error.message}`;
      } else if (error.response?.status === 403) {
        errorMessage = `Permission denied: You do not have access to this feature. ${error.message}`;
      } else if (error.response?.status === 404) {
        errorMessage = `Resource not found: The requested data could not be found. ${error.message}`;
      } else if (error.response?.status >= 500) {
        errorMessage = `Server error: The server encountered an error. Please try again later. ${error.message}`;
      } else if (error.message?.includes('CORS')) {
        errorMessage = `CORS error: There is a cross-origin request issue. Please ensure you are using port 5173. ${error.message}`;
      }
      
      // Update the item with error status
      currentItems[index].status = 'error';
      currentItems[index].message = errorMessage;
      currentItems[index].errorDetails = {
        name: error.name,
        message: error.message,
        code: error.code || error.response?.status,
        timestamp: new Date().toISOString()
      };
      
      setProcessedItems([...currentItems]);
      return currentItems[index];
    }
  }, [itemType, processPlaceDetails, awaitingSelection]);

  /**
   * Process multiple bulk add items
   * @param {Array} items - Items to process
   * @returns {Promise<Array>} - Processed items
   */
  const processBulkAddItems = useCallback(async (itemsToProcess) => {
    console.log('[BulkAddProcessor] processBulkAddItems called with:', { itemsToProcess });
    
    try {
      // Use the items from state if no items are provided
      const itemsArray = itemsToProcess || items;
      
      console.log('[BulkAddProcessor] Using itemsArray:', { itemsArray, length: itemsArray?.length });
      
      if (!itemsArray || !Array.isArray(itemsArray) || itemsArray.length === 0) {
        logWarn('[BulkAddProcessor] No items provided for processing');
        return [];
      }
      
      // Process a sample item directly to test the API integration
      const sampleItem = itemsArray[0];
      console.log('[BulkAddProcessor] Processing sample item directly:', sampleItem);
      
      try {
        // Try to search for the place directly
        const searchResult = await placeService.searchPlaces(sampleItem.name);
        console.log('[BulkAddProcessor] Direct search result:', searchResult);
      } catch (searchError) {
        console.error('[BulkAddProcessor] Error in direct search:', searchError);
      }
    
      logDebug(`[BulkAddProcessor] Processing ${itemsArray.length} items:`, itemsArray);
      
      // Start performance tracking
      startPerformanceTracking('bulk-add-processing', `Processing ${itemsArray.length} items`);
      
      setIsProcessing(true);
      setProcessedItems([]);
      
      try {
        logInfo(`[BulkAddProcessor] Starting to process ${itemsArray.length} items`);
        
        // Initialize items with pending status
        const initialItems = itemsArray.map(item => ({
          ...item,
          status: 'pending',
          message: 'Ready for processing',
          processingStartTime: Date.now(),
          errors: []
        }));
        
        setProcessedItems(initialItems);
        
        // Process items in batches for better performance
        const processedItems = await batchProcess(
          initialItems,
          processBulkAddItem,
          5 // Use a fixed batch size instead of BULK_ADD_CONFIG.batchSize
        );
        
        // Calculate processing statistics
        const stats = {
          total: processedItems.length,
          ready: processedItems.filter(item => item.status === 'ready').length,
          error: processedItems.filter(item => item.status === 'error').length,
          pending: processedItems.filter(item => item.status === 'pending').length,
          processing: processedItems.filter(item => item.status === 'processing').length,
          duration: endPerformanceTracking('bulk-add-processing', false)
        };
        
        logInfo(`[BulkAddProcessor] Completed processing ${itemsArray.length} items:`, stats);
        
        setProcessedItems(processedItems);
        return processedItems;
      } catch (error) {
        logError('[BulkAddProcessor] Error processing bulk add items:', error);
        console.error('[BulkAddProcessor] Error details:', error);
        
        // End performance tracking even if there's an error
        endPerformanceTracking('bulk-add-processing');
        
        return [];
      } finally {
        setIsProcessing(false);
      }
    } catch (outerError) {
      console.error('[BulkAddProcessor] Outer error in processBulkAddItems:', outerError);
      logError('[BulkAddProcessor] Outer error in processBulkAddItems:', outerError);
      return [];
    }
  }, [processBulkAddItem, items]);

  /**
   * Cancel place selection and reset selection state
   */
  const cancelPlaceSelection = useCallback(() => {
    logDebug('[BulkAddProcessor] Cancelling place selection');
    setAwaitingSelection(false);
    setPlaceSelections([]);
    setCurrentProcessingIndex(-1);
    setCurrentProcessingItem(null);
  }, []);

  /**
   * Select a place from multiple options
   * @param {Object} place - Selected place
   * @param {Object} item - Item being processed
   * @returns {Promise<Object>} - Processed item
   */
  const selectPlace = useCallback(async (place, item = null) => {
    // If item is not provided, use the currentProcessingItem
    const targetItem = item || currentProcessingItem;
    
    if (!targetItem || !place) {
      throw new Error('Item and selected place are required');
    }
    
    try {
      // Get place details
      const placeDetails = await placeService.getPlaceDetails(place.place_id);
      
      if (!placeDetails) {
        throw new Error('Failed to get place details for selected place');
      }
      
      // Process the selected place
      const processedItem = await processPlaceDetails(placeDetails);
      
      // Update the item with the processed place details
      const updatedItem = {
        ...targetItem,
        place_id: place.place_id,
        formatted_address: place.formatted_address || placeDetails.formatted_address,
        address: processedItem.address || placeDetails.formatted_address,
        zipcode: processedItem.address_components?.postalCode,
        neighborhood_id: processedItem.neighborhood_id,
        neighborhood_name: processedItem.neighborhood_name,
        status: 'ready',
        message: `Ready to add ${targetItem.name} in ${processedItem.neighborhood_name || 'selected neighborhood'}`
      };  
      
      // Update the processed items array
      setProcessedItems(prevItems => {
        const index = prevItems.findIndex(i => i._lineNumber === targetItem._lineNumber);
        if (index === -1) return prevItems;
        
        const newItems = [...prevItems];
        newItems[index] = updatedItem;
        return newItems;
      });
      
      // Reset selection state
      setAwaitingSelection(false);
      setPlaceSelections([]);
      setCurrentProcessingIndex(-1);
      
      return updatedItem;
    } catch (error) {
      logError('[BulkAddProcessor] Error selecting place:', error);
      console.error('[BulkAddProcessor] Error details:', error);
      
      // Update the item with error status
      const errorItem = {
        ...targetItem,
        status: 'error',
        message: `Error selecting place: ${error.message}`
      };
      
      // Update the processed items array
      setProcessedItems(prevItems => {
        const index = prevItems.findIndex(i => i._lineNumber === targetItem._lineNumber);
        if (index === -1) return prevItems;
        
        const newItems = [...prevItems];
        newItems[index] = errorItem;
        return newItems;
      });
      
      // Reset selection state
      setAwaitingSelection(false);
      setPlaceSelections([]);
      setCurrentProcessingIndex(-1);
      
      throw error;
    }
  }, [processPlaceDetails, currentProcessingItem, placeService]);

  /**
   * Submit processed items
   * @returns {Promise<Object>} - Submission result
   */
  const submitProcessedItems = useCallback(async () => {
    // Filter items that are ready for submission
    const itemsToSubmit = processedItems.filter(item => item.status === 'ready');
    
    if (itemsToSubmit.length === 0) {
      logWarn('[BulkAddProcessor] No items ready for submission');
      return { success: false, message: 'No items ready for submission' };
    }
    
    setIsSubmitting(true);
    
    try {
      logInfo(`[BulkAddProcessor] Submitting ${itemsToSubmit.length} items`);
      
      // Format items for submission
      const formattedItems = itemsToSubmit.map(formatItemForSubmission);
      
      // Submit items
      const result = await adminService.bulkAddItems(formattedItems);
      
      logInfo('[BulkAddProcessor] Submission result:', result);
      
      // Update items with submission status
      const updatedItems = processedItems.map(item => {
        if (item.status !== 'ready') return item;
        
        return {
          ...item,
          status: 'submitted',
          message: 'Successfully submitted'
        };
      });
      
      setProcessedItems(updatedItems);
      setSubmissionResult(result);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries(['restaurants']);
      queryClient.invalidateQueries(['dishes']);
      
      return result;
    } catch (error) {
      logError('[BulkAddProcessor] Error submitting items:', error);
      console.error('[BulkAddProcessor] Error details:', error);
      
      // Update items with error status
      const updatedItems = processedItems.map(item => {
        if (item.status !== 'ready') return item;
        
        return {
          ...item,
          status: 'error',
          message: `Submission error: ${error.message}`
        };
      });
      
      setProcessedItems(updatedItems);
      setSubmissionResult({ success: false, error: error.message });
      
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [processedItems, queryClient]);

  // Return the hook API
  return {
    // State
    items,
    processedItems,
    isProcessing,
    processingError,
    placeSelections,
    awaitingSelection,
    currentProcessingIndex,
    currentProcessingItem,
    error,
    isSubmitting,
    submissionResult,
    
    // Functions
    parseItems,
    processBulkAddItems,
    processItems: processBulkAddItems,
    selectPlace,
    cancelPlaceSelection,
    resetProcessor,
    submitProcessedItems,
    
    // Internal functions exposed for testing
    fetchNeighborhoodByZipcode,
    getDefaultNeighborhood,
    processPlaceDetails,
    processBulkAddItem
  };
}

export default useBulkAddProcessorV2;
