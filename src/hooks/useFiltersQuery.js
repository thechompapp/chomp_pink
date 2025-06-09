/**
 * useFiltersQuery.js - React Query Integration for Filters
 * 
 * Phase 3: Advanced Optimizations
 * - React Query integration for sophisticated caching
 * - Background updates and synchronization
 * - Optimistic updates for filter changes
 * - Smart prefetching and cache invalidation
 * - Real-time filter suggestions
 * - Progressive loading capabilities
 */

import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { unifiedFilterService } from '@/services/filters';
import { FILTER_TYPES } from '@/stores/useFilterStore';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Query keys for different filter data types
 */
export const FILTER_QUERY_KEYS = {
  cities: 'filter-cities',
  boroughs: 'filter-boroughs',
  neighborhoods: 'filter-neighborhoods',
  cuisines: 'filter-cuisines',
  suggestions: 'filter-suggestions',
  stats: 'filter-stats'
};

/**
 * Default query options for filter data
 */
const DEFAULT_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: (failureCount, error) => {
    if (error?.status >= 400 && error?.status < 500) return false;
    return failureCount < 2;
  }
};

/**
 * Advanced React Query-powered filter hook
 * @param {Object} initialFilters - Initial filter values
 * @param {Object} options - Configuration options
 * @returns {Object} Enhanced filter state and operations
 */
