/**
 * useFilterPersistence.js
 * 
 * Single Responsibility: Filter persistence handling
 * - Local/session storage management
 * - URL state synchronization  
 * - Filter history tracking
 * - State restoration
 * - Cross-tab synchronization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { filterTransformService } from '@/services/filters';
import { logDebug, logWarn, logError } from '@/utils/logger';

/**
 * Storage types
 */
const STORAGE_TYPES = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
  URL: 'url',
  MEMORY: 'memory'
};

/**
 * Default persistence options
 */
const DEFAULT_OPTIONS = {
  storageType: STORAGE_TYPES.LOCAL,
  storageKey: 'filterState',
  enableUrlSync: true,
  enableHistory: true,
  maxHistorySize: 10,
  debounceMs: 500,
  enableCrossTab: true,
  autoRestore: true
};

/**
 * useFilterPersistence - Filter persistence management hook
 * 
 * @param {Object} filters - Current filter state
 * @param {Function} onFiltersRestore - Callback when filters are restored
 * @param {Object} options - Persistence configuration
 * @returns {Object} Persistence functions and state
 */
export function useFilterPersistence(filters = {}, onFiltersRestore = null, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Persistence state
  const [persistenceState, setPersistenceState] = useState({
    isLoaded: false,
    isRestoring: false,
    lastSaved: null,
    saveCount: 0
  });

  // History tracking
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Internal state
  const debounceTimer = useRef(null);
  const lastSavedFilters = useRef(null);
  const storageEventListener = useRef(null);

  /**
   * Get storage interface based on type
   */
  const getStorage = useCallback(() => {
    switch (config.storageType) {
      case STORAGE_TYPES.LOCAL:
        return typeof window !== 'undefined' ? window.localStorage : null;
      case STORAGE_TYPES.SESSION:
        return typeof window !== 'undefined' ? window.sessionStorage : null;
      case STORAGE_TYPES.MEMORY:
        return {
          data: {},
          getItem: function(key) { return this.data[key] || null; },
          setItem: function(key, value) { this.data[key] = value; },
          removeItem: function(key) { delete this.data[key]; },
          clear: function() { this.data = {}; }
        };
      default:
        return null;
    }
  }, [config.storageType]);

  /**
   * Save filters to storage
   */
  const saveToStorage = useCallback(async (filtersToSave = filters) => {
    try {
      const storage = getStorage();
      if (!storage) {
        logWarn('[useFilterPersistence] Storage not available');
        return false;
      }

      const serialized = filterTransformService.serialize(filtersToSave);
      const storageData = {
        filters: serialized,
        timestamp: Date.now(),
        version: '1.0'
      };

      storage.setItem(config.storageKey, JSON.stringify(storageData));
      
      lastSavedFilters.current = filtersToSave;
      setPersistenceState(prev => ({
        ...prev,
        lastSaved: new Date(),
        saveCount: prev.saveCount + 1
      }));

      logDebug('[useFilterPersistence] Filters saved to storage');
      return true;
    } catch (error) {
      logError('[useFilterPersistence] Error saving to storage:', error);
      return false;
    }
  }, [filters, getStorage, config.storageKey]);

  /**
   * Load filters from storage
   */
  const loadFromStorage = useCallback(async () => {
    try {
      const storage = getStorage();
      if (!storage) {
        logWarn('[useFilterPersistence] Storage not available');
        return null;
      }

      const stored = storage.getItem(config.storageKey);
      if (!stored) {
        logDebug('[useFilterPersistence] No stored filters found');
        return null;
      }

      const storageData = JSON.parse(stored);
      const filters = filterTransformService.deserialize(storageData.filters);
      
      logDebug('[useFilterPersistence] Filters loaded from storage:', filters);
      return {
        filters,
        timestamp: storageData.timestamp,
        version: storageData.version
      };
    } catch (error) {
      logError('[useFilterPersistence] Error loading from storage:', error);
      return null;
    }
  }, [getStorage, config.storageKey]);

  /**
   * Save filters to URL
   */
  const saveToUrl = useCallback((filtersToSave = filters) => {
    if (!config.enableUrlSync || typeof window === 'undefined') return;

    try {
      const urlParams = filterTransformService.toUrlParams(filtersToSave);
      const url = new URL(window.location);
      
      // Clear existing filter parameters
      for (const key of url.searchParams.keys()) {
        if (key.startsWith('filter_') || ['city', 'borough', 'neighborhood', 'cuisine'].includes(key)) {
          url.searchParams.delete(key);
        }
      }
      
      // Add new filter parameters
      for (const [key, value] of urlParams.entries()) {
        url.searchParams.set(key, value);
      }

      // Update URL without triggering page reload
      window.history.replaceState({}, '', url.toString());
      
      logDebug('[useFilterPersistence] Filters saved to URL');
    } catch (error) {
      logError('[useFilterPersistence] Error saving to URL:', error);
    }
  }, [filters, config.enableUrlSync]);

  /**
   * Load filters from URL
   */
  const loadFromUrl = useCallback(() => {
    if (!config.enableUrlSync || typeof window === 'undefined') return null;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.toString() === '') return null;

      const filters = filterTransformService.fromUrlParams(urlParams);
      
      logDebug('[useFilterPersistence] Filters loaded from URL:', filters);
      return filters;
    } catch (error) {
      logError('[useFilterPersistence] Error loading from URL:', error);
      return null;
    }
  }, [config.enableUrlSync]);

  /**
   * Add to history
   */
  const addToHistory = useCallback((filtersToAdd = filters) => {
    if (!config.enableHistory) return;

    setHistory(prev => {
      // Don't add if same as last entry
      if (prev.length > 0) {
        const lastEntry = prev[prev.length - 1];
        const lastSerialized = filterTransformService.serialize(lastEntry.filters);
        const currentSerialized = filterTransformService.serialize(filtersToAdd);
        if (lastSerialized === currentSerialized) return prev;
      }

      const newEntry = {
        filters: filtersToAdd,
        timestamp: Date.now(),
        id: Date.now() + Math.random()
      };

      const newHistory = [...prev, newEntry];
      
      // Limit history size
      if (newHistory.length > config.maxHistorySize) {
        newHistory.splice(0, newHistory.length - config.maxHistorySize);
      }

      logDebug('[useFilterPersistence] Added to history, total entries:', newHistory.length);
      return newHistory;
    });

    setHistoryIndex(history.length); // Point to the new entry
  }, [filters, config.enableHistory, config.maxHistorySize, history.length]);

  /**
   * Navigate history
   */
  const navigateHistory = useCallback((direction) => {
    if (!config.enableHistory || history.length === 0) return null;

    let newIndex;
    if (direction === 'back') {
      newIndex = Math.max(0, historyIndex - 1);
    } else if (direction === 'forward') {
      newIndex = Math.min(history.length - 1, historyIndex + 1);
    } else {
      return null;
    }

    if (newIndex !== historyIndex && history[newIndex]) {
      setHistoryIndex(newIndex);
      const historicFilters = history[newIndex].filters;
      
      logDebug('[useFilterPersistence] Navigated to history index:', newIndex);
      return historicFilters;
    }

    return null;
  }, [config.enableHistory, history, historyIndex]);

  /**
   * Clear persistence data
   */
  const clearPersistence = useCallback(async () => {
    try {
      const storage = getStorage();
      if (storage) {
        storage.removeItem(config.storageKey);
      }

      if (config.enableUrlSync && typeof window !== 'undefined') {
        const url = new URL(window.location);
        const keysToRemove = [];
        
        for (const key of url.searchParams.keys()) {
          if (key.startsWith('filter_') || ['city', 'borough', 'neighborhood', 'cuisine'].includes(key)) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => url.searchParams.delete(key));
        window.history.replaceState({}, '', url.toString());
      }

      setHistory([]);
      setHistoryIndex(-1);
      setPersistenceState({
        isLoaded: true,
        isRestoring: false,
        lastSaved: null,
        saveCount: 0
      });

      logDebug('[useFilterPersistence] Persistence data cleared');
    } catch (error) {
      logError('[useFilterPersistence] Error clearing persistence:', error);
    }
  }, [getStorage, config.storageKey, config.enableUrlSync]);

  /**
   * Restore filters from available sources
   */
  const restoreFilters = useCallback(async () => {
    if (!config.autoRestore) return null;

    setPersistenceState(prev => ({ ...prev, isRestoring: true }));

    try {
      // Try URL first (highest priority)
      let restoredFilters = loadFromUrl();
      let source = 'url';

      // Fallback to storage
      if (!restoredFilters) {
        const storageData = await loadFromStorage();
        if (storageData) {
          restoredFilters = storageData.filters;
          source = 'storage';
        }
      }

      if (restoredFilters) {
        logDebug(`[useFilterPersistence] Filters restored from ${source}:`, restoredFilters);
        
        if (onFiltersRestore) {
          onFiltersRestore(restoredFilters);
        }

        return { filters: restoredFilters, source };
      }

      return null;
    } finally {
      setPersistenceState(prev => ({ 
        ...prev, 
        isRestoring: false,
        isLoaded: true 
      }));
    }
  }, [config.autoRestore, loadFromUrl, loadFromStorage, onFiltersRestore]);

  /**
   * Get persistence statistics
   */
  const getPersistenceStats = useCallback(() => {
    return {
      ...persistenceState,
      historySize: history.length,
      historyIndex,
      canGoBack: historyIndex > 0,
      canGoForward: historyIndex < history.length - 1,
      storageType: config.storageType,
      enabledFeatures: {
        urlSync: config.enableUrlSync,
        history: config.enableHistory,
        crossTab: config.enableCrossTab,
        autoRestore: config.autoRestore
      }
    };
  }, [persistenceState, history.length, historyIndex, config]);

  // Debounced save effect
  useEffect(() => {
    if (!filters || Object.keys(filters).length === 0) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce saves
    debounceTimer.current = setTimeout(() => {
      saveToStorage(filters);
      saveToUrl(filters);
      addToHistory(filters);
    }, config.debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filters, config.debounceMs, saveToStorage, saveToUrl, addToHistory]);

  // Cross-tab synchronization
  useEffect(() => {
    if (!config.enableCrossTab || typeof window === 'undefined') return;

    const handleStorageChange = (event) => {
      if (event.key === config.storageKey && event.newValue) {
        try {
          const storageData = JSON.parse(event.newValue);
          const syncedFilters = filterTransformService.deserialize(storageData.filters);
          
          logDebug('[useFilterPersistence] Cross-tab sync received:', syncedFilters);
          
          if (onFiltersRestore) {
            onFiltersRestore(syncedFilters);
          }
        } catch (error) {
          logError('[useFilterPersistence] Cross-tab sync error:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    storageEventListener.current = handleStorageChange;

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      storageEventListener.current = null;
    };
  }, [config.enableCrossTab, config.storageKey, onFiltersRestore]);

  // Auto-restore on mount
  useEffect(() => {
    restoreFilters();
  }, []); // Only run once on mount

  return {
    // State
    persistenceState,
    history,
    historyIndex,
    
    // Save/Load functions
    saveToStorage,
    loadFromStorage,
    saveToUrl,
    loadFromUrl,
    restoreFilters,
    clearPersistence,
    
    // History functions
    addToHistory,
    navigateHistory,
    goBack: () => navigateHistory('back'),
    goForward: () => navigateHistory('forward'),
    
    // Utilities
    getPersistenceStats,
    
    // Convenience properties
    isLoaded: persistenceState.isLoaded,
    isRestoring: persistenceState.isRestoring,
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < history.length - 1
  };
} 