import { logDebug } from '../utils/logger';

// Create a reactive state for tracking global loading status
const globalLoadingState = {
  pending: 0,
  isLoading: false,
  loadingByUrl: new Map(),
  loadingListeners: new Set(),
  lastActivity: Date.now()
};

/**
 * Start tracking loading state for a request
 * @param {Object} config - Axios request config
 */
const startLoading = (config) => {
  const { url, method } = config;
  
  // Update global loading state
  globalLoadingState.pending += 1;
  globalLoadingState.isLoading = true;
  
  // Track by URL if provided
  if (url) {
    const key = `${method?.toUpperCase()} ${url}`;
    const count = globalLoadingState.loadingByUrl.get(key) || 0;
    globalLoadingState.loadingByUrl.set(key, count + 1);
  }
  
  // Notify listeners
  notifyLoadingListeners();
  
  logDebug(`[Loading] Request started (${globalLoadingState.pending} pending)`, { url, method });
};

/**
 * Stop tracking loading state for a request
 * @param {Object} config - Axios request config
 */
const stopLoading = (config) => {
  const { url, method } = config || {};
  
  // Update global loading state
  if (globalLoadingState.pending > 0) {
    globalLoadingState.pending -= 1;
    globalLoadingState.isLoading = globalLoadingState.pending > 0;
  }
  
  // Update URL tracking
  if (url) {
    const key = `${method?.toUpperCase()} ${url}`;
    const count = globalLoadingState.loadingByUrl.get(key) || 0;
    
    if (count <= 1) {
      globalLoadingState.loadingByUrl.delete(key);
    } else {
      globalLoadingState.loadingByUrl.set(key, count - 1);
    }
  }
  
  // Update last activity timestamp
  globalLoadingState.lastActivity = Date.now();
  
  // Notify listeners
  notifyLoadingListeners();
  
  logDebug(`[Loading] Request completed (${globalLoadingState.pending} pending)`, { url, method });
};

/**
 * Notify all loading state listeners of changes
 */
const notifyLoadingListeners = () => {
  const state = getLoadingState();
  
  // Create a snapshot of the state to avoid mutation during iteration
  const listeners = Array.from(globalLoadingState.loadingListeners);
  
  // Notify each listener
  for (const listener of listeners) {
    try {
      listener(state);
    } catch (error) {
      console.error('[Loading] Error in loading state listener:', error);
    }
  }
};

/**
 * Get the current loading state
 * @returns {Object} Current loading state
 */
export const getLoadingState = () => ({
  isLoading: globalLoadingState.isLoading,
  pending: globalLoadingState.pending,
  loadingByUrl: new Map(globalLoadingState.loadingByUrl),
  lastActivity: globalLoadingState.lastActivity
});

/**
 * Check if a specific URL is currently loading
 * @param {string} url - URL to check
 * @returns {boolean} Whether the URL is loading
 */
export const isUrlLoading = (url) => {
  if (!url) return false;
  return globalLoadingState.loadingByUrl.has(url);
};

/**
 * Subscribe to loading state changes
 * @param {Function} callback - Function to call when loading state changes
 * @returns {Function} Unsubscribe function
 */
export const subscribeToLoadingState = (callback) => {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  
  globalLoadingState.loadingListeners.add(callback);
  
  // Initial notification
  callback(getLoadingState());
  
  // Return unsubscribe function
  return () => {
    globalLoadingState.loadingListeners.delete(callback);
  };
};

/**
 * Setup loading interceptors
 * @param {Object} axiosInstance - Axios instance
 * @returns {Function} Cleanup function to eject interceptors
 */
export const setupLoadingInterceptors = (axiosInstance) => {
  // Request interceptor to start loading
  const requestInterceptor = axiosInstance.interceptors.request.use(
    (config) => {
      startLoading(config);
      return config;
    },
    (error) => {
      stopLoading(error.config);
      return Promise.reject(error);
    }
  );
  
  // Response interceptor to stop loading
  const responseInterceptor = axiosInstance.interceptors.response.use(
    (response) => {
      stopLoading(response.config);
      return response;
    },
    (error) => {
      if (error.config) {
        stopLoading(error.config);
      } else {
        // If we don't have a config, still update the loading state
        stopLoading();
      }
      return Promise.reject(error);
    }
  );
  
  // Return cleanup function
  return () => {
    axiosInstance.interceptors.request.eject(requestInterceptor);
    axiosInstance.interceptors.response.eject(responseInterceptor);
  };
};
