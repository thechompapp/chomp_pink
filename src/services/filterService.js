// src/services/filterService.js
import apiClient from '@/services/apiClient'; // Corrected import (removed .js extension)

const getCities = async () => {
    // Expecting { data: City[] }
    const response = await apiClient('/api/filters/cities', 'FilterService Cities');
    const data = response?.data || [];
    // Ensure valid items with id and name before sorting
    const validCities = Array.isArray(data)
         ? data.filter(item => item && item.id != null && typeof item.name === 'string')
         : [];
    const sorted = validCities.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return sorted;
};

const getCuisines = async () => {
    // Expecting { data: Cuisine[] }
    const response = await apiClient('/api/filters/cuisines', 'FilterService Cuisines');
    const data = response?.data || [];
    // Ensure valid items with id and name before sorting
    const validCuisines = Array.isArray(data)
         ? data.filter(item => item && item.id != null && typeof item.name === 'string')
         : [];
    const sorted = validCuisines.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return sorted;
};

const getNeighborhoodsByCity = async (cityId) => {
    if (!cityId) return []; // Return empty array if no cityId
    const cityIdInt = parseInt(cityId, 10);
    if (isNaN(cityIdInt) || cityIdInt <= 0) {
         console.warn(`[FilterService] Invalid cityId provided: ${cityId}`);
         return []; // Return empty if cityId is not a valid positive integer
    }
    try {
        // Expecting { data: Neighborhood[] }
        const response = await apiClient(`/api/filters/neighborhoods?cityId=${cityIdInt}`, `FilterService Neighborhoods city ${cityIdInt}`);
        const data = response?.data || [];
        // Ensure valid items with id and name before sorting
        const validNeighborhoods = Array.isArray(data)
             ? data.filter(item => item && item.id != null && typeof item.name === 'string')
             : [];
        const sorted = validNeighborhoods.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        return sorted;
    } catch (error) {
         console.error(`[FilterService] Error fetching neighborhoods for city ${cityIdInt}:`, error);
         throw new Error(error.message || `Failed to load neighborhoods for city ${cityIdInt}.`); // Rethrow consistent error
    }
};

export const filterService = {
    getCities,
    getCuisines,
    getNeighborhoodsByCity,
};