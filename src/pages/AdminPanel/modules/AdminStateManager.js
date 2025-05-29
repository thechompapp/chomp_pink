/**
 * Admin State Manager
 * 
 * Handles all state management logic for the Admin Panel.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 * 
 * Responsibilities:
 * - State initialization and management
 * - UI state coordination
 * - State validation and normalization
 * - State persistence utilities
 */

import { useState, useCallback } from 'react';
import { logInfo, logDebug } from '@/utils/logger';

/**
 * Initial state configuration for admin panel
 */
export const INITIAL_STATE = {
  activeTab: 'submissions',
  showFilters: false,
  isInitializing: true,
  searchTerm: '',
  isDataCleanup: false,
  isCleanupModalOpen: false,
  cleanupChanges: [],
  isAnalyzing: false,
  displayChanges: {},
  isVerifyingAuth: false,
  isLoadingData: false
};

/**
 * State validation utilities
 */
export const StateValidator = {
  /**
   * Validate tab name
   * @param {string} tabName - Tab name to validate
   * @param {Object} tabConfig - Tab configuration object
   * @returns {boolean} Whether tab name is valid
   */
  isValidTab: (tabName, tabConfig) => {
    return tabName && typeof tabName === 'string' && tabConfig[tabName];
  },

  /**
   * Validate search term
   * @param {string} searchTerm - Search term to validate
   * @returns {boolean} Whether search term is valid
   */
  isValidSearchTerm: (searchTerm) => {
    return typeof searchTerm === 'string' && searchTerm.length <= 100;
  },

  /**
   * Validate cleanup changes array
   * @param {Array} changes - Changes array to validate
   * @returns {boolean} Whether changes array is valid
   */
  isValidChanges: (changes) => {
    return Array.isArray(changes) && changes.every(change => 
      change && typeof change === 'object' && change.id
    );
  }
};

/**
 * State transition utilities
 */
export const StateTransitions = {
  /**
   * Create safe state update function
   * @param {Function} setState - React setState function
   * @returns {Function} Safe state updater
   */
  createSafeUpdater: (setState) => {
    return useCallback((updates) => {
      if (typeof updates === 'function') {
        setState(prevState => {
          const newState = updates(prevState);
          logDebug('[AdminStateManager] State updated:', { 
            from: Object.keys(prevState).length, 
            to: Object.keys(newState).length 
          });
          return newState;
        });
      } else if (typeof updates === 'object' && updates !== null) {
        setState(prevState => {
          const newState = { ...prevState, ...updates };
          logDebug('[AdminStateManager] State merged:', { updates });
          return newState;
        });
      }
    }, [setState]);
  },

  /**
   * Create tab change handler
   * @param {Function} setActiveTab - Tab setter function
   * @param {Function} clearTabState - Clear tab state function
   * @returns {Function} Tab change handler
   */
  createTabChangeHandler: (setActiveTab, clearTabState) => {
    return useCallback((newTab) => {
      logInfo(`[AdminStateManager] Changing tab from current to ${newTab}`);
      
      // Clear any tab-specific state
      if (clearTabState) {
        clearTabState();
      }
      
      setActiveTab(newTab);
    }, [setActiveTab, clearTabState]);
  },

  /**
   * Create cleanup mode toggle handler
   * @param {Object} state - Current state
   * @param {Function} setState - State setter
   * @param {Function} analyzeData - Data analysis function
   * @returns {Function} Cleanup toggle handler
   */
  createCleanupToggleHandler: (state, setState, analyzeData) => {
    return useCallback(async () => {
      logInfo(`[AdminStateManager] Toggling cleanup mode. Current: ${state.isDataCleanup}`);
      
      if (state.isDataCleanup) {
        // Turn off data cleanup mode
        setState({
          isDataCleanup: false,
          displayChanges: {},
          cleanupChanges: []
        });
      } else {
        // Turn on data cleanup mode
        setState({ isAnalyzing: true });
        try {
          await analyzeData();
        } finally {
          setState({ isAnalyzing: false });
        }
      }
    }, [state.isDataCleanup, setState, analyzeData]);
  }
};

/**
 * Custom hook for admin panel state management
 * @param {Object} initialState - Initial state override
 * @returns {Object} State and state management functions
 */
