import { useQuery } from '@tanstack/react-query';
import apiClient from '@/utils/apiClient';

const fetchSearchResults = async (query, type = 'all', limit = 10, offset = 0) => {
    if (!query) return { dishes: [], restaurants: [], lists: [] };
    const response = await apiClient(`/api/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}&offset=${offset}`, 'Search');
    return response || { dishes: [], restaurants: [], lists: [] };
};

const useSearch = (query, options = {}) => {
    const { type = 'all', limit = 10, offset = 0, enabled = true } = options;

    return useQuery({
        queryKey: ['searchResults', query, type, limit, offset],
        queryFn: () => fetchSearchResults(query, type, limit, offset),
        enabled: enabled && !!query,
    });
};

export default useSearch;