/* src/hooks/useSearch.ts */
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { searchService } from '@/services/searchService'; // Use typed service
// Assuming types are defined centrally
import type { Restaurant } from '@/types/Restaurant';
import type { Dish } from '@/types/Dish';
import type { List } from '@/types/List';

// Define expected structure of search results data
interface SearchResultsData {
    restaurants: Restaurant[]; // Use appropriate Restaurant type
    dishes: Dish[]; // Use appropriate Dish type
    lists: List[]; // Use appropriate List type
}

// Define options for the hook
interface UseSearchOptions {
    type?: 'all' | 'restaurant' | 'dish' | 'list';
    limit?: number;
    offset?: number;
    enabled?: boolean;
    staleTime?: number;
    // Add other React Query options if needed
}

// Fetcher function using the typed service
const fetchSearchResults = async (
    query: string,
    type: UseSearchOptions['type'] = 'all',
    limit: number = 10,
    offset: number = 0
): Promise<SearchResultsData> => {
    if (!query) return { dishes: [], restaurants: [], lists: [] }; // Return default structure

    // searchService.search expects an object and returns the structured response { restaurants, dishes, lists }
    // We assume the service handles the { data: ... } wrapper from apiClient if needed, or returns the structure directly.
    // Let's assume searchService returns SearchResultsData directly for simplicity here.
    // Adjust based on actual implementation of searchService.
    const response = await searchService.search({ q: query, type, limit, offset });

    // Ensure arrays exist, even if API returns null/undefined
    return {
        restaurants: response?.restaurants || [],
        dishes: response?.dishes || [],
        lists: response?.lists || [],
    };
};

// Typed hook
const useSearch = (
    query: string | null | undefined, // Allow null/undefined query
    options: UseSearchOptions = {}
): UseQueryResult<SearchResultsData, Error> => { // Explicit error type
    const {
        type = 'all',
        limit = 10,
        offset = 0,
        enabled = true,
        staleTime = 5 * 60 * 1000, // Add default staleTime
     } = options;

    // UseQuery with types
    return useQuery<SearchResultsData, Error>({ // Specify Data and Error types
        queryKey: ['searchResults', query, type, limit, offset],
        queryFn: () => fetchSearchResults(query || '', type, limit, offset), // Pass empty string if query is null/undefined
        enabled: enabled && !!query && query.trim().length > 0, // Only enable when query is present and non-empty
        placeholderData: { dishes: [], restaurants: [], lists: [] }, // Provide initial structure
        staleTime: staleTime,
        keepPreviousData: true, // Often useful for search UX
        // Add other React Query options as needed
    });
};

export default useSearch;