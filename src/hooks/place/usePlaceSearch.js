/**
 * usePlaceSearch Hook
 * 
 * Custom hook for searching places using the Google Places API.
 * Extracted from usePlaceResolver.js to improve separation of concerns.
 */
import { useState, useCallback } from 'react';
import { placeService } from '@/services/placeService';
import { retryWithBackoff } from '@/utils/generalUtils';
import { logDebug, logError } from '@/utils/logger';

/**
 * Custom hook for searching places
 * @returns {Object} Place search state and functions
 */
const usePlaceSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  
  /**
   * Search for places using Google Places API
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Array of place results
   */
  const searchPlaces = useCallback(async (query) => {
    if (!query) {
      setSearchError('Search query is required');
      return [];
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      logDebug(`[usePlaceSearch] Searching for places with query: ${query}`);
      
      // Look up place with retry logic
      const places = await retryWithBackoff(() => 
        placeService.searchPlaces(query)
      );
      
      if (!places || places.length === 0) {
        logDebug(`[usePlaceSearch] No places found for query: ${query}`);
        setSearchResults([]);
        return [];
      }
      
      logDebug(`[usePlaceSearch] Found ${places.length} places for query: ${query}`);
      setSearchResults(places);
      return places;
    } catch (error) {
      logError(`[usePlaceSearch] Error searching for places:`, error);
      setSearchError(error.message || 'Error searching for places');
      setSearchResults([]);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  /**
   * Get place details by place ID
   * @param {string} placeId - Google Place ID
   * @returns {Promise<Object>} - Place details
   */
  const getPlaceDetails = useCallback(async (placeId) => {
    if (!placeId) {
      return null;
    }
    
    try {
      logDebug(`[usePlaceSearch] Getting place details for ID: ${placeId}`);
      
      // Get place details with retry logic
      const details = await retryWithBackoff(() => 
        placeService.getPlaceDetails(placeId)
      );
      
      return details;
    } catch (error) {
      logError(`[usePlaceSearch] Error getting place details:`, error);
      return null;
    }
  }, []);
  
  return {
    isSearching,
    searchError,
    searchResults,
    searchPlaces,
    getPlaceDetails
  };
};

export default usePlaceSearch;
