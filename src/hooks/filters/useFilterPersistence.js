/**
 * useFilterPersistence.js - Simplified Filter Persistence
 * 
 * Single Responsibility: Basic filter state persistence
 * - Simple localStorage save/load
 * - No complex history management
 * - No auto-save features
 */

import { useState, useCallback, useEffect } from 'react';
import { logDebug, logError } from '@/utils/logger';

const STORAGE_KEY = 'doof_filters';

/**
 * useFilterPersistence - Simple persistence hook
 */
export function useFilterPersistence(filters = {}, onRestore = null) {
  const [isLoaded, setIsLoaded] = useState(false);

  /**
   * Save filters to localStorage
   */
  const saveToStorage = useCallback(() => {
    try {
      const filterData = {
        filters,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filterData));
      logDebug('[useFilterPersistence] Filters saved to storage');
      return true;
    } catch (error) {
      logError('[useFilterPersistence] Error saving to storage:', error);
      return false;
    }
  }, [filters]);

  /**
   * Load filters from localStorage
   */
  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Basic validation
      if (!data.filters || typeof data.filters !== 'object') {
        return null;
      }

      logDebug('[useFilterPersistence] Filters loaded from storage');
      return data.filters;
    } catch (error) {
      logError('[useFilterPersistence] Error loading from storage:', error);
      return null;
    }
  }, []);

  /**
   * Clear stored filters
   */
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      logDebug('[useFilterPersistence] Storage cleared');
      return true;
    } catch (error) {
      logError('[useFilterPersistence] Error clearing storage:', error);
      return false;
    }
  }, []);

  /**
   * Check if filters exist in storage
   */
  const hasStoredFilters = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return Boolean(stored);
    } catch {
      return false;
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    const storedFilters = loadFromStorage();
    if (storedFilters && onRestore) {
      onRestore(storedFilters);
    }
    setIsLoaded(true);
  }, [loadFromStorage, onRestore]);

  return {
    isLoaded,
    saveToStorage,
    loadFromStorage,
    clearStorage,
    hasStoredFilters
  };
} 