/**
 * Global Loading State Manager
 * 
 * Manages global loading state for HTTP requests including:
 * - Request tracking by URL
 * - Loading listeners/subscribers
 * - Loading state queries
 */

import { logDebug } from '@/utils/logger';

// Create a reactive state for tracking global loading status
// Using a Map for byUrl lookups is more efficient
const globalLoadingState = {
  pending: 0,
  isLoading: false,
  loadingByUrl: new Map(),
  loadingListeners: new Set(), // Using Set prevents duplicate listeners
  lastActivity: Date.now()
};

/**
 * Start loading for a specific request
 * @param {Object} config - Axios request config
 */
export function startLoading(config) {
  const url = config.url || 'unknown';
  
  globalLoadingState.pending++;
  globalLoadingState.isLoading = true;
  globalLoadingState.lastActivity = Date.now();
  
  // Track loading by URL
  const currentCount = globalLoadingState.loadingByUrl.get(url) || 0;
  globalLoadingState.loadingByUrl.set(url, currentCount + 1);
  
  logDebug(`[LoadingState] Started loading for ${url}. Total pending: ${globalLoadingState.pending}`);
  
  // Notify listeners
  notifyLoadingListeners();
}

/**
 * Stop loading for a specific request
 * @param {Object} config - Axios request config
 */
export function stopLoading(config) {
  const url = config?.url || 'unknown';
  
  if (globalLoadingState.pending > 0) {
    globalLoadingState.pending--;
  }
  
  globalLoadingState.isLoading = globalLoadingState.pending > 0;
  globalLoadingState.lastActivity = Date.now();
  
  // Update URL-specific loading count
  const currentCount = globalLoadingState.loadingByUrl.get(url) || 0;
  if (currentCount > 1) {
    globalLoadingState.loadingByUrl.set(url, currentCount - 1);
  } else {
    globalLoadingState.loadingByUrl.delete(url);
  }
  
  logDebug(`[LoadingState] Stopped loading for ${url}. Total pending: ${globalLoadingState.pending}`);
  
  // Notify listeners
  notifyLoadingListeners();
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
      console.error('[LoadingState] Error in loading listener:', error);
    }
  });
}

/**
 * Get current loading state
 * @returns {Object} Current loading state
 */
export function getLoadingState() {
  return {
    isLoading: globalLoadingState.isLoading,
    pending: globalLoadingState.pending,
    loadingUrls: Array.from(globalLoadingState.loadingByUrl.keys()),
    lastActivity: globalLoadingState.lastActivity
  };
}

/**
 * Subscribe to loading state changes
 * @param {Function} callback - Callback function to be called on state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeToLoadingState(callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback must be a function');
  }
  
  globalLoadingState.loadingListeners.add(callback);
  
  // Call immediately with current state
  try {
    callback(getLoadingState());
  } catch (error) {
    console.error('[LoadingState] Error in initial callback:', error);
  }
  
  // Return unsubscribe function
  return () => {
    globalLoadingState.loadingListeners.delete(callback);
  };
}

/**
 * Check if a specific URL is currently loading
 * @param {string} url - URL to check
 * @returns {boolean} Whether the URL is loading
 */
export function isUrlLoading(url) {
  return globalLoadingState.loadingByUrl.has(url);
}

/**
 * React hook for loading state (to be used in React components)
 * @returns {Object} Loading state and utilities
 */
export function useHttpLoading() {
  // This will be implemented when we have React hooks available
  // For now, return the basic state
  return {
    ...getLoadingState(),
    subscribe: subscribeToLoadingState,
    isUrlLoading
  };
}

/**
 * Clear all loading state (useful for testing or reset scenarios)
 */
export function clearLoadingState() {
  globalLoadingState.pending = 0;
  globalLoadingState.isLoading = false;
  globalLoadingState.loadingByUrl.clear();
  globalLoadingState.lastActivity = Date.now();
  
  // Notify listeners of the reset
  notifyLoadingListeners();
}

/**
 * Get loading statistics
 * @returns {Object} Loading statistics
 */
export function getLoadingStats() {
  return {
    totalPending: globalLoadingState.pending,
    uniqueUrls: globalLoadingState.loadingByUrl.size,
    listeners: globalLoadingState.loadingListeners.size,
    lastActivity: globalLoadingState.lastActivity,
    urlBreakdown: Object.fromEntries(globalLoadingState.loadingByUrl)
  };
} 