// src/services/placeService.js
import apiClient from './apiClient';

const getAutocompleteSuggestions = async (input) => {
  try {
    const data = await apiClient(`/api/places/autocomplete?input=${encodeURIComponent(input)}`, 'Fetching place suggestions');
    return data || [];
  } catch (error) {
    console.error('[placeService] Error fetching autocomplete suggestions:', error);
    throw error;
  }
};

const getPlaceDetails = async (placeId) => {
  try {
    const data = await apiClient(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, 'Fetching place details');
    return data || {};
  } catch (error) {
    console.error('[placeService] Error fetching place details:', error);
    throw error;
  }
};

export const placeService = {
  getAutocompleteSuggestions,
  getPlaceDetails,
};