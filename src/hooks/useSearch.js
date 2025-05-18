/* src/hooks/useSearch.js */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { searchService } from '@/services/searchService';
import { useCallback, useMemo } from 'react';
import { logDebug, logError, logWarn } from '@/utils/logger';

/**
 * Default empty search results structure
 */
const DEFAULT_RESULTS = Object.freeze({
  dishes: [],
  restaurants: [],
  lists: []
});

/**
 * Validate and normalize search query
 * 
 * @param {string|null|undefined} query - Search query to validate
 * @returns {string|null} - Normalized query or null if invalid
 */
const normalizeQuery = (query) => {
  if (!query || typeof query !== 'string') return null;
  
  const trimmed = query.trim();
  return trimmed.length > 0 ? trimmed : null;
};

/**
 * Fetch search results from the API
 * 
 * @param {string} query - Search query
 * @param {string} [type='all'] - Search type (all, restaurants, dishes, lists)
 * @param {number} [limit=10] - Maximum number of results per category
 * @param {number} [offset=0] - Pagination offset
 * @returns {Promise<Object>} - Search results object
 */
const fetchSearchResults = async (query, type = 'all', limit = 10, offset = 0) => {
  // Validate and normalize query
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    logDebug('[useSearch] Empty or invalid query, returning default results');
    return DEFAULT_RESULTS;
  }

  try {
    logDebug(`[useSearch] Fetching results for query: "${normalizedQuery}", type: ${type}, limit: ${limit}, offset: ${offset}`);
    
    // Call search service with parameters
    const response = await searchService.search({
      q: normalizedQuery,
      type,
      limit,
      offset
    });

    // Validate response structure defensively
    if (!response || typeof response !== 'object') {
      logWarn('[useSearch] Invalid response structure received:', response);
      return DEFAULT_RESULTS;
    }

    // Normalize response data
    const result = {
      restaurants: Array.isArray(response.restaurants) ? response.restaurants : [],
      dishes: Array.isArray(response.dishes) ? response.dishes : [],
      lists: Array.isArray(response.lists) ? response.lists : []
    };
    
    // Log result counts for debugging
    logDebug(`[useSearch] Results for "${normalizedQuery}": ${result.restaurants.length} restaurants, ${result.dishes.length} dishes, ${result.lists.length} lists`);
    
    return result;
  } catch (error) {
    logError('[useSearch] Error during search:', error);
    return DEFAULT_RESULTS;
  }
};

/**
 * Custom hook for searching restaurants, dishes, and lists
 * 
 * @param {string|null|undefined} query - Search query
 * @param {Object} [options] - Search options
 * @param {string} [options.type='all'] - Search type (all, restaurants, dishes, lists)
 * @param {number} [options.limit=10] - Maximum number of results per category
 * @param {number} [options.offset=0] - Pagination offset
 * @param {boolean} [options.enabled=true] - Whether the query is enabled
 * @param {number} [options.staleTime=300000] - Stale time in milliseconds (5 minutes default)
 * @param {number} [options.cacheTime=600000] - Cache time in milliseconds (10 minutes default)
 * @param {boolean} [options.refetchOnWindowFocus=false] - Whether to refetch on window focus
 * @returns {Object} - React Query result object with search results
 */
const useSearch = (query, options = {}) => {
  const {
    type = 'all',
    limit = 10,
    offset = 0,
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = false
  } = options;
  
  // Get query client for prefetching
  const queryClient = useQueryClient();
  
  // Normalize query for consistent caching
  const normalizedQuery = useMemo(() => normalizeQuery(query), [query]);
  
  // Create a stable query key
  const queryKey = useMemo(() => [
    'searchResults',
    normalizedQuery || '',
    type,
    limit,
    offset
  ], [normalizedQuery, type, limit, offset]);
  
  // Determine if the query should be enabled
  const isQueryEnabled = enabled && !!normalizedQuery;
  
  /**
   * Prefetch search results for a given query
   * 
   * @param {string} prefetchQuery - Query to prefetch
   * @returns {Promise<void>}
   */
  const prefetch = useCallback(async (prefetchQuery) => {
    const normalizedPrefetchQuery = normalizeQuery(prefetchQuery);
    if (!normalizedPrefetchQuery) return;
    
    const prefetchQueryKey = [
      'searchResults',
      normalizedPrefetchQuery,
      type,
      limit,
      offset
    ];
    
    // Check if already in cache
    const existing = queryClient.getQueryData(prefetchQueryKey);
    if (existing) return;
    
    logDebug(`[useSearch] Prefetching results for query: "${normalizedPrefetchQuery}"`);
    
    // Prefetch and store in cache
    await queryClient.prefetchQuery({
      queryKey: prefetchQueryKey,
      queryFn: () => fetchSearchResults(normalizedPrefetchQuery, type, limit, offset),
      staleTime
    });
  }, [queryClient, type, limit, offset, staleTime]);
  
  // Execute the query
  const result = useQuery({
    queryKey,
    queryFn: () => fetchSearchResults(normalizedQuery, type, limit, offset),
    enabled: isQueryEnabled,
    placeholderData: DEFAULT_RESULTS,
    staleTime,
    cacheTime,
    keepPreviousData: true,
    refetchOnWindowFocus
  });
  
  // Return enhanced result with prefetch function
  return {
    ...result,
    prefetch,
    // Add convenience properties
    restaurants: result.data?.restaurants || [],
    dishes: result.data?.dishes || [],
    lists: result.data?.lists || [],
    isEmpty: !result.data?.restaurants?.length && 
             !result.data?.dishes?.length && 
             !result.data?.lists?.length
  };
};

export default useSearch;