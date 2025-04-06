// src/services/filterService.js
import apiClient from '@/services/apiClient.js'; // Corrected Path

const getCities = async () => {
    const data = await apiClient('/api/filters/cities', 'FilterService Cities') || [];
    const sorted = Array.isArray(data) ? data.sort((a, b) => (a.name || "").localeCompare(b.name || "")) : [];
    return sorted;
};

const getCuisines = async () => {
    const data = await apiClient('/api/filters/cuisines', 'FilterService Cuisines') || [];
     const validCuisines = Array.isArray(data)
              ? data.filter(item => item && typeof item.id !== 'undefined' && typeof item.name !== 'undefined')
              : [];
    const sorted = validCuisines.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return sorted;
};

const getNeighborhoodsByCity = async (cityId) => {
    if (!cityId) return [];
    const data = await apiClient(`/api/filters/neighborhoods?cityId=${cityId}`, `FilterService Neighborhoods city ${cityId}`) || [];
    if (!Array.isArray(data)) throw new Error("Invalid data format for neighborhoods.");
    const sorted = data.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return sorted;
};

export const filterService = {
    getCities,
    getCuisines,
    getNeighborhoodsByCity,
};