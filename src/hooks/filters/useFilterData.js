/**
 * useFilterData.js - Simplified Data Fetching
 * 
 * Single Responsibility: Coordinate filter data fetching
 * - Simple data fetching
 * - Basic loading states
 * - Clean error handling
 * - No complex caching logic
 */

import { useState, useEffect, useCallback } from 'react';
import { filterDataService } from '@/services/filters';
import { logDebug, logError } from '@/utils/logger';

/**
 * useFilterData - Simplified filter data fetching hook
 */
export function useFilterData(filters = {}) {
  const [data, setData] = useState({
    cities: [],
    boroughs: [],
    neighborhoods: [],
    cuisines: []
  });

  const [loading, setLoading] = useState({
    cities: false,
    boroughs: false,
    neighborhoods: false,
    cuisines: false
  });

  const [errors, setErrors] = useState({
    cities: null,
    boroughs: null,
    neighborhoods: null,
    cuisines: null
  });

  /**
   * Fetch cities data
   */
  const fetchCities = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, cities: true }));
      setErrors(prev => ({ ...prev, cities: null }));
      
      const cities = await filterDataService.getCities();
      setData(prev => ({ ...prev, cities }));
      
      logDebug('[useFilterData] Fetched cities:', cities.length);
      return cities;
    } catch (error) {
      logError('[useFilterData] Error fetching cities:', error);
      setErrors(prev => ({ ...prev, cities: error.message }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  }, []);

  /**
   * Fetch boroughs for a city
   */
  const fetchBoroughs = useCallback(async (cityId) => {
    if (!cityId) {
      setData(prev => ({ ...prev, boroughs: [] }));
      return [];
    }

    try {
      setLoading(prev => ({ ...prev, boroughs: true }));
      setErrors(prev => ({ ...prev, boroughs: null }));
      
      const boroughs = await filterDataService.getBoroughs(cityId);
      setData(prev => ({ ...prev, boroughs }));
      
      logDebug('[useFilterData] Fetched boroughs:', boroughs.length);
      return boroughs;
    } catch (error) {
      logError('[useFilterData] Error fetching boroughs:', error);
      setErrors(prev => ({ ...prev, boroughs: error.message }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, boroughs: false }));
    }
  }, []);

  /**
   * Fetch neighborhoods for a borough
   */
  const fetchNeighborhoods = useCallback(async (boroughId) => {
    if (!boroughId) {
      setData(prev => ({ ...prev, neighborhoods: [] }));
      return [];
    }

    try {
      setLoading(prev => ({ ...prev, neighborhoods: true }));
      setErrors(prev => ({ ...prev, neighborhoods: null }));
      
      const neighborhoods = await filterDataService.getNeighborhoods(boroughId);
      setData(prev => ({ ...prev, neighborhoods }));
      
      logDebug('[useFilterData] Fetched neighborhoods:', neighborhoods.length);
      return neighborhoods;
    } catch (error) {
      logError('[useFilterData] Error fetching neighborhoods:', error);
      setErrors(prev => ({ ...prev, neighborhoods: error.message }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, neighborhoods: false }));
    }
  }, []);

  /**
   * Fetch cuisines data
   */
  const fetchCuisines = useCallback(async (searchTerm = '', limit = 15) => {
    try {
      setLoading(prev => ({ ...prev, cuisines: true }));
      setErrors(prev => ({ ...prev, cuisines: null }));
      
      const cuisines = await filterDataService.getCuisines(searchTerm, limit);
      setData(prev => ({ ...prev, cuisines }));
      
      logDebug('[useFilterData] Fetched cuisines:', cuisines.length);
      return cuisines;
    } catch (error) {
      logError('[useFilterData] Error fetching cuisines:', error);
      setErrors(prev => ({ ...prev, cuisines: error.message }));
      return [];
    } finally {
      setLoading(prev => ({ ...prev, cuisines: false }));
    }
  }, []);

  // Auto-fetch base data
  useEffect(() => {
    fetchCities();
    fetchCuisines();
  }, [fetchCities, fetchCuisines]);

  // Auto-fetch dependent data
  useEffect(() => {
    if (filters.city) {
      fetchBoroughs(filters.city);
    } else {
      setData(prev => ({ ...prev, boroughs: [], neighborhoods: [] }));
    }
  }, [filters.city, fetchBoroughs]);

  useEffect(() => {
    if (filters.borough) {
      fetchNeighborhoods(filters.borough);
    } else {
      setData(prev => ({ ...prev, neighborhoods: [] }));
    }
  }, [filters.borough, fetchNeighborhoods]);

  return {
    data,
    loading,
    errors,
    isLoading: Object.values(loading).some(Boolean),
    hasErrors: Object.values(errors).some(Boolean),
    fetchCities,
    fetchBoroughs,
    fetchNeighborhoods,
    fetchCuisines
  };
} 