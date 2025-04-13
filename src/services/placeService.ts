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
    addressComponents?: any[]; // Include address components if needed
    // Add other relevant fields returned by your backend proxy endpoint
}

// Type for the response structure from *our backend proxy*
interface BackendApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string; // For errors from the proxy
}


// Type the function parameters and return values
const getAutocompleteSuggestions = async (input: string | null | undefined): Promise<AutocompletePrediction[]> => {
    const trimmedInput = input?.trim();
    if (!trimmedInput || trimmedInput.length < 2) {
        return [];
    }
    try {
        // Call the NEW backend proxy endpoint
        const response = await apiClient<BackendApiResponse<AutocompletePrediction[]>>(
            // IMPORTANT: Use the new proxy route
            `/api/places/proxy/autocomplete?input=${encodeURIComponent(trimmedInput)}`,
            'PlaceService Autocomplete via Proxy'
        );

        // Check the success flag from our backend wrapper
        if (!response.success || !Array.isArray(response.data)) {
            console.warn('[placeService Autocomplete] Proxy request failed or returned invalid data:', response.message || 'No data');
            return []; // Return empty on failure or invalid data
        }

        return response.data;
    } catch (error) {
        console.error('[placeService] Error fetching autocomplete suggestions via proxy:', error instanceof Error ? error.message : error);
        // Re-throw or return empty based on how calling code handles errors
        // Returning empty might be safer for UI components
        return [];
    }
};

const getPlaceDetails = async (placeId: string | null | undefined): Promise<PlaceDetails | null> => { // Return null on error/not found
    if (!placeId) {
        console.warn('[placeService getPlaceDetails] placeId is missing.');
        return null;
    }
    try {
        // Call the NEW backend proxy endpoint
        const response = await apiClient<BackendApiResponse<PlaceDetails>>(
             // IMPORTANT: Use the new proxy route
            `/api/places/proxy/details?placeId=${encodeURIComponent(placeId)}`,
            'PlaceService Details via Proxy'
        );

        // Check the success flag and data presence from our backend wrapper
        if (!response.success || !response.data) {
            console.warn(`[placeService Details] Proxy request failed or returned no data for placeId ${placeId}:`, response.message || 'No data');
            return null; // Return null on failure or if data is missing
        }

        // Return the details object contained within 'data'
        return response.data;
    } catch (error) {
        console.error(`[placeService] Error fetching place details via proxy for ${placeId}:`, error instanceof Error ? error.message : error);
        // Return null instead of throwing to allow components to handle "not found" gracefully
        return null;
    }
};

// Keep findPlaceByText if still needed, but update it to use the backend proxy if one exists
const findPlaceByText = async (query: string | null | undefined): Promise<PlaceDetails | null> => {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) {
        console.warn('[placeService findPlaceByText] query is missing or empty.');
        return null;
    }
    try {
        // Assuming you might create a '/api/places/proxy/find' endpoint as well
        // If not, this function might become obsolete or need to call Google directly (undesirable)
        // For now, let's assume a proxy endpoint exists or will be created:
        const response = await apiClient<BackendApiResponse<PlaceDetails>>(
             // IMPORTANT: Assumes a proxy route exists or will be created
            `/api/places/proxy/find?query=${encodeURIComponent(trimmedQuery)}`,
            'PlaceService Find via Proxy'
        );

        if (!response.success || !response.data) {
            console.warn(`[placeService Find] Proxy request failed or returned no data for query "${trimmedQuery}":`, response.message || 'No data');
            return null;
        }

        return response.data;
    } catch (error) {
        console.error('[placeService] Error finding place by text via proxy:', error instanceof Error ? error.message : error);
        // Return null on error
        return null;
    }
};


export const placeService = {
    getAutocompleteSuggestions,
    getPlaceDetails,
    findPlaceByText,
};