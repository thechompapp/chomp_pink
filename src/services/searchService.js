/* src/services/searchService.js */
/* REMOVED: All TypeScript syntax */
import apiClient from '@/services/apiClient';
// REMOVED: import type { Restaurant, Dish, List } from '@/types';

// REMOVED: interface SearchParams { ... }
// REMOVED: interface SearchApiResponse { ... }
// REMOVED: interface FormattedSearchResults { ... }

const search = async (params) => { // REMOVED: : Promise<FormattedSearchResults>
    const defaultResults/*REMOVED: : FormattedSearchResults*/ = { dishes: [], restaurants: [], lists: [] };

    const query = params?.q?.trim();
    if (!query) {
        return defaultResults;
    }

    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (params.type) queryParams.append('type', params.type);
    if (params.limit != null) queryParams.append('limit', String(params.limit));
    if (params.offset != null) queryParams.append('offset', String(params.offset));
    if (params.cityId != null) queryParams.append('cityId', String(params.cityId));

    const queryString = queryParams.toString();
    const endpoint = `/api/search?${queryString}`;
    const context = `SearchService (${query})`;

    try {
        // Assume apiClient response structure { success: boolean, data: { restaurants: [], dishes: [], lists: [] } }
        const response = await apiClient/*REMOVED: <SearchApiResponse>*/(endpoint, context);
        const responseData = response?.data; // Access the nested data object

        // Helper to format results - Basic JS check
        const formatResults = (items) => { // REMOVED: Generic <T extends { id: number | string }>, type T[]
            if (!Array.isArray(items)) return [];
            // Filter for items with a non-null id
            return items.filter(item => item && item.id != null);
        };

        // Return formatted results, ensuring arrays and converting IDs
        return {
            restaurants: formatResults(responseData?.restaurants).map(r => ({...r, id: Number(r.id)})),
            dishes: formatResults(responseData?.dishes).map(d => ({...d, id: Number(d.id)})),
            lists: formatResults(responseData?.lists).map(l => ({...l, id: Number(l.id)})),
        };
    } catch (error) {
        console.error(`[SearchService] Error searching for "${query}":`, error);
        return defaultResults; // Return empty results on error
    }
};

export const searchService = {
    search,
};