// src/services/placeService.js
import apiClient from '@/services/apiClient'; // Corrected import (removed .js extension)

const getAutocompleteSuggestions = async (input) => {
  // console.log(`[placeService] Fetching autocomplete for input: "${input}"`); // Keep for debugging if needed
  try {
    // Ensure the endpoint matches the backend route
    // Expecting { data: PlaceAutocompletePrediction[] }
    const response = await apiClient(`/api/places/autocomplete?input=${encodeURIComponent(input)}`, 'Fetching place suggestions');
    const data = response?.data;
    // console.log(`[placeService] Received ${data?.length || 0} suggestions.`); // Keep for debugging if needed
    // Return data or empty array, ensuring it's always an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // Log the error caught by apiClient or fetch issues
    console.error('[placeService] Error fetching autocomplete suggestions:', error.message || error);
    // Re-throw to allow calling components (like the hook) to handle it
    throw error;
  }
};

const getPlaceDetails = async (placeId) => {
  // console.log(`[placeService] Fetching details for placeId: "${placeId}"`); // Keep for debugging if needed
  try {
    // Ensure the endpoint matches the backend route
    // Expecting { data: PlaceDetails }
    const response = await apiClient(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, 'Fetching place details');
    const data = response?.data;
    // console.log(`[placeService] Received details:`, data); // Keep for debugging if needed
    // Return data or empty object, ensuring it's always an object
    // Check if data is explicitly null before returning empty object
    return (typeof data === 'object' && data !== null) ? data : {};
  } catch (error) {
    console.error('[placeService] Error fetching place details:', error.message || error);
    throw error;
  }
};

// *** NEW FUNCTION ***
// Searches for a place using a text query (e.g., "Restaurant Name, City")
const findPlaceByText = async (query) => {
  console.log(`[placeService] Finding place for query: "${query}"`); // Log input
  try {
    // Ensure the endpoint matches the backend route
    // Expecting { data: PlaceDetails }
    const response = await apiClient(`/api/places/find?query=${encodeURIComponent(query)}`, 'Finding place by text');
    const data = response?.data;
    console.log(`[placeService] Found place data:`, data);
    // Return data or null if not found/error (apiClient might throw)
    // Check if data is an empty object, return null in that case
    return (typeof data === 'object' && data !== null && Object.keys(data).length > 0) ? data : null;
  } catch (error) {
    console.error('[placeService] Error finding place by text:', error.message || error);
    throw error; // Re-throw for components/hooks to handle
  }
};


export const placeService = {
  getAutocompleteSuggestions,
  getPlaceDetails,
  findPlaceByText, // Export the new function
};