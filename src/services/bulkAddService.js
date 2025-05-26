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
import { handleApiResponse, validateId } from './serviceHelpers.js';
import { logDebug, logError, logInfo } from '@/utils/logger.js';

/**
 * Lookup a place using the Google Places API
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of place candidates
 */
export const lookupPlace = async (query) => {
  try {
    logDebug(`[BulkAddService] Looking up place: ${query}`);
    const response = await placeService.searchPlaces(query);
    return handleApiResponse(response);
  } catch (error) {
    logError(`[BulkAddService] Error looking up place:`, error);
    return null;
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
    const response = await placeService.getPlaceDetails(placeId);
    return handleApiResponse(response);
  } catch (error) {
    logError(`[BulkAddService] Error getting place details:`, error);
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
    const response = await filterService.findNeighborhoodByZipcode(zipcode);
    return handleApiResponse(response);
  } catch (error) {
    logError(`[BulkAddService] Error finding neighborhood:`, error);
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
    const response = await filterService.getNeighborhoodsByCity(cityId);
    return handleApiResponse(response);
  } catch (error) {
    logError(`[BulkAddService] Error getting neighborhoods:`, error);
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
    const response = await filterService.getCities();
    return handleApiResponse(response);
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
    logDebug(`[BulkAddService] Checking if restaurant exists: ${name}`);
    const response = await restaurantService.searchRestaurants({ name, address, exact: true });
    const restaurants = handleApiResponse(response);
    
    if (restaurants && Array.isArray(restaurants) && restaurants.length > 0) {
      return restaurants[0];
    }
    return null;
  } catch (error) {
    logError(`[BulkAddService] Error checking existing restaurant:`, error);
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
    const response = await adminService.bulkAddRestaurants(items);
    return handleApiResponse(response);
  } catch (error) {
    logError(`[BulkAddService] Error submitting bulk items:`, error);
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
