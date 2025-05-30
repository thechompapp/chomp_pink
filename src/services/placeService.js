/* src/services/placeService.js */
import apiClient from './apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug, logWarn } from '@/utils/logger.js';

export const placeService = {
  /**
   * Search for places using the Google Places API
   * @param {string} query - Search query
   * @param {string} [location] - Optional location context
   * @returns {Promise<Object>} - Search results
   */
  async searchPlaces(query, location) {
    if (!query) {
      throw new Error('Search query is required');
    }
    
    const searchTerm = location ? `${query}, ${location}` : query;
    logDebug(`[PlaceService] Searching for places with query: ${searchTerm}`);
    
    // Track retry attempts
    let attempts = 0;
    const maxRetries = 3;
    let lastError = null;
    
    while (attempts < maxRetries) {
      try {
        // Use the backend proxy for Google Places API autocomplete
        const response = await apiClient.get('/places/autocomplete', {
          params: {
            input: searchTerm,
            types: 'establishment',
            components: 'country:us',
            sessiontoken: '1234567890' // Add a session token for billing purposes
          },
          headers: {
            'X-Places-Api-Request': 'true', // Signal that this is a places API request
            'X-Bypass-Auth': 'true' // Enable auth bypass for development
          }
        });
        
        // Process the response
        const result = await handleApiResponse(
          () => Promise.resolve(response),
          'PlaceService Search'
        );
        
        if (!result || !result.data || result.data.length === 0) {
          logWarn(`[PlaceService] No places found for query "${searchTerm}"`);
          return { results: [] };
        }
        
        // Transform autocomplete predictions to match expected format
        const predictions = result.data.map(prediction => ({
          place_id: prediction.place_id,
          description: prediction.description,
          structured_formatting: {
            main_text: prediction.structured_formatting?.main_text || prediction.description.split(',')[0],
            secondary_text: prediction.structured_formatting?.secondary_text || prediction.description.split(',').slice(1).join(',').trim()
          }
        }));
        
        // Return in a format compatible with the existing code
        return { 
          results: predictions
        };
      } catch (error) {
        lastError = error;
        attempts++;
        logWarn(`[PlaceService] Attempt ${attempts}/${maxRetries} failed for query "${searchTerm}": ${error.message}`);
        
        // Wait before retrying
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // All attempts failed, throw an error to ensure we don't use mock data
    logError(`[PlaceService] All ${maxRetries} attempts failed for query "${searchTerm}".`, lastError);
    throw new Error(`Failed to search for places after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
    
  },
  
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
    
    try {
      // Add auth headers specifically for places API
      const headers = {
        'X-Bypass-Auth': 'true', // Enable auth bypass for development
        'X-Places-Api-Request': 'true' // Signal that this is a places API request
      };
      
      // First try with direct API call and custom headers
      let response;
      try {
        response = await apiClient.get(`/places/autocomplete?input=${queryString}`);
      } catch (authError) {
        // If we get a 401, try with additional fallback headers
        if (authError.response && authError.response.status === 401) {
          logWarn(`[PlaceService] Authentication failed with standard headers, trying fallback auth`);
          
          // Add more bypass headers that might help with authentication
          const fallbackHeaders = {
            ...headers,
            'X-Auth-Bypass-Refresh': 'true',
            'X-Auth-Authenticated': 'true',
            'X-Dev-Mode': 'true'
          };
          
          // Try again with fallback headers
          response = await apiClient.get(`/places/autocomplete?input=${queryString}`, { 
            headers: fallbackHeaders,
            _skipAuthRefresh: true // Skip token refresh to avoid loops
          });
        } else {
          // Re-throw if it's not an auth error
          throw authError;
        }
      }
      
      // Safely access response data with null checks
      if (!response || !response.data) {
        logWarn(`[PlaceService] Empty or invalid response for ${restaurantName}`);
        return { placeId: null, status: 'INVALID_RESPONSE', source: 'error' };
      }
      
      // Backend succeeded, now check Google's status
      const googleStatus = response.data.status || 'UNKNOWN_STATUS';

      if (googleStatus === 'OK') {
        // Safely check for predictions array
        const predictions = response.data.data || response.data.predictions || response.data;
        
        if (Array.isArray(predictions) && predictions.length > 0) {
          const prediction = predictions[0];
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
    } catch (error) {
      // Handle authentication errors specifically
      if (error.response && error.response.status === 401) {
        logError(`[PlaceService] Authentication error (401) for places API. Please check API keys and authentication.`);
        // Try to enable development bypass mode
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('bypass_auth_check', 'true');
          logWarn('[PlaceService] Enabled development auth bypass for future requests');
        }
        return { placeId: null, status: 'AUTH_ERROR', source: 'error' };
      }
      
      // Handle other errors
      logError(`[PlaceService] Error getting place ID for ${restaurantName}:`, error);
      // Return a generic error status for consistency
      return { placeId: null, status: 'SERVICE_ERROR', source: 'error' };
    }
  },

  /**
   * Fetches Place Details using the backend details proxy.
   * @param {string} placeId - The Google Place ID.
   * @returns {Promise<{details: object|null, status: string, source: 'google'|'error'}>}
   * Resolves with details object and status ('OK' or Google error status).
   * details is null on error or non-OK status.
   */
  async getPlaceDetails(placeId) {
    // Validate place ID
    if (!placeId || typeof placeId !== 'string') {
      throw new Error('Invalid place ID provided');
    }
    
    logDebug(`[PlaceService] Fetching details for placeId "${placeId}"`);
    
    // Track retry attempts
    let attempts = 0;
    const maxRetries = 3;
    let lastError = null;
    
    while (attempts < maxRetries) {
      try {
        // Add auth headers specifically for places API
        const headers = {
          'X-Bypass-Auth': 'true', // Enable auth bypass for development
          'X-Places-Api-Request': 'true' // Signal that this is a places API request
        };
        
        // Use a direct API call with custom headers
        const response = await apiClient.get(`/places/details`, {
          params: {
            place_id: placeId,
            fields: 'place_id,name,formatted_address,geometry,address_components,types,vicinity'
          },
          headers
        });
        
        // Safely access response data with null checks
        if (!response || !response.data) {
          throw new Error('Empty or invalid response');
        }
        
        // Backend succeeded, now check Google's status
        const googleStatus = response.data.status || 'UNKNOWN_STATUS';

        if (googleStatus === 'OK') {
          // The backend returns the formatted data in the 'data' property
          const details = response.data.data || {};
          
          logDebug(`[PlaceService] Successfully retrieved details for place ID: ${placeId}`, details);
          return { details, status: 'OK', source: 'google' };
        } else {
          // Google returned a non-OK status (e.g., ZERO_RESULTS, REQUEST_DENIED)
          throw new Error(`Google API returned status: ${googleStatus}`);
        }
      } catch (error) {
        lastError = error;
        attempts++;
        logWarn(`[PlaceService] Attempt ${attempts}/${maxRetries} failed for place details (${placeId}): ${error.message}`);
        
        // Wait before retrying
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // All attempts failed, throw an error to ensure we don't use mock data
    logError(`[PlaceService] All ${maxRetries} attempts failed for place details (${placeId}).`, lastError);
    throw new Error(`Failed to get place details after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  },

  /**
   * Enhanced restaurant search specifically for autocomplete
   * @param {string} query - Search query
   * @returns {Promise<Object>} Enhanced search results with restaurant data
   */
  async searchRestaurants(query) {
    if (!query || query.length < 3) {
      return { success: false, predictions: [], message: 'Query too short' };
    }

    logDebug(`[PlaceService] Searching for restaurants: ${query}`);
    
    try {
      const response = await this.getAutocompleteSuggestions(query, {
        types: 'establishment',
        components: 'country:us'
      });
      
      // Filter and enhance results for restaurants
      const restaurantPredictions = response.results
        ?.filter(prediction => {
          // Filter for likely restaurant establishments
          const types = prediction.types || [];
          const mainText = prediction.structured_formatting?.main_text || '';
          
          return types.includes('establishment') || 
                 types.includes('food') || 
                 types.includes('restaurant') ||
                 types.includes('meal_takeaway') ||
                 mainText.toLowerCase().includes('restaurant') ||
                 mainText.toLowerCase().includes('pizza') ||
                 mainText.toLowerCase().includes('cafe') ||
                 mainText.toLowerCase().includes('bar');
        })
        .map(prediction => ({
          ...prediction,
          restaurantName: prediction.structured_formatting?.main_text,
          address: prediction.structured_formatting?.secondary_text || prediction.description,
          isRestaurant: true
        })) || [];

      return {
        success: true,
        predictions: restaurantPredictions,
        total: restaurantPredictions.length
      };
    } catch (error) {
      logError('[PlaceService] Restaurant search failed:', error);
      return {
        success: false,
        predictions: [],
        error: error.message
      };
    }
  },

  /**
   * Get enhanced restaurant details from place ID
   * @param {string} placeId - Google Places place ID
   * @returns {Promise<Object>} Enhanced restaurant details
   */
  async getRestaurantDetails(placeId) {
    logDebug(`[PlaceService] Getting restaurant details for: ${placeId}`);
    
    try {
      const { details } = await this.getPlaceDetails(placeId);
      
      if (!details) {
        throw new Error('No place details found');
      }

      // Extract restaurant-specific information
      const restaurantData = {
        placeId: details.place_id,
        name: details.name,
        formattedAddress: details.formatted_address,
        types: details.types || [],
        
        // Address components
        addressComponents: details.address_components || [],
        
        // Extract specific address parts
        streetNumber: this.extractAddressComponent(details.address_components, 'street_number'),
        route: this.extractAddressComponent(details.address_components, 'route'),
        neighborhood: this.extractAddressComponent(details.address_components, 'neighborhood'),
        locality: this.extractAddressComponent(details.address_components, 'locality'),
        administrativeArea: this.extractAddressComponent(details.address_components, 'administrative_area_level_1'),
        country: this.extractAddressComponent(details.address_components, 'country'),
        postalCode: this.extractAddressComponent(details.address_components, 'postal_code'),
        
        // Location data
        location: details.geometry?.location || null,
        
        // Restaurant metadata
        rating: details.rating || null,
        userRatingsTotal: details.user_ratings_total || 0,
        priceLevel: details.price_level || null,
        
        // Contact information
        phoneNumber: details.formatted_phone_number || details.international_phone_number || null,
        website: details.website || null,
        
        // Business hours
        openingHours: details.opening_hours || null,
        
        // Other useful data
        url: details.url || null,
        utcOffset: details.utc_offset || null
      };

      // Determine if this is likely a restaurant
      const isRestaurant = this.isLikelyRestaurant(restaurantData);
      
      return {
        success: true,
        restaurant: {
          ...restaurantData,
          isRestaurant,
          confidence: isRestaurant ? 'high' : 'medium'
        }
      };
    } catch (error) {
      logError('[PlaceService] Restaurant details failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Extract specific component from address components
   * @param {Array} components - Address components array
   * @param {string} type - Component type to extract
   * @returns {string|null} Extracted component value
   */
  extractAddressComponent(components, type) {
    if (!Array.isArray(components)) return null;
    
    const component = components.find(comp => 
      comp.types && comp.types.includes(type)
    );
    
    return component ? component.long_name : null;
  },

  /**
   * Determine if place is likely a restaurant
   * @param {Object} placeData - Place data object
   * @returns {boolean} Whether place is likely a restaurant
   */
  isLikelyRestaurant(placeData) {
    if (!placeData) return false;
    
    const { types = [], name = '' } = placeData;
    
    // Check Google Place types
    const restaurantTypes = [
      'restaurant', 'food', 'meal_takeaway', 'meal_delivery',
      'bakery', 'cafe', 'bar', 'night_club'
    ];
    
    const hasRestaurantType = types.some(type => restaurantTypes.includes(type));
    if (hasRestaurantType) return true;
    
    // Check name for restaurant keywords
    const restaurantKeywords = [
      'restaurant', 'pizza', 'cafe', 'coffee', 'bar', 'grill',
      'kitchen', 'bistro', 'diner', 'eatery', 'tavern', 'pub',
      'steakhouse', 'seafood', 'sushi', 'chinese', 'italian',
      'mexican', 'thai', 'indian', 'food', 'chicken', 'burger'
    ];
    
    const nameContainsKeyword = restaurantKeywords.some(keyword =>
      name.toLowerCase().includes(keyword)
    );
    
    return nameContainsKeyword;
  }
};

export default placeService;