export const useFiltersQuery = (initialFilters = {}, options = {}) => {
  const {
    enableRealTimeSync = true,
    enablePrefetching = true,
    enableOptimisticUpdates = true,
    enableSuggestions = true,
    debounceMs = 300,
    onChange
  } = options;

  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ ...initialFilters });
  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);
  const debounceTimerRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);

  // ================================
  // BASE FILTER DATA QUERIES
  // ================================

  // Cities query with background updates
  const citiesQuery = useQuery({
    queryKey: [FILTER_QUERY_KEYS.cities],
    queryFn: () => unifiedFilterService.getCities(),
    ...DEFAULT_QUERY_OPTIONS,
    onSuccess: (data) => {
      logDebug('[useFiltersQuery] Cities loaded:', data?.length);
      // Prefetch popular boroughs in background
      if (enablePrefetching && data?.length > 0) {
        prefetchPopularBoroughs(data.slice(0, 3));
      }
    }
  });

  // Dynamic borough queries based on selected city
  const boroughsQuery = useQuery({
    queryKey: [FILTER_QUERY_KEYS.boroughs, filters.city],
    queryFn: () => filters.city ? unifiedFilterService.getBoroughs(filters.city) : Promise.resolve([]),
    enabled: !!filters.city,
    ...DEFAULT_QUERY_OPTIONS,
    onSuccess: (data) => {
      logDebug('[useFiltersQuery] Boroughs loaded:', data?.length);
      // Prefetch neighborhoods for first borough
      if (enablePrefetching && data?.length > 0) {
        prefetchNeighborhoods(data[0].id);
      }
    }
  });

  // Dynamic neighborhood queries based on selected borough
  const neighborhoodsQuery = useQuery({
    queryKey: [FILTER_QUERY_KEYS.neighborhoods, filters.borough],
    queryFn: () => filters.borough ? unifiedFilterService.getNeighborhoods(filters.borough) : Promise.resolve([]),
    enabled: !!filters.borough,
    ...DEFAULT_QUERY_OPTIONS
  });

  // Cuisines query with search capability
  const cuisinesQuery = useQuery({
    queryKey: [FILTER_QUERY_KEYS.cuisines],
    queryFn: () => unifiedFilterService.getCuisines('', 100),
    ...DEFAULT_QUERY_OPTIONS,
    select: (data) => data || []
  });

  // Real-time filter suggestions query
  const suggestionsQuery = useQuery({
    queryKey: [FILTER_QUERY_KEYS.suggestions, filters],
    queryFn: () => generateFilterSuggestions(filters),
    enabled: enableSuggestions && Object.keys(filters).some(key => filters[key]),
    staleTime: 30 * 1000, // 30 seconds for suggestions
    ...DEFAULT_QUERY_OPTIONS
  });

  // ================================
  // PARALLEL DATA LOADING
  // ================================

  /**
   * Load all filter data in parallel with intelligent dependency management
   */
  const useParallelFilterData = () => {
    const queries = [
      {
        queryKey: [FILTER_QUERY_KEYS.cities],
        queryFn: () => unifiedFilterService.getCities(),
        ...DEFAULT_QUERY_OPTIONS
      },
      {
        queryKey: [FILTER_QUERY_KEYS.cuisines],
        queryFn: () => unifiedFilterService.getCuisines('', 100),
        ...DEFAULT_QUERY_OPTIONS
      }
    ];

    // Add conditional queries based on current filters
    if (filters.city) {
      queries.push({
        queryKey: [FILTER_QUERY_KEYS.boroughs, filters.city],
        queryFn: () => unifiedFilterService.getBoroughs(filters.city),
        ...DEFAULT_QUERY_OPTIONS
      });
    }

    if (filters.borough) {
      queries.push({
        queryKey: [FILTER_QUERY_KEYS.neighborhoods, filters.borough],
        queryFn: () => unifiedFilterService.getNeighborhoods(filters.borough),
        ...DEFAULT_QUERY_OPTIONS
      });
    }

    return useQueries({ queries });
  };

  const parallelQueries = useParallelFilterData();

  // ================================
  // OPTIMISTIC UPDATES
  // ================================

  /**
   * Mutation for filter changes with optimistic updates
   */
  const filterMutation = useMutation({
    mutationFn: async ({ type, value }) => {
      // Simulate API call for filter change if needed
      return { type, value };
    },
    onMutate: async ({ type, value }) => {
      if (!enableOptimisticUpdates) return;

      setIsOptimisticUpdate(true);
      
      // Cancel any outgoing refetches for related data
      if (type === FILTER_TYPES.CITY) {
        await queryClient.cancelQueries({ queryKey: [FILTER_QUERY_KEYS.boroughs] });
        await queryClient.cancelQueries({ queryKey: [FILTER_QUERY_KEYS.neighborhoods] });
      } else if (type === FILTER_TYPES.BOROUGH) {
        await queryClient.cancelQueries({ queryKey: [FILTER_QUERY_KEYS.neighborhoods] });
      }

      // Optimistically update filter state
      const previousFilters = { ...filters };
      const newFilters = { ...filters, [type]: value };
      
      setFilters(newFilters);
      
      return { previousFilters };
    },
    onSuccess: ({ type, value }) => {
      setIsOptimisticUpdate(false);
      
      // Trigger dependent data fetching
      if (type === FILTER_TYPES.CITY && value) {
        queryClient.prefetchQuery({
          queryKey: [FILTER_QUERY_KEYS.boroughs, value],
          queryFn: () => unifiedFilterService.getBoroughs(value)
        });
      } else if (type === FILTER_TYPES.BOROUGH && value) {
        queryClient.prefetchQuery({
          queryKey: [FILTER_QUERY_KEYS.neighborhoods, value],
          queryFn: () => unifiedFilterService.getNeighborhoods(value)
        });
      }
    },
    onError: (error, { type, value }, context) => {
      setIsOptimisticUpdate(false);
      
      // Rollback on error
      if (context?.previousFilters) {
        setFilters(context.previousFilters);
      }
      
      logError('[useFiltersQuery] Filter update failed:', error);
    }
  });

  // ================================
  // PREFETCHING UTILITIES
  // ================================

  /**
   * Prefetch boroughs for popular cities
   */
  const prefetchPopularBoroughs = useCallback(async (cities) => {
    if (!enablePrefetching) return;
    
    const prefetchPromises = cities.map(city => 
      queryClient.prefetchQuery({
        queryKey: [FILTER_QUERY_KEYS.boroughs, city.id],
        queryFn: () => unifiedFilterService.getBoroughs(city.id),
        staleTime: 10 * 60 * 1000 // 10 minutes
      })
    );
    
    await Promise.allSettled(prefetchPromises);
    logDebug('[useFiltersQuery] Prefetched boroughs for popular cities');
  }, [queryClient, enablePrefetching]);

  /**
   * Prefetch neighborhoods for a borough
   */
  const prefetchNeighborhoods = useCallback(async (boroughId) => {
    if (!enablePrefetching) return;
    
    await queryClient.prefetchQuery({
      queryKey: [FILTER_QUERY_KEYS.neighborhoods, boroughId],
      queryFn: () => unifiedFilterService.getNeighborhoods(boroughId),
      staleTime: 10 * 60 * 1000
    });
    
    logDebug('[useFiltersQuery] Prefetched neighborhoods for borough:', boroughId);
  }, [queryClient, enablePrefetching]);

  // ================================
  // REAL-TIME SUGGESTIONS
  // ================================

  /**
   * Generate intelligent filter suggestions
   */
  const generateFilterSuggestions = useCallback(async (currentFilters) => {
    const suggestions = [];
    
    // Suggest popular combinations based on current selection
    if (currentFilters.city && !currentFilters.cuisine?.length) {
      const cityData = citiesQuery.data?.find(c => c.id === currentFilters.city);
      if (cityData) {
        suggestions.push({
          type: 'cuisine',
          label: `Popular cuisines in ${cityData.name}`,
          items: ['Italian', 'Mexican', 'Japanese'], // Mock data - replace with real suggestions
          priority: 'high'
        });
      }
    }

    if (currentFilters.cuisine?.length && !currentFilters.city) {
      suggestions.push({
        type: 'city',
        label: `Cities with great ${currentFilters.cuisine[0]} food`,
        items: citiesQuery.data?.slice(0, 3) || [],
        priority: 'medium'
      });
    }

    return suggestions;
  }, [citiesQuery.data]);

  // ================================
  // DEBOUNCED CHANGE HANDLER
  // ================================

  /**
   * Debounced change handler for external callbacks
   */
  const handleDebouncedChange = useCallback(() => {
    if (!onChange) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const apiFormat = unifiedFilterService.transformToApi(filters);
      onChange(apiFormat);
    }, debounceMs);
  }, [filters, onChange, debounceMs]);

  // Trigger debounced change when filters change
  useEffect(() => {
    handleDebouncedChange();
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, handleDebouncedChange]);

  // ================================
  // REAL-TIME SYNCHRONIZATION
  // ================================

  /**
   * Background synchronization for real-time updates
   */
  useEffect(() => {
    if (!enableRealTimeSync) return;

    const syncInterval = setInterval(() => {
      // Invalidate and refetch critical data in background
      queryClient.invalidateQueries({ 
        queryKey: [FILTER_QUERY_KEYS.suggestions],
        refetchType: 'none' // Don't refetch immediately
      });
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => clearInterval(syncInterval);
  }, [queryClient, enableRealTimeSync]);

  // ================================
  // PUBLIC API
  // ================================

  /**
   * Enhanced filter setter with optimistic updates
   */
  const setFilter = useCallback((type, value) => {
    if (enableOptimisticUpdates) {
      filterMutation.mutate({ type, value });
    } else {
      setFilters(prev => ({ ...prev, [type]: value }));
    }
  }, [filterMutation, enableOptimisticUpdates]);

  /**
   * Toggle array filter values
   */
  const toggleArrayFilter = useCallback((type, item) => {
    const currentValues = filters[type] || [];
    const newValues = currentValues.includes(item)
      ? currentValues.filter(i => i !== item)
      : [...currentValues, item];
    
    setFilter(type, newValues);
  }, [filters, setFilter]);

  /**
   * Clear filters with cache invalidation
   */
  const clearFilters = useCallback((type) => {
    if (type) {
      setFilter(type, Array.isArray(filters[type]) ? [] : null);
    } else {
      setFilters({});
      // Clear related caches
      queryClient.removeQueries({ queryKey: [FILTER_QUERY_KEYS.suggestions] });
    }
  }, [setFilter, filters, queryClient]);

  /**
   * Force refresh all filter data
   */
  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      predicate: (query) => query.queryKey[0]?.toString().startsWith('filter-')
    });
  }, [queryClient]);

  // ================================
  // COMPUTED VALUES
  // ================================

  const computedValues = useMemo(() => {
    const hasActiveFilters = Object.values(filters).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined && value !== '';
    });

    const isLoading = citiesQuery.isLoading || 
                     boroughsQuery.isLoading || 
                     neighborhoodsQuery.isLoading || 
                     cuisinesQuery.isLoading;

    const hasErrors = citiesQuery.error || 
                     boroughsQuery.error || 
                     neighborhoodsQuery.error || 
                     cuisinesQuery.error;

    const data = {
      cities: citiesQuery.data || [],
      boroughs: boroughsQuery.data || [],
      neighborhoods: neighborhoodsQuery.data || [],
      cuisines: cuisinesQuery.data || []
    };

    return {
      hasActiveFilters,
      isLoading,
      hasErrors,
      data,
      suggestions: suggestionsQuery.data || [],
      isOptimisticUpdate
    };
  }, [
    filters,
    citiesQuery,
    boroughsQuery,
    neighborhoodsQuery,
    cuisinesQuery,
    suggestionsQuery,
    isOptimisticUpdate
  ]);

  return {
    // Filter state
    filters,
    ...computedValues,

    // Actions
    setFilter,
    toggleArrayFilter,
    clearFilters,
    refreshAll,

    // Query objects for advanced usage
    queries: {
      cities: citiesQuery,
      boroughs: boroughsQuery,
      neighborhoods: neighborhoodsQuery,
      cuisines: cuisinesQuery,
      suggestions: suggestionsQuery
    },

    // Utilities
    prefetchBoroughs: prefetchPopularBoroughs,
    prefetchNeighborhoods,
    transformToApi: (filtersToTransform = filters) => 
      unifiedFilterService.transformToApi(filtersToTransform)
  };
};

export default useFiltersQuery; 