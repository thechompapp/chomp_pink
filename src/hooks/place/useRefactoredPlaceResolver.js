/**
 * useRefactoredPlaceResolver Hook
 * 
 * Refactored version of usePlaceResolver that uses the new modular hooks.
 * Orchestrates the place resolution process with improved separation of concerns.
 */
import { useState, useCallback, useRef } from 'react';
import { logDebug, logError } from '@/utils/logger';
import { batchProcess, BULK_ADD_CONFIG } from '@/utils/bulkAddUtils';
import usePlaceSearch from './usePlaceSearch';
import useNeighborhoodResolver from './useNeighborhoodResolver';
import usePlaceSelection from './usePlaceSelection';
import { formatPlaceDetails, processPlaceForItem, createPlaceCacheKey } from './utils/placeDataTransformers';

/**
 * Refactored hook for resolving places from Google Places API
 * @returns {Object} - State and functions for place resolution
 */
const useRefactoredPlaceResolver = () => {
  // State for items and processing
  const [items, setItems] = useState([]);
  const [resolvedItems, setResolvedItems] = useState([]);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingError, setResolvingError] = useState(null);
  
  // Cache for places to avoid redundant API calls
  const placeCache = useRef(new Map());
  
  // Use the modular hooks
  const { 
    searchPlaces, 
    getPlaceDetails, 
    isSearching 
  } = usePlaceSearch();
  
  const { 
    fetchNeighborhoodByZipcode 
  } = useNeighborhoodResolver();
  
  // Handle place selection completion
  const handlePlaceSelectionComplete = useCallback(async (item, selectedPlace) => {
    if (!item) return;
    
    // If no place was selected (user cancelled), mark the item as skipped
    if (!selectedPlace) {
      const updatedItem = {
        ...item,
        status: 'skipped',
        message: 'Place selection cancelled'
      };
      
      // Update the resolved items
      setResolvedItems(prev => {
        const newItems = [...prev];
        const index = newItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          newItems[index] = updatedItem;
        } else {
          newItems.push(updatedItem);
        }
        return newItems;
      });
      
      return;
    }
    
    try {
      // Get place details
      const placeDetails = await getPlaceDetails(selectedPlace.place_id);
      
      if (!placeDetails) {
        throw new Error('Failed to get place details');
      }
      
      // Format place details
      const formattedPlace = formatPlaceDetails(placeDetails);
      
      // Get neighborhood
      const neighborhood = await fetchNeighborhoodByZipcode(formattedPlace.zipcode);
      
      // Process the item with place details
      const processedItem = processPlaceForItem(item, formattedPlace, neighborhood);
      
      // Cache the place for future use
      const cacheKey = createPlaceCacheKey(item.name, item.address);
      placeCache.current.set(cacheKey, formattedPlace);
      
      // Update the resolved items
      setResolvedItems(prev => {
        const newItems = [...prev];
        const index = newItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          newItems[index] = processedItem;
        } else {
          newItems.push(processedItem);
        }
        return newItems;
      });
    } catch (error) {
      logError(`[useRefactoredPlaceResolver] Error processing selected place:`, error);
      
      // Update the item with error
      const updatedItem = {
        ...item,
        status: 'error',
        message: `Error: ${error.message || 'Unknown error'}`
      };
      
      // Update the resolved items
      setResolvedItems(prev => {
        const newItems = [...prev];
        const index = newItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          newItems[index] = updatedItem;
        } else {
          newItems.push(updatedItem);
        }
        return newItems;
      });
    }
  }, [getPlaceDetails, fetchNeighborhoodByZipcode]);
  
  // Set up place selection hook with the completion handler
  const { 
    placeSelections, 
    awaitingSelection, 
    currentItem, 
    openPlaceSelection, 
    selectPlace, 
    cancelPlaceSelection, 
    resetSelection 
  } = usePlaceSelection(handlePlaceSelectionComplete);
  
  /**
   * Process a single item to resolve place details
   * @param {Object} item - Item to process
   * @returns {Promise<Object>} - Processed item with place details
   */
  const resolvePlace = useCallback(async (item) => {
    if (!item || item.status === 'error') {
      return item;
    }
    
    logDebug(`[useRefactoredPlaceResolver] Resolving place for: ${item.name}`);
    
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
      const cacheKey = createPlaceCacheKey(item.name, item.address);
      if (placeCache.current.has(cacheKey)) {
        const cachedPlace = placeCache.current.get(cacheKey);
        logDebug(`[useRefactoredPlaceResolver] Using cached place for: ${searchQuery}`);
        
        // Get neighborhood
        const neighborhood = await fetchNeighborhoodByZipcode(cachedPlace.zipcode);
        
        // Process the item with cached place details
        return processPlaceForItem(updatedItem, cachedPlace, neighborhood);
      }
      
      // Search for places
      const places = await searchPlaces(searchQuery);
      
      if (!places || places.length === 0) {
        return {
          ...updatedItem,
          status: 'error',
          message: 'No places found. Please check the name and address.'
        };
      }
      
      // If multiple places found, handle selection
      if (places.length > 1) {
        // Open place selection dialog
        openPlaceSelection(updatedItem, places);
        
        // Return the item with pending status
        return {
          ...updatedItem,
          status: 'pending',
          message: 'Waiting for place selection...'
        };
      }
      
      // Single place found, get details
      const placeDetails = await getPlaceDetails(places[0].place_id);
      
      if (!placeDetails) {
        throw new Error('Failed to get place details');
      }
      
      // Format place details
      const formattedPlace = formatPlaceDetails(placeDetails);
      
      // Cache the place for future use
      placeCache.current.set(cacheKey, formattedPlace);
      
      // Get neighborhood
      const neighborhood = await fetchNeighborhoodByZipcode(formattedPlace.zipcode);
      
      // Process the item with place details
      return processPlaceForItem(updatedItem, formattedPlace, neighborhood);
    } catch (error) {
      logError(`[useRefactoredPlaceResolver] Error resolving place for ${item.name}:`, error);
      return {
        ...item,
        status: 'error',
        message: `Error: ${error.message || 'Unknown error'}`
      };
    }
  }, [searchPlaces, getPlaceDetails, fetchNeighborhoodByZipcode, openPlaceSelection]);
  
  /**
   * Resolve places for multiple items
   * @param {Array} itemsToProcess - Items to process
   * @returns {Promise<Array>} - Processed items with place details
   */
  const resolvePlaces = useCallback(async (itemsToProcess) => {
    if (!itemsToProcess || !Array.isArray(itemsToProcess) || itemsToProcess.length === 0) {
      setResolvingError('No items to process');
      return [];
    }
    
    try {
      setIsResolving(true);
      setResolvingError(null);
      setItems(itemsToProcess);
      setResolvedItems([]);
      resetSelection();
      
      logDebug(`[useRefactoredPlaceResolver] Resolving places for ${itemsToProcess.length} items`);
      
      // Process items in batches
      const results = await batchProcess(
        itemsToProcess,
        resolvePlace,
        BULK_ADD_CONFIG.batchSize,
        (batchResults) => {
          // Update resolved items as each batch completes
          setResolvedItems(prev => [...prev, ...batchResults]);
        }
      );
      
      logDebug(`[useRefactoredPlaceResolver] Completed resolving places for ${results.length} items`);
      
      return results;
    } catch (error) {
      logError(`[useRefactoredPlaceResolver] Error resolving places:`, error);
      setResolvingError(error.message || 'Error resolving places');
      return [];
    } finally {
      setIsResolving(false);
    }
  }, [resolvePlace, resetSelection]);
  
  /**
   * Reset the resolver state
   */
  const resetResolver = useCallback(() => {
    setItems([]);
    setResolvedItems([]);
    setResolvingError(null);
    resetSelection();
    placeCache.current.clear();
    logDebug('[useRefactoredPlaceResolver] Resolver state reset');
  }, [resetSelection]);
  
  return {
    items,
    resolvedItems,
    isResolving: isResolving || isSearching,
    resolvingError,
    placeSelections,
    awaitingSelection,
    currentItem,
    resolvePlaces,
    selectPlace,
    cancelPlaceSelection,
    resetResolver
  };
};

export default useRefactoredPlaceResolver;
