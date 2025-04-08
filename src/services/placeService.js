// src/services/placeService.js
import apiClient from '@/services/apiClient'; // Use alias

const getAutocompleteSuggestions = async (input) => {
  // console.log(`[placeService] Fetching autocomplete for input: "${input}"`);
  if (!input || String(input).trim().length < 2) { // Add check for minimum input length
       return []; // Return empty if input is too short
  }
  try {
    // Expecting response structure: PlaceAutocompletePrediction[] (Google API structure, likely passed through by backend)
    const response = await apiClient(`/api/places/autocomplete?input=${encodeURIComponent(input)}`, 'Fetching place suggestions');
    // No need to access .data here if backend directly returns the array
    const data = response; // Assuming backend passes predictions array directly
    // console.log(`[placeService] Received ${data?.length || 0} suggestions.`);
    return Array.isArray(data) ? data : []; // Return data or empty array
  } catch (error) {
    console.error('[placeService] Error fetching autocomplete suggestions:', error.message || error);
    throw error; // Re-throw for calling components/hooks
  }
};

const getPlaceDetails = async (placeId) => {
  // console.log(`[placeService] Fetching details for placeId: "${placeId}"`);
  if (!placeId) {
      console.warn('[placeService getPlaceDetails] placeId is missing.');
      return {}; // Return empty object if no placeId
  }
  try {
    // Expecting { data: PlaceDetails } - apiClient handles the {data: ...} wrapper
    const response = await apiClient(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, 'Fetching place details');
    const data = response?.data; // Access the data property from ApiResponse
    // console.log(`[placeService] Received details:`, data);
    // Check if data is a non-null object before returning
    return (typeof data === 'object' && data !== null) ? data : {};
  } catch (error) {
    console.error('[placeService] Error fetching place details:', error.message || error);
    throw error;
  }
};

const findPlaceByText = async (query) => {
  // console.log(`[placeService] Finding place for query: "${query}"`);
  if (!query || String(query).trim().length === 0) {
       console.warn('[placeService findPlaceByText] query is missing or empty.');
       return null; // Return null if query is empty
  }
  try {
    // Expecting { data: PlaceDetails }
    const response = await apiClient(`/api/places/find?query=${encodeURIComponent(query)}`, 'Finding place by text');
    const data = response?.data; // Access data property
    // console.log(`[placeService] Found place data:`, data);
    // Check if data is a non-null object with keys before returning
    return (typeof data === 'object' && data !== null && Object.keys(data).length > 0) ? data : null;
  } catch (error) {
    console.error('[placeService] Error finding place by text:', error.message || error);
    throw error; // Re-throw for components/hooks to handle
  }
};


export const placeService = {
  getAutocompleteSuggestions,
  getPlaceDetails,
  findPlaceByText,
};