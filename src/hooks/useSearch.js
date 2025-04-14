/* src/hooks/useSearch.js */
/* REMOVED: All TypeScript syntax */
import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/searchService'; // Use JS service
// REMOVED: import type { Restaurant, Dish, List } from '@/types';

// REMOVED: interface SearchResultsData { ... }
// REMOVED: interface UseSearchOptions { ... }

// Fetcher function using the typed service
const fetchSearchResults = async (
    query, // REMOVED: string
    type = 'all', // REMOVED: UseSearchOptions['type']
    limit = 10, // REMOVED: number
    offset = 0 // REMOVED: number
) => { // REMOVED: Promise<SearchResultsData>
    const defaultResults = { dishes: [], restaurants: [], lists: [] }; // Define default structure
    if (!query || typeof query !== 'string' || query.trim().length === 0) { // Add type check for JS
         return defaultResults;
    }

    try {
        // searchService.search expects an object and returns the structured response
        const response = await searchService.search({ q: query, type, limit, offset });

        // Validate response structure defensively
        if (!response || typeof response !== 'object') {
             console.warn('[useSearch fetcher] Invalid response structure received:', response);
             return defaultResults;
        }

        // Ensure arrays exist, default to empty array if missing or not array
        return {
            restaurants: Array.isArray(response.restaurants) ? response.restaurants : [],
            dishes: Array.isArray(response.dishes) ? response.dishes : [],
            lists: Array.isArray(response.lists) ? response.lists : [],
        };
    } catch (error) {
         console.error('[useSearch fetcher] Error during search:', error);
         // Return default structure on error to prevent crashes downstream
         return defaultResults;
    }
};


// Hook without TS types
const useSearch = (
    query, // REMOVED: string | null | undefined
    options = {} // REMOVED: UseSearchOptions
) => { // REMOVED: UseQueryResult<SearchResultsData, Error>
    const {
        type = 'all',
        limit = 10,
        offset = 0,
        enabled = true, // Default to enabled
        staleTime = 5 * 60 * 1000, // 5 minutes
     } = options;

    // UseQuery without explicit generic types
    return useQuery({ // REMOVED: <SearchResultsData, Error>
        // Ensure query key parts handle null/undefined query
        queryKey: ['searchResults', query ?? '', type, limit, offset],
        // Pass empty string if query is null/undefined to fetcher
        queryFn: () => fetchSearchResults(query || '', type, limit, offset),
        // Enable only if query is a non-empty string
        enabled: enabled && !!query && typeof query === 'string' && query.trim().length > 0,
        // Provide initial empty structure as placeholder
        placeholderData: { dishes: [], restaurants: [], lists: [] },
        staleTime: staleTime,
        keepPreviousData: true, // Keep previous results while new search loads
    });
};

export default useSearch;