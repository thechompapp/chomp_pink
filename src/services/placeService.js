// src/services/placeService.js
import apiClient from '@/services/apiClient';

const getAutocompleteSuggestions = async (input) => {
    if (!input || String(input).trim().length < 2) {
        return [];
    }
    try {
        const response = await apiClient(`/api/places/autocomplete?input=${encodeURIComponent(input)}`, 'Fetching place suggestions');
        const data = response; // Assuming backend returns array directly
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('[placeService] Error fetching autocomplete suggestions:', error.message || error);
        throw error;
    }
};

const getPlaceDetails = async (placeId) => {
    if (!placeId) {
        console.warn('[placeService getPlaceDetails] placeId is missing.');
        return {};
    }
    try {
        const response = await apiClient(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, 'Fetching place details');
        const data = response?.data;
        return (typeof data === 'object' && data !== null) ? data : {};
    } catch (error) {
        console.error('[placeService] Error fetching place details:', error.message || error);
        throw error;
    }
};

const findPlaceByText = async (query) => {
    if (!query || String(query).trim().length === 0) {
        console.warn('[placeService findPlaceByText] query is missing or empty.');
        return null;
    }
    try {
        const response = await apiClient(`/api/places/find?query=${encodeURIComponent(query)}`, 'Finding place by text');
        const data = response?.data;
        return (typeof data === 'object' && data !== null && Object.keys(data).length > 0) ? data : null;
    } catch (error) {
        console.error('[placeService] Error finding place by text:', error.message || error);
        throw error;
    }
};

export const placeService = {
    getAutocompleteSuggestions,
    getPlaceDetails,
    findPlaceByText,
};