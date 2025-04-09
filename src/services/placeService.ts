/* src/services/placeService.ts */
import apiClient from '@/services/apiClient';

// Define interfaces for the expected API responses if possible
// Based on Google Places API structure (simplified)
interface AutocompletePrediction {
    description: string;
    place_id: string;
    // other fields like terms, types etc. can be added
}

interface PlaceDetails {
    name?: string;
    formattedAddress?: string; // Typically formatted_address
    city?: string | null;
    neighborhood?: string | null;
    placeId?: string; // Typically place_id
    location?: { lat: number; lng: number };
    // Add other relevant fields returned by your backend /api/places/details
}

interface PlaceDetailsResponse {
  data?: PlaceDetails; // Assuming apiClient wraps in 'data'
}

// Type the function parameters and return values
const getAutocompleteSuggestions = async (input: string | null | undefined): Promise<AutocompletePrediction[]> => {
    const trimmedInput = input?.trim();
    if (!trimmedInput || trimmedInput.length < 2) {
        return [];
    }
    try {
        // Assuming backend '/api/places/autocomplete' returns AutocompletePrediction[] directly (or wrapped in { data: [...] })
        // Adjust the expected type <AutocompletePrediction[]> based on actual API response structure
        const response = await apiClient<AutocompletePrediction[]>(`/api/places/autocomplete?input=${encodeURIComponent(trimmedInput)}`, 'PlaceService Autocomplete');
        // If apiClient wraps in { data: [...] }, access response.data
        const data = response; // Modify if needed: response?.data
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('[placeService] Error fetching autocomplete suggestions:', error instanceof Error ? error.message : error);
        // Re-throw or return empty based on how calling code handles errors
        throw error; // Re-throwing allows React Query to handle it
    }
};

const getPlaceDetails = async (placeId: string | null | undefined): Promise<PlaceDetails> => {
    if (!placeId) {
        console.warn('[placeService getPlaceDetails] placeId is missing.');
        return {}; // Return empty object for consistency
    }
    try {
        // Assuming backend '/api/places/details' returns { data: PlaceDetails }
        const response = await apiClient<PlaceDetailsResponse>(`/api/places/details?placeId=${encodeURIComponent(placeId)}`, 'PlaceService Details');
        const data = response?.data; // Access data property
        // Check if data is a valid object before returning
        return (typeof data === 'object' && data !== null) ? data : {};
    } catch (error) {
        console.error('[placeService] Error fetching place details:', error instanceof Error ? error.message : error);
        throw error; // Re-throw for React Query
    }
};

const findPlaceByText = async (query: string | null | undefined): Promise<PlaceDetails | null> => {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) {
        console.warn('[placeService findPlaceByText] query is missing or empty.');
        return null;
    }
    try {
        // Assuming backend '/api/places/find' returns { data: PlaceDetails | null }
        const response = await apiClient<PlaceDetailsResponse>(`/api/places/find?query=${encodeURIComponent(trimmedQuery)}`, 'PlaceService Find');
        const data = response?.data; // Access data property
        // Check if data is a valid object with content before returning
        return (typeof data === 'object' && data !== null && Object.keys(data).length > 0) ? data : null;
    } catch (error) {
        console.error('[placeService] Error finding place by text:', error instanceof Error ? error.message : error);
        throw error; // Re-throw for React Query
    }
};

export const placeService = {
    getAutocompleteSuggestions,
    getPlaceDetails,
    findPlaceByText,
};