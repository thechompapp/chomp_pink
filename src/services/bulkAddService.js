/**
 * Bulk Add Service
 * 
 * Centralizes all API interactions for bulk add operations.
 * Provides a clean interface for the bulk add processor hook.
 */
import { placeService } from './placeService.js';
import { filterService } from './filterService.js';
import { adminService } from './adminService.js';
import { restaurantService } from './restaurantService.js';
import { handleApiResponse, validateId } from './utils/serviceHelpers.js';
import { logDebug, logError, logInfo } from '@/utils/logger.js';

/**
 * Lookup a place using the Google Places API
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of place candidates
 */
export const lookupPlace = async (query) => {
  try {
    logDebug(`[BulkAddService] Looking up place: ${query}`);
    const serviceResponse = await placeService.searchPlaces(query);

    if (serviceResponse && Array.isArray(serviceResponse.results)) {
      // Map results to include a top-level 'name' and 'place_id' as expected by tests
      const mappedResults = serviceResponse.results.map(item => ({
        place_id: item.place_id,
        // Prefer main_text, fallback to the first part of description, then full description
        name: item.structured_formatting?.main_text || item.description?.split(',')[0] || item.description,
        description: item.description, // Keep original description for other uses
        structured_formatting: item.structured_formatting // Keep original structured_formatting
      }));
      return mappedResults;
    }

    logWarn(`[BulkAddService] lookupPlace: Unexpected response or empty results from placeService.searchPlaces for query "${query}":`, serviceResponse);
    return []; // Fallback for unexpected structure or empty results
  } catch (error) {
    logError(`[BulkAddService] Error in lookupPlace for query "${query}":`, error);
    return null; // Error case
  }
};

/**
 * Get place details from the Google Places API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} - Place details
 */
export const getPlaceDetails = async (placeId) => {
  try {
    logDebug(`[BulkAddService] Getting place details for: ${placeId}`);
    const serviceResponse = await placeService.getPlaceDetails(placeId);

    logInfo(`[BulkAddService] Full serviceResponse from placeService.getPlaceDetails for placeId '${placeId}':`, JSON.stringify(serviceResponse, null, 2));

    if (serviceResponse && serviceResponse.details && (serviceResponse.status === 'OK' || typeof serviceResponse.status === 'undefined')) {
      const details = serviceResponse.details;
      logInfo(`[BulkAddService] Extracted 'details' object for placeId '${placeId}'. Keys: ${Object.keys(details).join(', ')}. Full details:`, JSON.stringify(details, null, 2));
      
      if (!details.name) {
        logWarn(`[BulkAddService] 'name' is MISSING from details object for placeId '${placeId}'.`);
      }

      let hasFormattedAddress = details.hasOwnProperty('formatted_address') && details.formatted_address;
      let formattedAddressValue = details.formatted_address;
      logInfo(`[BulkAddService] For placeId '${placeId}': Initial 'formatted_address' present: ${hasFormattedAddress}, Value: '${formattedAddressValue}'`);

      if (!hasFormattedAddress) {
        logWarn(`[BulkAddService] 'formatted_address' is MISSING or FALSY for placeId '${placeId}'. Attempting to construct from 'address_components'.`);
        if (details.address_components && Array.isArray(details.address_components)) {
          // Basic reconstruction: street_number street, city, state zip. More robust parsing may be needed.
          const streetNumber = details.address_components.find(c => c.types.includes('street_number'))?.long_name || '';
          const route = details.address_components.find(c => c.types.includes('route'))?.long_name || '';
          const locality = details.address_components.find(c => c.types.includes('locality'))?.long_name || ''; // City
          const adminArea1 = details.address_components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || ''; // State
          const postalCode = details.address_components.find(c => c.types.includes('postal_code'))?.long_name || '';
          
          let constructedAddress = `${streetNumber} ${route}`.trim();
          if (locality) constructedAddress += `, ${locality}`;
          if (adminArea1) constructedAddress += `, ${adminArea1}`;
          if (postalCode) constructedAddress += ` ${postalCode}`;
          constructedAddress = constructedAddress.replace(/^, |,$/g, '').trim(); // Clean up leading/trailing commas

          if (constructedAddress) {
            details.formatted_address = constructedAddress;
            logInfo(`[BulkAddService] Constructed 'formatted_address' for placeId '${placeId}': '${details.formatted_address}'`);
            hasFormattedAddress = true; // Update status
          } else {
            logError(`[BulkAddService] Failed to construct 'formatted_address' from 'address_components' for placeId '${placeId}'. Components:`, JSON.stringify(details.address_components, null, 2));
          }
        } else {
          logError(`[BulkAddService] 'address_components' are missing or not an array for placeId '${placeId}'. Cannot construct 'formatted_address'.`);
        }
      }

      if (!hasFormattedAddress) {
         logError(`[BulkAddService] CRITICAL: 'formatted_address' STILL MISSING for placeId '${placeId}'.`);
      }

      // Ensure place_id is part of the returned details, as tests expect it.
      if (!details.place_id) {
        details.place_id = placeId; // Add it if missing from Google's response structure
      }
      return details;
    }

    logWarn(`[BulkAddService] getPlaceDetails: Non-OK status or no details from placeService for placeId "${placeId}":`, serviceResponse);
    return null;
  } catch (error) {
    logError(`[BulkAddService] Error in getPlaceDetails for placeId "${placeId}":`, error);
    return null;
  }
};

