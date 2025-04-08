// src/services/filterService.js
import apiClient from '@/services/apiClient';

const getCities = async () => {
    const response = await apiClient('/api/filters/cities', 'FilterService Cities');
    const data = response?.data || [];
    const validCities = Array.isArray(data)
        ? data.filter(item => item && item.id != null && typeof item.name === 'string')
        : [];
    return validCities.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
};

const getCuisines = async () => {
    const response = await apiClient('/api/filters/cuisines', 'FilterService Cuisines');
    const data = response?.data || [];
    const validCuisines = Array.isArray(data)
        ? data.filter(item => item && item.id != null && typeof item.name === 'string')
        : [];
    return validCuisines.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
};

const getNeighborhoodsByCity = async (cityId) => {
    if (cityId === null || cityId === undefined || isNaN(parseInt(cityId, 10)) || parseInt(cityId, 10) <= 0) {
        console.warn(`[FilterService] Invalid or missing cityId provided: ${cityId}. Returning empty array.`);
        return [];
    }
    const cityIdInt = parseInt(cityId, 10);

    try {
        const response = await apiClient(`/api/filters/neighborhoods?cityId=${cityIdInt}`, `FilterService Neighborhoods city ${cityIdInt}`);
        const data = response?.data || [];
        const validNeighborhoods = Array.isArray(data)
            ? data.filter(item => item && item.id != null && typeof item.name === 'string')
            : [];
        return validNeighborhoods.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } catch (error) {
        console.error(`[FilterService] Error fetching neighborhoods for city ${cityIdInt}:`, error);
        const message = error instanceof Error ? error.message : `Failed to load neighborhoods for city ${cityIdInt}.`;
        throw new Error(message);
    }
};

export const filterService = {
    getCities,
    getCuisines,
    getNeighborhoodsByCity,
};