// src/services/filterService.js
import apiClient from '@/services/apiClient'; // Use alias

const getCities = async () => {
    // Expecting { data: City[] }
    const response = await apiClient('/api/filters/cities', 'FilterService Cities');
    const data = response?.data || [];
    // Ensure valid items with id and name before sorting
    const validCities = Array.isArray(data)
         ? data.filter(item => item && item.id != null && typeof item.name === 'string')
         : [];
    // Sort alphabetically by name
    return validCities.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
};

const getCuisines = async () => {
    // Expecting { data: Cuisine[] }
    const response = await apiClient('/api/filters/cuisines', 'FilterService Cuisines');
    const data = response?.data || [];
    // Ensure valid items with id and name before sorting
    const validCuisines = Array.isArray(data)
         ? data.filter(item => item && item.id != null && typeof item.name === 'string')
         : [];
    // Sort alphabetically by name
    return validCuisines.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
};

const getNeighborhoodsByCity = async (cityId) => {
    if (cityId === null || cityId === undefined || isNaN(parseInt(cityId, 10)) || parseInt(cityId, 10) <= 0) {
        console.warn(`[FilterService] Invalid or missing cityId provided: ${cityId}. Returning empty array.`);
        return []; // Return empty array if cityId is invalid or missing
    }
    const cityIdInt = parseInt(cityId, 10); // Ensure it's a number

    try {
        // Expecting { data: Neighborhood[] }
        const response = await apiClient(`/api/filters/neighborhoods?cityId=${cityIdInt}`, `FilterService Neighborhoods city ${cityIdInt}`);
        const data = response?.data || [];
        // Ensure valid items with id and name before sorting
        const validNeighborhoods = Array.isArray(data)
             ? data.filter(item => item && item.id != null && typeof item.name === 'string')
             : [];
        // Sort alphabetically by name
        return validNeighborhoods.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
         console.error(`[FilterService] Error fetching neighborhoods for city ${cityIdInt}:`, error);
         // Ensure error has a message property
         const message = error instanceof Error ? error.message : `Failed to load neighborhoods for city ${cityIdInt}.`;
         throw new Error(message); // Rethrow consistent error
    }
};

export const filterService = {
    getCities,
    getCuisines,
    getNeighborhoodsByCity,
};