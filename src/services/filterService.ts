/* src/services/filterService.ts */
import apiClient from '@/services/apiClient';
import type { City, Cuisine, Neighborhood } from '@/types/Filters'; // Use types

// Type the response data expected from apiClient
// Assuming the API returns { data: ... }
interface CitiesResponse { data?: City[] }
interface CuisinesResponse { data?: Cuisine[] }
interface NeighborhoodsResponse { data?: Neighborhood[] }
// **** ADDED Response type for single neighborhood lookup ****
interface NeighborhoodLookupResponse { data?: Neighborhood | null }


const getCities = async (): Promise<City[]> => {
    try {
        // Explicitly type the expected response structure
        const response = await apiClient<CitiesResponse>('/api/filters/cities', 'FilterService Cities');
        const data = response?.data || [];
        const validCities = Array.isArray(data)
            ? data.filter((item): item is City => !!item && item.id != null && typeof item.name === 'string')
            : [];
        // Ensure IDs are numbers if they come as strings
        return validCities
            .map(city => ({ ...city, id: Number(city.id) }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        console.error('[FilterService] Error fetching cities:', error);
        // Throw a new error or return empty array based on desired behavior
        // throw new Error('Failed to load cities.');
        return [];
    }
};

const getCuisines = async (): Promise<Cuisine[]> => {
     try {
        const response = await apiClient<CuisinesResponse>('/api/filters/cuisines', 'FilterService Cuisines');
        const data = response?.data || [];
        const validCuisines = Array.isArray(data)
            ? data.filter((item): item is Cuisine => !!item && item.id != null && typeof item.name === 'string')
            : [];
         // Ensure IDs are numbers
         return validCuisines
            .map(cuisine => ({ ...cuisine, id: Number(cuisine.id) }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
     } catch (error) {
         console.error('[FilterService] Error fetching cuisines:', error);
         return [];
     }
};

const getNeighborhoodsByCity = async (cityId: number | string | null | undefined): Promise<Neighborhood[]> => {
    const cityIdNum = cityId != null ? parseInt(String(cityId), 10) : NaN;

    if (isNaN(cityIdNum) || cityIdNum <= 0) {
        console.warn(`[FilterService] Invalid or missing cityId provided: ${cityId}. Returning empty array.`);
        return [];
    }

    try {
        const response = await apiClient<NeighborhoodsResponse>(`/api/filters/neighborhoods?cityId=${cityIdNum}`, `FilterService Neighborhoods city ${cityIdNum}`);
        const data = response?.data || [];
        const validNeighborhoods = Array.isArray(data)
            ? data.filter((item): item is Neighborhood => !!item && item.id != null && typeof item.name === 'string')
            : [];
         // Ensure IDs are numbers
         return validNeighborhoods
            .map(nb => ({
                 ...nb,
                 id: Number(nb.id),
                 city_id: nb.city_id ? Number(nb.city_id) : undefined,
                 zipcode_ranges: Array.isArray(nb.zipcode_ranges) ? nb.zipcode_ranges : null // Ensure correct type
            }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        console.error(`[FilterService] Error fetching neighborhoods for city ${cityIdNum}:`, error);
        // Rethrow error for React Query to handle
        const message = error instanceof Error ? error.message : `Failed to load neighborhoods for city ${cityIdNum}.`;
        throw new Error(message);
    }
};

// **** ADDED Function ****
const findNeighborhoodByZipcode = async (zipcode: string): Promise<Neighborhood | null> => {
    const validZipRegex = /^\d{5}$/;
    if (!zipcode || !validZipRegex.test(zipcode)) {
        console.warn(`[FilterService] Invalid zipcode provided for lookup: ${zipcode}`);
        return null; // Don't call API with invalid zip
    }

    try {
        const response = await apiClient<NeighborhoodLookupResponse>(
            `/api/neighborhoods/by-zipcode?zipcode=${zipcode}`,
            `FilterService Neighborhood by Zip ${zipcode}`
        );
        // The backend returns { data: Neighborhood } or { data: null }
        return response?.data ?? null;
    } catch (error) {
        console.error(`[FilterService] Error fetching neighborhood for zipcode ${zipcode}:`, error);
        // Don't throw, return null so the calling code can handle not finding one
        return null;
    }
};
// **** END ADDED Function ****

export const filterService = {
    getCities,
    getCuisines,
    getNeighborhoodsByCity,
    findNeighborhoodByZipcode, // **** ADDED Export ****
};