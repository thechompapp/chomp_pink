/* src/services/searchService.ts */
import apiClient from '@/services/apiClient';
import type { Restaurant, Dish, List } from '@/types'; // Assuming central types

// Define the structure for search parameters
interface SearchParams {
    q: string;
    type?: 'all' | 'restaurant' | 'dish' | 'list';
    limit?: number;
    offset?: number;
    // Add other potential filter params if backend supports them (e.g., cityId)
    cityId?: number | string;
}

// Define the structure for the expected search results from the API
// Assuming apiClient wraps the data in a 'data' property
interface SearchApiResponse {
    data?: {
        restaurants: Restaurant[];
        dishes: Dish[];
        lists: List[];
    };
     // Include error/message fields if your apiClient standard response includes them
    success?: boolean;
    error?: string;
    message?: string;
}

// Define the structure this service function will return
interface FormattedSearchResults {
    restaurants: Restaurant[];
    dishes: Dish[];
    lists: List[];
}

const search = async (params: SearchParams): Promise<FormattedSearchResults> => {
    const defaultResults: FormattedSearchResults = { dishes: [], restaurants: [], lists: [] };

    // Ensure query is present and trimmed
    const query = params?.q?.trim();
    if (!query) {
        return defaultResults;
    }

    // Construct query string from parameters
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    if (params.type) queryParams.append('type', params.type);
    if (params.limit != null) queryParams.append('limit', String(params.limit));
    if (params.offset != null) queryParams.append('offset', String(params.offset));
    if (params.cityId != null) queryParams.append('cityId', String(params.cityId));
    // Add other params as needed

    const queryString = queryParams.toString();
    const endpoint = `/api/search?${queryString}`;
    const context = `SearchService (${query})`;

    try {
        const response = await apiClient<SearchApiResponse>(endpoint, context);
        const data = response?.data; // Access the data property

        // Helper to format and filter results arrays, ensuring valid IDs
        const formatResults = <T extends { id: number | string }>(items: T[] | undefined | null): T[] => {
            if (!Array.isArray(items)) return [];
            return items.filter(item => item && item.id != null);
        };

        // Return formatted results, ensuring arrays exist even if API returns null/undefined
        return {
            // Ensure IDs are numbers if necessary for consistency, or handle in components
            restaurants: formatResults(data?.restaurants).map(r => ({...r, id: Number(r.id)})),
            dishes: formatResults(data?.dishes).map(d => ({...d, id: Number(d.id)})),
            lists: formatResults(data?.lists).map(l => ({...l, id: Number(l.id)})),
        };
    } catch (error) {
        console.error(`[SearchService] Error searching for "${query}":`, error);
        // Return default empty results on error to prevent crashes
        return defaultResults;
    }
};

export const searchService = {
    search,
};