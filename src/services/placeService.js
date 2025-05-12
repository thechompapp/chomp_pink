/* src/services/placeService.js */
import apiClient from './apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug, logWarn } from '@/utils/logger.js';

export const placeService = {
  /**
   * Fetches a Place ID using the backend autocomplete proxy.
   * @param {string} restaurantName - The name of the restaurant.
   * @param {string} cityName - The city context for the search.
   * @returns {Promise<{placeId: string|null, status: string, source: 'google'|'error'}>}
   * Resolves with placeId and status ('OK' or Google error status).
   * placeId is null if not found or on error.
   */
  async getPlaceId(restaurantName, cityName) {
    const context = `PlaceService Autocomplete (${restaurantName}, ${cityName})`;
    const queryString = encodeURIComponent(restaurantName + (cityName ? `, ${cityName}` : ''));
    
    logDebug(`[PlaceService] Fetching Place ID for ${restaurantName} in ${cityName}`);
    
    return handleApiResponse(
      () => apiClient.get(`/places/autocomplete?input=${queryString}`),
      context
    ).then(response => {
      // Backend succeeded, now check Google's status
      const googleStatus = response.status || 'UNKNOWN_STATUS';

      if (googleStatus === 'OK') {
          if (Array.isArray(response.data) && response.data.length > 0) {
              const prediction = response.data[0];
              const placeId = prediction.place_id;
              if (!placeId || typeof placeId !== 'string' || placeId.length < 5) {
                  logWarn(`[PlaceService] Invalid or missing place_id in prediction:`, prediction);
                  // Treat invalid Place ID as an error/not found scenario but report OK status
                  return { placeId: null, status: 'OK_BUT_INVALID_PREDICTION', source: 'google' };
              }
              logDebug(`[PlaceService] Valid Place ID found: ${placeId}`);
              return { placeId: placeId, status: 'OK', source: 'google' };
          } else {
              logWarn(`[PlaceService] No predictions found despite OK status.`);
              // Treat as ZERO_RESULTS essentially, though Google reported OK
              return { placeId: null, status: 'ZERO_RESULTS', source: 'google' };
          }
      } else {
          // Google returned a non-OK status (e.g., ZERO_RESULTS, REQUEST_DENIED)
          logWarn(`[PlaceService] Google Places API returned status: ${googleStatus}`);
          return { placeId: null, status: googleStatus, source: 'google' }; // Return status for caller to handle
      }
    }).catch(error => {
      // Handle errors
      logError(`[PlaceService] Error getting place ID for ${restaurantName}:`, error);
      // Return a generic error status for consistency
      return { placeId: null, status: 'SERVICE_ERROR', source: 'error' };
    })
  },

  /**
   * Fetches Place Details using the backend details proxy.
   * @param {string} placeId - The Google Place ID.
   * @returns {Promise<{details: object|null, status: string, source: 'google'|'error'}>}
   * Resolves with details object and status ('OK' or Google error status).
   * details is null on error or non-OK status.
   */
  async getPlaceDetails(placeId) {
    const context = `PlaceService Details (${placeId})`;
    const encodedPlaceId = encodeURIComponent(placeId);
    
    logDebug(`[PlaceService] Fetching details for placeId "${placeId}"`);
    
    return handleApiResponse(
      () => apiClient.get(`/places/details?placeId=${encodedPlaceId}`),
      context
    ).then(response => {
      const googleStatus = response.status || 'UNKNOWN_STATUS';

      if (googleStatus === 'OK') {
          const { data } = response;
          if (!data || typeof data !== 'object') {
              logError('[PlaceService] Invalid or missing data object in successful response:', response);
              return { details: null, status: 'OK_BUT_INVALID_DATA', source: 'google' };
          }

          const location = data.location || {};
          const formattedDetails = {
            address: data.formattedAddress || '',
            place_id: data.placeId,
            latitude: location.lat ?? null, // Use null coalescing
            longitude: location.lng ?? null,
            phone: data.phone || null,
            website: data.website || null
          };
          return { details: formattedDetails, status: 'OK', source: 'google' };
      } else {
          // Google returned non-OK status
          logWarn(`[PlaceService] Google Places API returned status: ${googleStatus}`);
          return { details: null, status: googleStatus, source: 'google' };
      }
    }).catch(error => {
      logError(`[PlaceService] Error getting place details for placeId "${placeId}":`, error);
      return { details: null, status: 'SERVICE_ERROR', source: 'error' };
    });
  }
};

// Export is now handled via named export above