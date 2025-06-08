/**
 * useFilterData.js
 * 
 * Single Responsibility: Filter data fetching & caching coordination
 * - Coordinated data fetching for all filter types
 * - Cache management and optimization
 * - Loading state management
 * - Error handling and retry logic
 * - Data dependency management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { filterDataService, filterCacheService } from '@/services/filters';
import { logDebug, logError, logWarn } from '@/utils/logger';

/**
 * Default options for data fetching
 */
const DEFAULT_OPTIONS = {
  enableCaching: true,
  cacheWarmup: true,
  autoFetch: true,
  retryOnError: true,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * useFilterData - Coordinated filter data fetching hook
 * 
 * @param {Object} filters - Current filter state
 * @param {Object} options - Configuration options
 * @returns {Object} Data state and fetching functions
 */
export function useFilterData(filters = {}, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Data state
  const [data, setData] = useState({
    cities: [],
    boroughs: [],
    neighborhoods: [],
    cuisines: []
  });

  // Loading states
  const [loading, setLoading] = useState({
    cities: false,
    boroughs: false,
    neighborhoods: false,
    cuisines: false
  });

  // Error states
  const [errors, setErrors] = useState({
    cities: null,
    boroughs: null,
    neighborhoods: null,
    cuisines: null
  });

  // Retry counters
  const retryCount = useRef({
    cities: 0,
    boroughs: 0,
    neighborhoods: 0,
    cuisines: 0
  });

  // Track if component is mounted
  const isMounted = useRef(true);

  /**
   * Update loading state for specific data type
   */
  const setLoadingState = useCallback((type, isLoading) => {
    if (!isMounted.current) return;
    
    logDebug(`[useFilterData] Setting loading state for ${type}: ${isLoading}`);
    setLoading(prev => {
      const newState = {
        ...prev,
        [type]: isLoading
      };
      logDebug(`[useFilterData] Loading state updated for ${type}. New state:`, JSON.stringify(newState, null, 2));
      return newState;
    });
  }, []);

  /**
   * Update error state for specific data type
   */
  const setErrorState = useCallback((type, error) => {
    if (!isMounted.current) return;
    
    setErrors(prev => ({
      ...prev,
      [type]: error
    }));
  }, []);

  /**
   * Update data for specific type
   */
  const setDataState = useCallback((type, newData) => {
    if (!isMounted.current) return;
    
    logDebug(`[useFilterData] Setting data for ${type}: ${Array.isArray(newData) ? newData.length + ' items' : 'N/A'}`);
    setData(prev => ({
      ...prev,
      [type]: newData
    }));
  }, []);

  /**
   * Fetch cities data
   */
  const fetchCities = useCallback(async (options = {}) => {
    const cacheKey = 'cities_data';
    
    try {
      setLoadingState('cities', true);
      setErrorState('cities', null);

      // Check cache first if enabled
      if (config.enableCaching) {
        const cached = filterCacheService.get(cacheKey);
        if (cached) {
          setDataState('cities', cached);
          setLoadingState('cities', false);
          logDebug('[useFilterData] Using cached cities data');
          return cached;
        }
      }

      const cities = await filterDataService.getCities(options);
      
      if (config.enableCaching) {
        filterCacheService.set(cacheKey, cities);
      }
      
      setDataState('cities', cities);
      retryCount.current.cities = 0;
      
      logDebug('[useFilterData] Fetched cities:', cities.length);
      return cities;
    } catch (error) {
      logError('[useFilterData] Error fetching cities:', error);
      setErrorState('cities', error.message);
      
      // Retry logic
      if (config.retryOnError && retryCount.current.cities < config.maxRetries) {
        retryCount.current.cities++;
        logWarn(`[useFilterData] Retrying cities fetch (${retryCount.current.cities}/${config.maxRetries})`);
        
        setTimeout(() => {
          if (isMounted.current) {
            fetchCities(options);
          }
        }, config.retryDelay);
      }
      
      return [];
    } finally {
      logDebug('[useFilterData] FINALLY: Setting cities loading to false');
      setLoadingState('cities', false);
    }
  }, [config, setLoadingState, setErrorState, setDataState]);

  /**
   * Fetch boroughs data for a specific city
   */
  const fetchBoroughs = useCallback(async (cityId) => {
    if (!cityId) {
      setDataState('boroughs', []);
      return [];
    }

    const cacheKey = `boroughs_${cityId}`;
    
    try {
      setLoadingState('boroughs', true);
      setErrorState('boroughs', null);

      // Check cache first
      if (config.enableCaching) {
        const cached = filterCacheService.get(cacheKey);
        if (cached) {
          setDataState('boroughs', cached);
          setLoadingState('boroughs', false);
          return cached;
        }
      }

      const boroughs = await filterDataService.getBoroughs(cityId);
      
      if (config.enableCaching) {
        filterCacheService.set(cacheKey, boroughs);
      }
      
      setDataState('boroughs', boroughs);
      retryCount.current.boroughs = 0;
      
      logDebug('[useFilterData] Fetched boroughs for city', cityId, ':', boroughs.length);
      return boroughs;
    } catch (error) {
      logError('[useFilterData] Error fetching boroughs:', error);
      setErrorState('boroughs', error.message);
      
      if (config.retryOnError && retryCount.current.boroughs < config.maxRetries) {
        retryCount.current.boroughs++;
        setTimeout(() => {
          if (isMounted.current) {
            fetchBoroughs(cityId);
          }
        }, config.retryDelay);
      }
      
      return [];
    } finally {
      setLoadingState('boroughs', false);
    }
  }, [config, setLoadingState, setErrorState, setDataState]);

  /**
   * Fetch neighborhoods data for a specific borough
   */
  const fetchNeighborhoods = useCallback(async (boroughId) => {
    if (!boroughId) {
      setDataState('neighborhoods', []);
      return [];
    }

    const cacheKey = `neighborhoods_${boroughId}`;
    
    try {
      setLoadingState('neighborhoods', true);
      setErrorState('neighborhoods', null);

      if (config.enableCaching) {
        const cached = filterCacheService.get(cacheKey);
        if (cached) {
          setDataState('neighborhoods', cached);
          setLoadingState('neighborhoods', false);
          return cached;
        }
      }

      const neighborhoods = await filterDataService.getNeighborhoods(boroughId);
      
      if (config.enableCaching) {
        filterCacheService.set(cacheKey, neighborhoods);
      }
      
      setDataState('neighborhoods', neighborhoods);
      retryCount.current.neighborhoods = 0;
      
      logDebug('[useFilterData] Fetched neighborhoods for borough', boroughId, ':', neighborhoods.length);
      return neighborhoods;
    } catch (error) {
      logError('[useFilterData] Error fetching neighborhoods:', error);
      setErrorState('neighborhoods', error.message);
      
      if (config.retryOnError && retryCount.current.neighborhoods < config.maxRetries) {
        retryCount.current.neighborhoods++;
        setTimeout(() => {
          if (isMounted.current) {
            fetchNeighborhoods(boroughId);
          }
        }, config.retryDelay);
      }
      
      return [];
    } finally {
      setLoadingState('neighborhoods', false);
    }
  }, [config, setLoadingState, setErrorState, setDataState]);

  /**
   * Fetch cuisines data with search
   */
  const fetchCuisines = useCallback(async (searchTerm = '', limit = 15) => {
    const cacheKey = `cuisines_${searchTerm}_${limit}`;
    
    try {
      setLoadingState('cuisines', true);
      setErrorState('cuisines', null);

      if (config.enableCaching) {
        const cached = filterCacheService.get(cacheKey);
        if (cached) {
          setDataState('cuisines', cached);
          setLoadingState('cuisines', false);
          return cached;
        }
      }

      const cuisines = await filterDataService.getCuisines(searchTerm, limit);
      
      if (config.enableCaching) {
        filterCacheService.set(cacheKey, cuisines);
      }
      
      setDataState('cuisines', cuisines);
      retryCount.current.cuisines = 0;
      
      logDebug('[useFilterData] Fetched cuisines:', cuisines.length);
      return cuisines;
    } catch (error) {
      logError('[useFilterData] Error fetching cuisines:', error);
      setErrorState('cuisines', error.message);
      
      if (config.retryOnError && retryCount.current.cuisines < config.maxRetries) {
        retryCount.current.cuisines++;
        setTimeout(() => {
          if (isMounted.current) {
            fetchCuisines(searchTerm, limit);
          }
        }, config.retryDelay);
      }
      
      return [];
    } finally {
      logDebug('[useFilterData] FINALLY: Setting cuisines loading to false');
      setLoadingState('cuisines', false);
    }
  }, [config, setLoadingState, setErrorState, setDataState]);

  /**
   * Refresh all data
   */
  const refreshAll = useCallback(async () => {
    logDebug('[useFilterData] Refreshing all filter data');
    
    const promises = [
      fetchCities(),
      fetchCuisines()
    ];

    if (filters.city) {
      promises.push(fetchBoroughs(filters.city));
    }

    if (filters.borough) {
      promises.push(fetchNeighborhoods(filters.borough));
    }

    await Promise.allSettled(promises);
  }, [fetchCities, fetchBoroughs, fetchNeighborhoods, fetchCuisines, filters]);

  /**
   * Clear all cached data
   */
  const clearCache = useCallback(() => {
    filterCacheService.clear();
    logDebug('[useFilterData] Cache cleared');
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return filterCacheService.getStats();
  }, []);

  /**
   * Warm up cache with important data
   */
  const warmupCache = useCallback(async () => {
    if (!config.cacheWarmup) return;
    
    logDebug('[useFilterData] Warming up cache');
    
    const warmupEntries = [
      {
        key: 'cities_data',
        fetcher: () => filterDataService.getCities(),
        ttl: 10 * 60 * 1000 // 10 minutes
      },
      {
        key: 'cuisines__15',
        fetcher: () => filterDataService.getCuisines('', 15),
        ttl: 5 * 60 * 1000 // 5 minutes
      }
    ];

    await filterCacheService.warm(warmupEntries);
  }, [config.cacheWarmup]);

  // Auto-fetch data based on filter dependencies
  useEffect(() => {
    if (!config.autoFetch) return;

    // Always fetch cities and cuisines
    fetchCities();
    fetchCuisines();
  }, [config.autoFetch, fetchCities, fetchCuisines]);

  // Fetch boroughs when city changes
  useEffect(() => {
    if (!config.autoFetch) return;
    
    if (filters.city) {
      fetchBoroughs(filters.city);
    } else {
      setDataState('boroughs', []);
    }
  }, [filters.city, config.autoFetch, fetchBoroughs, setDataState]);

  // Fetch neighborhoods when borough changes
  useEffect(() => {
    if (!config.autoFetch) return;
    
    if (filters.borough) {
      fetchNeighborhoods(filters.borough);
    } else {
      setDataState('neighborhoods', []);
    }
  }, [filters.borough, config.autoFetch, fetchNeighborhoods, setDataState]);

  // Cache warmup on mount
  useEffect(() => {
    warmupCache();
  }, [warmupCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    // Data
    data,
    
    // Loading states
    loading,
    isLoading: Object.values(loading).some(Boolean),
    
    // Error states
    errors,
    hasErrors: Object.values(errors).some(Boolean),
    
    // Fetch functions
    fetchCities,
    fetchBoroughs,
    fetchNeighborhoods,
    fetchCuisines,
    refreshAll,
    
    // Cache functions
    clearCache,
    getCacheStats,
    warmupCache
  };
} 