export function useAdminPanelState(initialState = {}) {
  const [state, setState] = useState({ ...INITIAL_STATE, ...initialState });
  
  // Create safe state updater
  const updateState = StateTransitions.createSafeUpdater(setState);
  
  // Individual state setters
  const setActiveTab = useCallback((tab) => {
    if (StateValidator.isValidTab(tab, { [tab]: true })) {
      updateState({ activeTab: tab });
    }
  }, [updateState]);

  const setShowFilters = useCallback((show) => {
    updateState({ showFilters: Boolean(show) });
  }, [updateState]);

  const setSearchTerm = useCallback((term) => {
    if (StateValidator.isValidSearchTerm(term)) {
      updateState({ searchTerm: term });
    }
  }, [updateState]);

  const setIsDataCleanup = useCallback((isCleanup) => {
    updateState({ isDataCleanup: Boolean(isCleanup) });
  }, [updateState]);

  const setIsCleanupModalOpen = useCallback((isOpen) => {
    updateState({ isCleanupModalOpen: Boolean(isOpen) });
  }, [updateState]);

  const setCleanupChanges = useCallback((changes) => {
    if (StateValidator.isValidChanges(changes)) {
      updateState({ cleanupChanges: changes });
    }
  }, [updateState]);

  const setIsAnalyzing = useCallback((isAnalyzing) => {
    updateState({ isAnalyzing: Boolean(isAnalyzing) });
  }, [updateState]);

  const setDisplayChanges = useCallback((changes) => {
    updateState({ displayChanges: changes || {} });
  }, [updateState]);

  const setIsVerifyingAuth = useCallback((isVerifying) => {
    updateState({ isVerifyingAuth: Boolean(isVerifying) });
  }, [updateState]);

  const setIsInitializing = useCallback((isInitializing) => {
    updateState({ isInitializing: Boolean(isInitializing) });
  }, [updateState]);

  // Compound state operations
  const clearTabState = useCallback(() => {
    updateState({
      searchTerm: '',
      isDataCleanup: false,
      displayChanges: {},
      cleanupChanges: []
    });
  }, [updateState]);

  const resetCleanupState = useCallback(() => {
    updateState({
      isDataCleanup: false,
      isCleanupModalOpen: false,
      cleanupChanges: [],
      isAnalyzing: false,
      displayChanges: {}
    });
  }, [updateState]);

  const initializePanel = useCallback(() => {
    updateState({
      isInitializing: false,
      isVerifyingAuth: false
    });
  }, [updateState]);

  // State queries
  const getStateSnapshot = useCallback(() => {
    return { ...state };
  }, [state]);

  const isLoadingState = useCallback(() => {
    return state.isInitializing || state.isVerifyingAuth || state.isAnalyzing;
  }, [state]);

  return {
    // Current state
    state,
    
    // Individual setters
    setActiveTab,
    setShowFilters,
    setSearchTerm,
    setIsDataCleanup,
    setIsCleanupModalOpen,
    setCleanupChanges,
    setIsAnalyzing,
    setDisplayChanges,
    setIsVerifyingAuth,
    setIsInitializing,
    
    // Compound operations
    updateState,
    clearTabState,
    resetCleanupState,
    initializePanel,
    
    // State queries
    getStateSnapshot,
    isLoadingState
  };
}

/**
 * State persistence utilities
 */
export const StatePersistence = {
  /**
   * Save state to session storage
   * @param {Object} state - State to save
   * @param {string} key - Storage key
   */
  saveToSession: (state, key = 'adminPanelState') => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const persistableState = {
          activeTab: state.activeTab,
          showFilters: state.showFilters,
          searchTerm: state.searchTerm
        };
        sessionStorage.setItem(key, JSON.stringify(persistableState));
        logDebug('[AdminStateManager] State saved to session storage');
      }
    } catch (error) {
      logDebug('[AdminStateManager] Failed to save state to session storage:', error);
    }
  },

  /**
   * Load state from session storage
   * @param {string} key - Storage key
   * @returns {Object|null} Loaded state or null
   */
  loadFromSession: (key = 'adminPanelState') => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const state = JSON.parse(stored);
          logDebug('[AdminStateManager] State loaded from session storage');
          return state;
        }
      }
    } catch (error) {
      logDebug('[AdminStateManager] Failed to load state from session storage:', error);
    }
    return null;
  },

  /**
   * Clear persisted state
   * @param {string} key - Storage key
   */
  clearSession: (key = 'adminPanelState') => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(key);
        logDebug('[AdminStateManager] State cleared from session storage');
      }
    } catch (error) {
      logDebug('[AdminStateManager] Failed to clear state from session storage:', error);
    }
  }
};

export default {
  INITIAL_STATE,
  StateValidator,
  StateTransitions,
  useAdminPanelState,
  StatePersistence
}; 