/* src/services/placeService.js */
/* MODIFIED: Propagate Places API status codes within errors or response */

import apiClient, { ApiError } from './apiClient'; // Import ApiError

const placeService = {
  /**
   * Fetches a Place ID using the backend autocomplete proxy.
   * @param {string} restaurantName - The name of the restaurant.
   * @param {string} cityName - The city context for the search.
   * @returns {Promise<{placeId: string|null, status: string, source: 'google'|'error'}>}
   * Resolves with placeId and status ('OK' or Google error status).
   * placeId is null if not found or on error.
   * @throws {ApiError} If the backend proxy call itself fails.
   */
  async getPlaceId(restaurantName, cityName) {
    const context = `PlaceService Autocomplete (${restaurantName}, ${cityName})`;
    try {
      // console.log(`[PlaceService getPlaceId] Fetching Place ID for ${restaurantName} in ${cityName}`);
      const response = await apiClient(
        // Ensure encoding is correct
        `/api/places/proxy/autocomplete?input=${encodeURIComponent(restaurantName + (cityName ? `, ${cityName}` : ''))}`,
        context
      );
      // console.log(`[PlaceService getPlaceId] Autocomplete response received:`, response);

      // Always check if the backend call itself was successful first
      if (!response || !response.success) {
        const errorMessage = response?.error || 'Backend proxy failed to get autocomplete data.';
        console.error(`[PlaceService getPlaceId] Backend proxy error:`, errorMessage);
        // Throw ApiError for backend failures
        throw new ApiError(errorMessage, response?.status || 500, response);
      }

      // Backend succeeded, now check Google's status
      const googleStatus = response.status || 'UNKNOWN_STATUS';

      if (googleStatus === 'OK') {
          if (Array.isArray(response.data) && response.data.length > 0) {
              const prediction = response.data[0];
              const placeId = prediction.place_id;
              if (!placeId || typeof placeId !== 'string' || placeId.length < 5) {
                  console.warn(`[PlaceService getPlaceId] Invalid or missing place_id in prediction:`, prediction);
                   // Treat invalid Place ID as an error/not found scenario but report OK status
                   return { placeId: null, status: 'OK_BUT_INVALID_PREDICTION', source: 'google' };
              }
              // console.log(`[PlaceService getPlaceId] Valid Place ID found: ${placeId}`);
              return { placeId: placeId, status: 'OK', source: 'google' };
          } else {
              console.warn(`[PlaceService getPlaceId] No predictions found despite OK status.`);
              // Treat as ZERO_RESULTS essentially, though Google reported OK
               return { placeId: null, status: 'ZERO_RESULTS', source: 'google' };
          }
      } else {
           // Google returned a non-OK status (e.g., ZERO_RESULTS, REQUEST_DENIED)
           console.warn(`[PlaceService getPlaceId] Google Places API returned status: ${googleStatus}`);
           return { placeId: null, status: googleStatus, source: 'google' }; // Return status for caller to handle
      }

    } catch (error) {
      // Handle errors from apiClient or errors thrown within the try block
      console.error(`[PlaceService getPlaceId] Error for ${restaurantName}:`, error);
      // If it's already an ApiError from apiClient, re-throw it
      if (error instanceof ApiError) {
          throw error;
      }
      // Otherwise, wrap it or return a generic error status
      // Let's return a generic error status for consistency
      return { placeId: null, status: 'SERVICE_ERROR', source: 'error' };
    }
  },

  /**
   * Fetches Place Details using the backend details proxy.
   * @param {string} placeId - The Google Place ID.
   * @returns {Promise<{details: object|null, status: string, source: 'google'|'error'}>}
   * Resolves with details object and status ('OK' or Google error status).
   * details is null on error or non-OK status.
   * @throws {ApiError} If the backend proxy call itself fails.
   */
  async getPlaceDetails(placeId) {
    const context = `PlaceService Details (${placeId})`;
    try {
      // console.log(`[PlaceService getPlaceDetails] Fetching details for placeId "${placeId}"`);
      const response = await apiClient(
        `/api/places/proxy/details?placeId=${encodeURIComponent(placeId)}`,
        context
      );
      // console.log(`[PlaceService getPlaceDetails] Details response received:`, response);

      if (!response || !response.success) {
        const errorMessage = response?.error || 'Backend proxy failed to get place details.';
        console.error(`[PlaceService getPlaceDetails] Backend proxy error:`, errorMessage);
        throw new ApiError(errorMessage, response?.status || 500, response);
      }

      const googleStatus = response.status || 'UNKNOWN_STATUS';

      if (googleStatus === 'OK') {
          const { data } = response;
          if (!data || typeof data !== 'object') {
               console.error('[PlaceService getPlaceDetails] Invalid or missing data object in successful response:', response);
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
           console.warn(`[PlaceService getPlaceDetails] Google Places API returned status: ${googleStatus}`);
           return { details: null, status: googleStatus, source: 'google' };
      }

    } catch (error) {
      console.error(`[PlaceService getPlaceDetails] Error for placeId "${placeId}":`, error);
       if (error instanceof ApiError) {
          throw error;
      }
      return { details: null, status: 'SERVICE_ERROR', source: 'error' };
    }
  }
};

export default placeService;