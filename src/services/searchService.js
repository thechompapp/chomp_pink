// src/services/searchService.js
import apiClient from '@/services/apiClient.js'; // Corrected Path

const search = async (params) => {
    if (!params.q) return { dishes: [], restaurants: [], lists: [] };
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient(`/api/search?${queryString}`, `SearchService (${params.q})`);
    return {
        dishes: Array.isArray(response?.dishes) ? response.dishes : [],
        restaurants: Array.isArray(response?.restaurants) ? response.restaurants : [],
        lists: Array.isArray(response?.lists) ? response.lists : [],
    };
};

export const searchService = {
    search,
};