/**
 * Fetch neighborhood by zipcode
 * @param {string} zipcode - Zipcode to lookup
 * @returns {Promise<Object>} - Neighborhood data
 */
export const findNeighborhoodByZipcode = async (zipcode) => {
  try {
    logDebug(`[BulkAddService] Finding neighborhood for zipcode: ${zipcode}`);
    // Assuming filterService.findNeighborhoodByZipcode returns the neighborhood object directly or null, or throws
    const neighborhood = await filterService.findNeighborhoodByZipcode(zipcode);
    return neighborhood; // Directly return, could be object or null
  } catch (error) {
    logError(`[BulkAddService] Error finding neighborhood for zipcode ${zipcode}:`, error);
    return null;
  }
};

/**
 * Get neighborhoods by city
 * @param {number} cityId - City ID
 * @returns {Promise<Array>} - Array of neighborhoods
 */
export const getNeighborhoodsByCity = async (cityId) => {
  try {
    logDebug(`[BulkAddService] Getting neighborhoods for city: ${cityId}`);
    // Assuming filterService.getNeighborhoodsByCity returns an array of neighborhoods or null/throws
    const neighborhoods = await filterService.getNeighborhoodsByCity(cityId);
    return neighborhoods;
  } catch (error) {
    logError(`[BulkAddService] Error getting neighborhoods for city ${cityId}:`, error);
    return null;
  }
};

/**
 * Get all cities
 * @returns {Promise<Array>} - Array of cities
 */
export const getCities = async () => {
  try {
    logDebug(`[BulkAddService] Getting all cities`);
    // Assuming filterService.getCities returns an array of cities or null/throws
    const cities = await filterService.getCities();
    return cities;
  } catch (error) {
    logError(`[BulkAddService] Error getting cities:`, error);
    return null;
  }
};

/**
 * Check if a restaurant already exists in the database
 * @param {string} name - Restaurant name
 * @param {string} address - Restaurant address
 * @returns {Promise<Object>} - Existing restaurant or null
 */
export const checkExistingRestaurant = async (name, address) => {
  try {
    logDebug(`[BulkAddService] Checking if restaurant exists: ${name}, ${address}`);
    // Assuming restaurantService.searchRestaurants returns an array of restaurants or null/throws
    const restaurantsArray = await restaurantService.searchRestaurants({ name, address, exact: true });
    if (Array.isArray(restaurantsArray) && restaurantsArray.length > 0) {
      return restaurantsArray[0];
    }
    return null;
  } catch (error) {
    logError(`[BulkAddService] Error checking existing restaurant (${name}):`, error);
    return null;
  }
};

/**
 * Submit a batch of processed items
 * @param {Array} items - Processed items ready for submission
 * @returns {Promise<Object>} - Submission result
 */
export const submitBulkItems = async (items) => {
  try {
    logInfo(`[BulkAddService] Submitting ${items.length} items`);
    // Assuming adminService.bulkAddRestaurants handles its own response processing
    // and returns a meaningful result object or throws an error.
    const submissionResult = await adminService.createResource('restaurants', items);
    return submissionResult; // Return the result directly
  } catch (error) {
    logError(`[BulkAddService] Error submitting bulk items:`, error);
    // Re-throwing error, consistent with original behavior and test structure (safeApiCall handles throws).
    throw error;
  }
};

// Export all functions as a service object
const bulkAddService = {
  lookupPlace,
  getPlaceDetails,
  findNeighborhoodByZipcode,
  getNeighborhoodsByCity,
  getCities,
  checkExistingRestaurant,
  submitBulkItems
};

export default bulkAddService;
