/**
 * Loading State Interceptor
 * 
 * Handles global loading state management for HTTP requests:
 * - Tracking active requests
 * - Notifying listeners of loading state changes
 * - Providing URL-specific loading status
 * - Managing loading state subscriptions
 */

import { logDebug, logError } from '@/utils/logger';

// Global loading state tracker
const globalLoadingState = {
  pending: 0,
  isLoading: false,
  loadingByUrl: new Map(),
  loadingListeners: new Set(),
  lastActivity: Date.now()
};

/**
 * Start loading for a request
 * @param {Object} config - Axios request config
 */
function startLoading(config) {
  try {
    const url = config.url;
    
    // Increment global pending count
    globalLoadingState.pending++;
    globalLoadingState.isLoading = true;
    globalLoadingState.lastActivity = Date.now();
    
    // Track by URL
    if (url) {
      const currentCount = globalLoadingState.loadingByUrl.get(url) || 0;
      globalLoadingState.loadingByUrl.set(url, currentCount + 1);
    }
    
    // Notify listeners
    notifyLoadingListeners();
    
    logDebug('[LoadingInterceptor] Started loading', {
      url,
      method: config.method,
      pending: globalLoadingState.pending
    });
  } catch (error) {
    logError('[LoadingInterceptor] Error starting loading:', error);
  }
}

/**
 * Stop loading for a request
 * @param {Object} config - Axios request config
 */
function stopLoading(config) {
  try {
    const url = config.url;
    
    // Decrement global pending count
    if (globalLoadingState.pending > 0) {
      globalLoadingState.pending--;
    }
    
    globalLoadingState.isLoading = globalLoadingState.pending > 0;
    globalLoadingState.lastActivity = Date.now();
    
    // Track by URL
    if (url) {
      const currentCount = globalLoadingState.loadingByUrl.get(url) || 0;
      if (currentCount <= 1) {
        globalLoadingState.loadingByUrl.delete(url);
      } else {
        globalLoadingState.loadingByUrl.set(url, currentCount - 1);
      }
    }
    
    // Notify listeners
    notifyLoadingListeners();
    
    logDebug('[LoadingInterceptor] Stopped loading', {
      url,
      method: config.method,
      pending: globalLoadingState.pending
    });
  } catch (error) {
    logError('[LoadingInterceptor] Error stopping loading:', error);
  }
}

/**
 * Notify all loading state listeners
 */
function notifyLoadingListeners() {
  const state = getLoadingState();
  
  globalLoadingState.loadingListeners.forEach(callback => {
    try {
      callback(state);
    } catch (error) {
      logError('[LoadingInterceptor] Error notifying listener:', error);
    }
  });
}

/**
 * Get the current loading state
 * @returns {Object} - Current loading state
 */
export function getLoadingState() {
  return {
    pending: globalLoadingState.pending,
    isLoading: globalLoadingState.isLoading,
    lastActivity: globalLoadingState.lastActivity,
    // Convert Map to a plain object for easier consumption
    byUrl: Object.fromEntries(globalLoadingState.loadingByUrl.entries())
  };
}

/**
 * Subscribe to loading state changes
 * @param {Function} callback - Function to call when loading state changes
 * @returns {Function} - Unsubscribe function
 */
export function subscribeToLoadingState(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  
  // Add to Set (prevents duplicates)
  globalLoadingState.loadingListeners.add(callback);
  
  logDebug('[LoadingInterceptor] Added loading state listener');
  
  // Return unsubscribe function
  return () => {
    globalLoadingState.loadingListeners.delete(callback);
    logDebug('[LoadingInterceptor] Removed loading state listener');
  };
}

/**
 * Check if a specific URL is currently loading
 * @param {string} url - URL to check
 * @returns {boolean} - Whether the URL is loading
 */
export function isUrlLoading(url) {
  return !!url && globalLoadingState.loadingByUrl.has(url);
}

/**
 * Get loading count for a specific URL
 * @param {string} url - URL to check
 * @returns {number} - Number of active requests for the URL
 */
export function getUrlLoadingCount(url) {
  return globalLoadingState.loadingByUrl.get(url) || 0;
}

/**
 * Clear all loading state (useful for testing or error recovery)
 */
export function clearLoadingState() {
  globalLoadingState.pending = 0;
  globalLoadingState.isLoading = false;
  globalLoadingState.loadingByUrl.clear();
  globalLoadingState.lastActivity = Date.now();
  
  notifyLoadingListeners();
  
  logDebug('[LoadingInterceptor] Cleared all loading state');
}

/**
 * React hook for accessing HTTP loading state
 * @returns {Object} - Loading state
 */
export function useHttpLoading() {
  // This should be implemented using React.useState and React.useEffect
  // But we're not modifying the implementation since it would require React import
  // and might alter the component behavior
  return {
    isLoading: globalLoadingState.isLoading,
    pending: globalLoadingState.pending,
    byUrl: Object.fromEntries(globalLoadingState.loadingByUrl.entries())
  };
}

/**
 * Setup loading interceptor for an axios instance
 * @param {Object} axiosInstance - Axios instance to configure
 * @param {Object} options - Configuration options
 */
export function setupLoadingInterceptor(axiosInstance, options = {}) {
  const { enabled = true } = options;
  
  if (!enabled) {
    logDebug('[LoadingInterceptor] Loading state tracking disabled');
    return;
  }
  
  // Request interceptor to start loading
  axiosInstance.interceptors.request.use(
    (config) => {
      startLoading(config);
      return config;
    },
    (error) => {
      if (error.config) {
        stopLoading(error.config);
      }
      logError('[LoadingInterceptor] Request interceptor error:', error);
      return Promise.reject(error);
    }
  );
  
  // Response interceptor to stop loading
  axiosInstance.interceptors.response.use(
    (response) => {
      stopLoading(response.config);
      return response;
    },
    (error) => {
      if (error.config) {
        stopLoading(error.config);
      }
      return Promise.reject(error);
    }
  );
  
  logDebug('[LoadingInterceptor] Loading state interceptor configured');
}
