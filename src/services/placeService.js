/* src/services/placeService.js */
/* REMOVED: All TypeScript syntax */
import apiClient from '@/services/apiClient';

// REMOVED: interface AutocompletePrediction { ... }
// REMOVED: interface PlaceDetails { ... }
// REMOVED: interface BackendApiResponse<T> { ... }

// Fetches autocomplete suggestions from the backend proxy
const getAutocompleteSuggestions = async (input) => { // REMOVED: : Promise<AutocompletePrediction[]>
    if (!input || typeof input !== 'string' || input.trim().length < 2) {
        return []; // Return empty array for invalid/short input
    }
    const endpoint = `/api/places/proxy/autocomplete?input=${encodeURIComponent(input.trim())}`;
    try {
        // Assume apiClient returns { success: boolean, data: AutocompletePrediction[] | null, error: string | null }
        const response = await apiClient/*REMOVED: <AutocompletePrediction[]>*/(endpoint, 'PlaceService Autocomplete');
        // Check success and if data is an array
        if (!response.success || !Array.isArray(response.data)) {
             console.warn(`[PlaceService Autocomplete] Invalid response for input "${input}":`, response);
             return []; // Return empty array on failure or invalid data
        }
        // Optional: Further validate structure of each prediction if needed
        return response.data.filter(p => p && typeof p.place_id === 'string'); // Basic check
    } catch (error) {
        console.error(`[PlaceService Autocomplete] Error fetching suggestions for "${input}":`, error);
        return []; // Return empty array on error
    }
};

// Fetches place details from the backend proxy
const getPlaceDetails = async (placeId) => { // REMOVED: : Promise<PlaceDetails | null>
    if (!placeId || typeof placeId !== 'string' || placeId.trim() === '') {
        console.warn('[PlaceService Details] Invalid placeId provided:', placeId);
        return null;
    }
    const endpoint = `/api/places/proxy/details?placeId=${encodeURIComponent(placeId.trim())}`;
    try {
         // Assume apiClient returns { success: boolean, data: PlaceDetails | null, error: string | null }
        const response = await apiClient/*REMOVED: <PlaceDetails>*/(endpoint, `PlaceService Details ${placeId}`);
        // Check success and if data is an object
        if (!response.success || !response.data || typeof response.data !== 'object') {
             console.warn(`[PlaceService Details] Invalid response for placeId "${placeId}":`, response);
            return null; // Return null on failure or invalid data
        }
         // Optional: Validate specific fields within response.data if necessary
         if (typeof response.data.placeId !== 'string') {
             console.warn(`[PlaceService Details] Missing or invalid placeId in response data for input placeId "${placeId}"`);
             return null;
         }
        return response.data;
    } catch (error) {
        console.error(`[PlaceService Details] Error fetching details for placeId "${placeId}":`, error);
        return null; // Return null on error
    }
};


export const placeService = {
    getAutocompleteSuggestions,
    getPlaceDetails,
};