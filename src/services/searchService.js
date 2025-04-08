// src/services/searchService.js
import apiClient from '@/services/apiClient'; // Use alias

const search = async (params) => {
    // Return default structure if query is empty or missing
    if (!params || !params.q || !String(params.q).trim()) {
        return { dishes: [], restaurants: [], lists: [] };
    }
    // Construct query string safely
    const queryString = new URLSearchParams(params).toString();
    try {
        // Expecting { data: { restaurants: [], dishes: [], lists: [] } }
        const response = await apiClient(`/api/search?${queryString}`, `SearchService (${params.q})`);
        const data = response?.data || {};
        // Ensure response structure and array types, filter invalid items
        const formatResults = (items) => Array.isArray(items) ? items.filter(item => item && item.id != null) : [];
        return {
            dishes: formatResults(data.dishes),
            restaurants: formatResults(data.restaurants),
            lists: formatResults(data.lists),
        };
    } catch (error) {
        console.error(`[SearchService] Error searching for "${params.q}":`, error);
        // Return default structure on error
        return { dishes: [], restaurants: [], lists: [] };
    }
};

export const searchService = {
    search,
};