// src/hooks/useSearch.js
import { useQuery } from '@tanstack/react-query';
// import apiClient from '@/utils/apiClient'; // No longer needed here
import { searchService } from '@/services/searchService'; // <<< IMPORT SERVICE

// Fetcher function now uses the service
const fetchSearchResults = async (query, type = 'all', limit = 10, offset = 0) => {
    if (!query) return { dishes: [], restaurants: [], lists: [] };
    // <<< USE SERVICE >>>
    // Pass parameters as an object
    const response = await searchService.search({ q: query, type, limit, offset });
    // Service already ensures default structure { dishes: [], restaurants: [], lists: [] }
    return response;
};

const useSearch = (query, options = {}) => {
    const { type = 'all', limit = 10, offset = 0, enabled = true } = options;

    // useQuery setup remains the same, but queryFn uses the new fetcher
    return useQuery({
        queryKey: ['searchResults', query, type, limit, offset],
        queryFn: () => fetchSearchResults(query, type, limit, offset),
        enabled: enabled && !!query, // Only enable when query is present
        placeholderData: { dishes: [], restaurants: [], lists: [] }, // Provide initial structure
        // Add other React Query options as needed (staleTime, etc.)
    });
};

export default useSearch;