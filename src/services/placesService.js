/* src/services/placesService.js */
import apiClient, { ApiError } from '@/services/apiClient.js';

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

// Get autocomplete predictions
export const getAutocompletePredictions = async (input, types = ['establishment'], locationBias = null) => {
  if (!input) return []; // Return empty array if input is empty

  const queryParams = new URLSearchParams({ input, types: types.join('|') });
  if (locationBias) {
    // Add location bias parameters if needed (e.g., lat,lng,radius)
    // queryParams.append('location', `${locationBias.lat},${locationBias.lng}`);
    // queryParams.append('radius', String(locationBias.radius || 50000)); // Example radius
  }
  const endpoint = `/api/places/proxy/autocomplete?${queryParams.toString()}`;
  const context = 'PlacesService Autocomplete';

  try {
    // Assuming your backend proxy handles the actual Google API call
    const response = await apiClient(endpoint, context);
    if (!response.success || !Array.isArray(response.data)) { // Check if data is array
      // Handle cases where Google API might return ZERO_RESULTS successfully
      if (response.status === 200 && response.data?.status === 'ZERO_RESULTS') {
        return [];
      }
      throw new ApiError(response.error || 'Failed to fetch autocomplete predictions.', response.status || 500, response);
    }
    return response.data.map(formatPrediction).filter(Boolean);
  } catch (error) {
    console.error(`[${context}] Error for input "${input}":`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to fetch predictions', 500, error);
  }
};

// Get place details by placeId
export const getPlaceDetails = async (placeId, fields = ['place_id', 'name', 'formatted_address', 'geometry', 'url']) => {
  if (!placeId) throw new ApiError('Place ID is required', 400);

  const queryParams = new URLSearchParams({ place_id: placeId, fields: fields.join(',') });
  const endpoint = `/api/places/proxy/details?${queryParams.toString()}`;
  const context = `PlacesService Details (${placeId})`;

  try {
    // Assuming your backend proxy handles the actual Google API call
    const response = await apiClient(endpoint, context);
    if (!response.success || !response.data) { // Check if data exists
      throw new ApiError(response.error || 'Failed to fetch place details.', response.status || 404, response); // 404 if not found
    }
    const formatted = formatPlaceDetails(response.data);
    if (!formatted) {
      throw new ApiError('Invalid place details data received.', 500);
    }
    return formatted;
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Failed to fetch place details', 500, error);
  }
};


// --- Service Object Export ---
export const placesService = {
  getAutocompletePredictions,
  getPlaceDetails,
};

// --- Default Export ---
export default placesService;