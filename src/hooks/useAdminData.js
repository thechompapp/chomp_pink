/**
 * Custom hook for managing admin data across different resources
 */
import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/adminService';
import { logInfo, logError, logDebug } from '@/utils/logger';

export const useAdminData = () => {
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cities
  const fetchCities = useCallback(async () => {
    try {
      logDebug('[useAdminData] Fetching cities');
      const result = await adminService.getAdminCitiesSimple();
      
      if (result.success) {
        setCities(result.data || []);
        logInfo(`[useAdminData] Loaded ${result.data?.length || 0} cities`);
      } else {
        logError('[useAdminData] Failed to fetch cities:', result.error);
        setError('Failed to load cities');
      }
    } catch (error) {
      logError('[useAdminData] Error fetching cities:', error);
      setError('Failed to load cities');
    }
  }, []);

  // Fetch neighborhoods with higher limit to ensure all are loaded
  const fetchNeighborhoods = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        logInfo('[useAdminData] Force refreshing neighborhoods');
      }
      
      logDebug('[useAdminData] Fetching neighborhoods');
      const result = await adminService.getAdminNeighborhoods();
      
      if (result.success) {
        setNeighborhoods(result.data || []);
        logInfo(`[useAdminData] Loaded ${result.data?.length || 0} neighborhoods`);
        
        // Log specific neighborhood IDs for debugging
        const neighborhoodIds = (result.data || []).map(n => ({ id: n.id, name: n.name }));
        logDebug('[useAdminData] Neighborhood IDs loaded:', neighborhoodIds.slice(0, 10));
        
        // Check if neighborhood 88 is loaded
        const neighborhood88 = (result.data || []).find(n => n.id === 88);
        if (neighborhood88) {
          logInfo(`[useAdminData] Found neighborhood ID 88: ${neighborhood88.name}`);
        } else {
          logError('[useAdminData] Neighborhood ID 88 not found in loaded data');
        }
      } else {
        logError('[useAdminData] Failed to fetch neighborhoods:', result.error);
        setError('Failed to load neighborhoods');
      }
    } catch (error) {
      logError('[useAdminData] Error fetching neighborhoods:', error);
      setError('Failed to load neighborhoods');
    }
  }, []);

  // Fetch hashtags
  const fetchHashtags = useCallback(async () => {
    try {
      logDebug('[useAdminData] Fetching hashtags');
      const result = await adminService.getAdminHashtags();
      
      if (result.success) {
        setHashtags(result.data || []);
        logInfo(`[useAdminData] Loaded ${result.data?.length || 0} hashtags`);
      } else {
        logError('[useAdminData] Failed to fetch hashtags:', result.error);
        setError('Failed to load hashtags');
      }
    } catch (error) {
      logError('[useAdminData] Error fetching hashtags:', error);
      setError('Failed to load hashtags');
    }
  }, []);

  // Force refresh all data
  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    await Promise.all([
      fetchCities(),
      fetchNeighborhoods(true), // Force refresh neighborhoods
      fetchHashtags()
    ]);
    
    setIsLoading(false);
  }, [fetchCities, fetchNeighborhoods, fetchHashtags]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      await Promise.all([
        fetchCities(),
        fetchNeighborhoods(),
        fetchHashtags()
      ]);
      
      setIsLoading(false);
    };

    loadData();
  }, [fetchCities, fetchNeighborhoods, fetchHashtags]);

  return {
    cities,
    neighborhoods,
    hashtags,
    isLoading,
    error,
    refreshCities: fetchCities,
    refreshNeighborhoods: () => fetchNeighborhoods(true),
    refreshHashtags: fetchHashtags,
    refreshAllData
  };
}; 