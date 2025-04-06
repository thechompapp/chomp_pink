// src/services/placeService.js
import apiClient from './apiClient';

const getAutocompleteSuggestions = async (input) => {
  console.log(`[placeService] Fetching autocomplete for input: "${input}"`);
  try {
    // Ensure the endpoint matches the backend route
    const data = await apiClient(`/api/places/autocomplete?input=${encodeURIComponent(input)}`, 'Fetching place suggestions');
    console.log(`[placeService] Received ${data?.length || 0} suggestions.`);
    return data || []; // Return data or empty array
  } catch (error) {
    // Log the error caught by apiClient or fetch issues
    console.error('[placeService] Error fetching autocomplete suggestions:', error.message || error);
    // Re-throw to allow calling components (like the hook) to handle it
    throw error;
  }
};

const getPlaceDetails = async (placeId) => {
  console.log(`[placeService] Fetching details for placeId: "${placeId}"`);
  try {
    // Ensure the endpoint matches the backend route
    const data = await apiClient(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, 'Fetching place details');
    console.log(`[placeService] Received details:`, data);
    return data || {}; // Return data or empty object
  } catch (error) {
    console.error('[placeService] Error fetching place details:', error.message || error);
    throw error;
  }
};

export const placeService = {
  getAutocompleteSuggestions,
  getPlaceDetails,
};