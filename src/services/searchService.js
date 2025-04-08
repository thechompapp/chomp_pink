// src/services/searchService.js
import apiClient from '@/services/apiClient';

const search = async (params) => {
    if (!params || !params.q || !String(params.q).trim()) {
        return { dishes: [], restaurants: [], lists: [] };
    }
    const queryString = new URLSearchParams(params).toString();
    try {
        const response = await apiClient(`/api/search?${queryString}`, `SearchService (${params.q})`);
        const data = response?.data || {};
        const formatResults = (items) => Array.isArray(items) ? items.filter(item => item && item.id != null) : [];
        return {
            dishes: formatResults(data.dishes),
            restaurants: formatResults(data.restaurants),
            lists: formatResults(data.lists),
        };
    } catch (error) {
        console.error(`[SearchService] Error searching for "${params.q}":`, error);
        return { dishes: [], restaurants: [], lists: [] };
    }
};

export const searchService = {
    search,
};