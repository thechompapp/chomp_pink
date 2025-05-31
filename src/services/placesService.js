/* src/services/placesService.js */
import apiClient from '@/services/apiClient.js';
import { handleApiResponse, createQueryParams } from '@/utils/serviceHelpers.js';
import { logError, logDebug, logWarn } from '@/utils/logger.js';

// --- Helper Function (if any) ---
// Format predictions from autocomplete
const formatPrediction = (prediction) => {
  // Adapt based on the actual structure returned by your backend proxy
  if (!prediction || !prediction.place_id || !prediction.description) return null;
  return {
    placeId: prediction.place_id,
    description: prediction.description,
    // Include structured_formatting or other useful fields if available
    mainText: prediction.structured_formatting?.main_text || prediction.description.split(',')[0],
    secondaryText: prediction.structured_formatting?.secondary_text || prediction.description.substring(prediction.description.indexOf(',') + 1).trim(),
  };
};

// Format place details
const formatPlaceDetails = (details) => {
  // Adapt based on the actual structure returned by your backend proxy
  if (!details || !details.place_id) return null;
  return {
    placeId: details.place_id,
    name: details.name,
    address: details.formatted_address,
    phoneNumber: details.formatted_phone_number || null,
    website: details.website || null,
    googleMapsUrl: details.url,
    location: {
      lat: details.geometry?.location?.lat,
      lng: details.geometry?.location?.lng,
    },
    // Add other needed fields: photos, opening_hours, reviews, etc.
  };
};

// --- Service Functions ---

/**
 * Get autocomplete predictions from the Google Places API
 * @param {string} input - The search term
 * @param {Array<string>} types - Types of results to return
 * @param {Object} locationBias - Optional location bias parameters
 * @returns {Promise<Array>} Formatted prediction results
 */
export const getAutocompletePredictions = async (input, types = ['establishment'], locationBias = null) => {
  if (!input) {
    logWarn('[PlacesService] Empty input provided for autocomplete predictions');
    return []; // Return empty array if input is empty
  }

  const params = { input, types: types.join('|') };
  
  if (locationBias) {
    // Add location bias parameters if provided
    if (locationBias.lat && locationBias.lng) {
      params.location = `${locationBias.lat},${locationBias.lng}`;
    }
    if (locationBias.radius) {
      params.radius = String(locationBias.radius);
    }
  }
  
  logDebug(`[PlacesService] Fetching autocomplete predictions for: ${input}`);
  
  return handleApiResponse(
    () => apiClient.get('/places/proxy/autocomplete', { params }),
    'placesService.getAutocompleteSuggestions'
  ).then(data => {
    // Handle zero results case (this is a successful case, just empty)
    if (data?.status === 'ZERO_RESULTS') {
      return [];
    }
    
    // Process and format the predictions
    return Array.isArray(data) 
      ? data.map(formatPrediction).filter(Boolean)
      : [];
  }).catch(error => {
    logError(`[PlacesService] Failed to fetch predictions for "${input}":`, error);
    throw error;
  });
};

/**
 * Get place details from the Google Places API by placeId
 * @param {string} placeId - The Google Places API place ID
 * @param {Array<string>} fields - List of fields to fetch
 * @returns {Promise<Object>} Formatted place details
 */
export const getPlaceDetails = async (placeId, fields = ['place_id', 'name', 'formatted_address', 'geometry', 'url']) => {
  if (!placeId) {
    throw new Error('Place ID is required');
  }

  const params = { 
    place_id: placeId, 
    fields: fields.join(',') 
  };
  
  const context = `PlacesService Details (${placeId})`;
  logDebug(`[PlacesService] Fetching place details for ID: ${placeId}`);
  
  return handleApiResponse(
    () => apiClient.get('/places/proxy/details', { params }),
    context
  ).then(data => {
    const formatted = formatPlaceDetails(data);
    if (!formatted) {
      logError(`[PlacesService] Received invalid place details data for ID: ${placeId}`);
      throw new Error('Invalid place details data received.');
    }
    return formatted;
  }).catch(error => {
    logError(`[PlacesService] Failed to fetch place details for ID ${placeId}:`, error);
    throw error;
  });
};


// --- Service Object Export ---
export const placesService = {
  getAutocompletePredictions,
  getPlaceDetails,
};

// --- Default Export ---
export default placesService;