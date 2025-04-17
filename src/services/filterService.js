/* src/services/filterService.js */
import apiClient, { ApiError } from '@/services/apiClient';

const getCities = async () => {
    try {
        const response = await apiClient('/api/filters/cities', 'FilterService Cities');
        if (!response?.success || !Array.isArray(response?.data)) {
            console.warn('[FilterService getCities] Invalid response data:', response);
            return [];
        }
        const data = response.data;
        const validCities = data.filter((item) => !!item && item.id != null && typeof item.name === 'string');
        return validCities
            .map(city => ({ ...city, id: Number(city.id) }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        console.error("[FilterService getCities] Fetch error:", error);
        return [];
    }
};

const getCuisines = async () => {
     try {
        const response = await apiClient('/api/filters/cuisines', 'FilterService Cuisines');
        if (!response?.success || !Array.isArray(response?.data)) {
             console.warn('[FilterService getCuisines] Invalid response data:', response);
             return [];
        }
        const data = response.data;
        const validCuisines = data.filter((item) => !!item && item.id != null && typeof item.name === 'string');
         return validCuisines
            .map(cuisine => ({ ...cuisine, id: Number(cuisine.id) }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
     } catch (error) {
         console.error("[FilterService getCuisines] Fetch error:", error);
         return [];
     }
};

const getNeighborhoodsByCity = async (cityId) => {
    const cityIdNum = cityId != null ? parseInt(String(cityId), 10) : NaN;
    if (isNaN(cityIdNum) || cityIdNum <= 0) {
        console.warn(`[FilterService getNeighborhoodsByCity] Invalid cityId: ${cityId}`);
        return [];
    }
    try {
        // This correctly calls the endpoint designed for filtering by city
        const response = await apiClient(`/api/filters/neighborhoods?cityId=${cityIdNum}`, `FilterService Neighborhoods city ${cityIdNum}`);
         if (!response?.success || !Array.isArray(response?.data)) {
             console.warn(`[FilterService getNeighborhoodsByCity] Invalid response data for city ${cityIdNum}:`, response);
             return [];
         }
         const data = response.data;
         const validNeighborhoods = data.filter((item) => !!item && item.id != null && typeof item.name === 'string');
         return validNeighborhoods
            .map(nb => ({
                 ...nb,
                 id: Number(nb.id),
                 city_id: nb.city_id ? Number(nb.city_id) : undefined,
                 // Ensure zipcode_ranges is handled correctly if present in response
                 zipcode_ranges: Array.isArray(nb.zipcode_ranges) ? nb.zipcode_ranges : (typeof nb.zipcode_ranges === 'string' ? nb.zipcode_ranges.split(',').map(z => z.trim()) : null)
            }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to load neighborhoods for city ${cityIdNum}.`;
        console.error(`[FilterService getNeighborhoodsByCity] Fetch error for city ${cityIdNum}:`, error);
        // Consider re-throwing or returning empty based on how calling components handle errors
        throw new Error(message); // Re-throwing allows React Query to handle error state
        // return [];
    }
};

// --- findNeighborhoodByZipcode CORRECTION ---
// This now calls the dedicated backend endpoint for efficiency and accuracy.
const findNeighborhoodByZipcode = async (zipcode) => {
    const validZipRegex = /^\d{5}$/;
    if (!zipcode || !validZipRegex.test(zipcode)) {
        console.warn(`[FilterService findNeighborhoodByZipcode] Invalid zipcode: ${zipcode}`);
        return null;
    }

    const endpoint = `/api/neighborhoods/by-zipcode/${zipcode}`;
    const context = `FilterService ZipLookup ${zipcode}`;

    console.log(`[FilterService] Calling backend zipcode lookup: ${endpoint}`);

    try {
        // apiClient returns { success: boolean, data: Neighborhood | null, error: string | null, status: number | null }
        const response = await apiClient(endpoint, context);

        // Check if the request was successful and data exists (backend returns 404 if not found)
        if (response.success && response.data && typeof response.data.id === 'number') {
            console.log(`[FilterService] Backend lookup successful for ${zipcode}:`, response.data);
            // Ensure numeric IDs and return the neighborhood object directly
            // (assuming backend returns the correct structure including city_name)
            return {
                ...response.data,
                id: Number(response.data.id),
                city_id: Number(response.data.city_id),
            };
        } else if (response.status === 404) {
             console.log(`[FilterService] Backend lookup for ${zipcode} returned 404 (Not Found).`);
             return null;
        } else {
            // Log other errors from the backend
            console.error(`[FilterService] Backend lookup failed for ${zipcode}:`, response.error || `Status ${response.status}`);
            return null;
        }
    } catch (error) {
        // Catch errors from the apiClient call itself (e.g., network error)
        console.error(`[FilterService findNeighborhoodByZipcode] API call failed for zipcode ${zipcode}:`, error instanceof Error ? error.message : 'Unknown error');
        return null; // Return null on error
    }
};
// --- End Correction ---


export const filterService = {
    getCities,
    getCuisines,
    getNeighborhoodsByCity,
    findNeighborhoodByZipcode, // Export the corrected function
};