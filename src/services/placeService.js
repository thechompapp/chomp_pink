// src/services/placeService.js
import apiClient from './apiClient';

const getAutocompleteSuggestions = async (input) => {
  // console.log(`[placeService] Fetching autocomplete for input: "${input}"`); // Keep for debugging if needed
  try {
    // Ensure the endpoint matches the backend route
    const data = await apiClient(`/api/places/autocomplete?input=${encodeURIComponent(input)}`, 'Fetching place suggestions');
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
    const data = await apiClient(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, 'Fetching place details');
    // console.log(`[placeService] Received details:`, data); // Keep for debugging if needed
    // Return data or empty object, ensuring it's always an object
    return typeof data === 'object' && data !== null ? data : {};
  } catch (error) {
    console.error('[placeService] Error fetching place details:', error.message || error);
    throw error;
  }
};

export const placeService = {
  getAutocompleteSuggestions,
  getPlaceDetails,
};