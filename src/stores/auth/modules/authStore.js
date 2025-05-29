/**
 * Refactored Authentication Store
 * 
 * Main authentication store that integrates all modular components:
 * - Configuration and state management
 * - Storage operations
 * - Event handling
 * - Core auth operations
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getInitialAuthState, getPersistConfig } from './authConfig';
import { updateStoredToken } from './authStorage';
import { createThrottledSetter } from './authStateUtils';
import { checkAuthStatus, login, logout } from './authOperations';

/**
 * Authentication Store Initializer
 * Creates the store with all authentication functionality
 */
export function createAuthStoreInitializer(set, get) {
  // Create throttled setter to prevent excessive re-renders
  const throttledSet = createThrottledSetter(set);
  
  return {
    // Initial state
    ...getInitialAuthState(),
    
    // Enhanced setter for performance
    set: throttledSet,

    /**
     * Set the authentication token
     * @param {string|null} token - Token to set
     */
    setToken: (token) => {
      set({ token });
      updateStoredToken(token);
    },

    /**
     * Set an error message in state
     * @param {string|null} error - Error message
     */
    setError: (error) => set({ error }),

    /**
     * Clear any error message in state
     */
    clearError: () => set({ error: null }),

    /**
     * Set the current user in state
     * @param {object|null} user - User object
     */
    setUser: (user) => set({ user, isAuthenticated: !!user }),

    /**
     * Check authentication status
     * @param {boolean} forceCheck - Force a fresh check ignoring cache
     * @returns {Promise<boolean>} Whether the user is authenticated
     */
    checkAuthStatus: (forceCheck = false) => checkAuthStatus(set, get, forceCheck),

    /**
     * Login with email and password
     * @param {Object} formData - User credentials {email, password}
     * @returns {Promise<boolean>} Whether login was successful
     */
    login: (formData) => login(set, get, formData),

    /**
     * Logout the current user
     * @returns {Promise<void>}
     */
    logout: () => logout(set, get),

    /**
     * Get the current user
     * @returns {Object|null} Current user or null if not authenticated
     */
    getCurrentUser: () => get().user,

    /**
     * Check if the user is authenticated
     * @returns {boolean} Whether the user is authenticated
     */
    getIsAuthenticated: () => get().isAuthenticated,

    /**
     * Check if authentication is loading
     * @returns {boolean} Whether authentication is loading
     */
    getIsLoading: () => get().isLoading,

    /**
     * Get the authentication token
     * @returns {string|null} Authentication token or null if not authenticated
     */
    getToken: () => get().token,

    /**
     * Get the current error state
     * @returns {string|null} Current error message or null
     */
    getError: () => get().error,

    /**
     * Get the last authentication check timestamp
     * @returns {number|null} Timestamp of last check
     */
    getLastAuthCheck: () => get().lastAuthCheck,
  };
}

/**
 * Create the authentication store with persistence
 */
const useAuthenticationStore = create(
  persist(createAuthStoreInitializer, {
    ...getPersistConfig(),
    storage: createJSONStorage(() => localStorage),
  })
);

export default useAuthenticationStore; 