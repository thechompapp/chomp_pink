/**
 * Loading State Manager
 * 
 * Tracks and notifies about loading states for API requests.
 */
import { logDebug } from '@/utils/logger';

/**
 * Loading State Manager class
 */
class LoadingStateManager {
  constructor() {
    // Map of URLs to loading states
    this.loadingMap = new Map();
    
    // Global loading state
    this.isLoading = false;
    
    // Listeners for loading state changes
    this.listeners = [];
  }
  
  /**
   * Start tracking loading state for a request
   * @param {Object} config - Axios request config
   */
  startLoading(config) {
    if (!config || !config.url) {
      return;
    }
    
    const url = config.url;
    
    // Add to loading map
    this.loadingMap.set(url, true);
    
    // Update global loading state
    this.isLoading = true;
    
    // Notify listeners
    this.notifyLoadingListeners();
    
    logDebug(`[LoadingStateManager] Started loading: ${url}`);
  }
  
  /**
   * Stop tracking loading state for a request
   * @param {Object} config - Axios request config
   */
  stopLoading(config) {
    if (!config || !config.url) {
      return;
    }
    
    const url = config.url;
    
    // Remove from loading map
    this.loadingMap.delete(url);
    
    // Update global loading state
    this.isLoading = this.loadingMap.size > 0;
    
    // Notify listeners
    this.notifyLoadingListeners();
    
    logDebug(`[LoadingStateManager] Stopped loading: ${url}`);
  }
  
  /**
   * Notify all loading state listeners of changes
   */
  notifyLoadingListeners() {
    // Create loading state object
    const loadingState = {
      isLoading: this.isLoading,
      loadingUrls: Array.from(this.loadingMap.keys()),
      loadingCount: this.loadingMap.size
    };
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(loadingState);
      } catch (error) {
        logDebug(`[LoadingStateManager] Error in listener:`, error);
      }
    });
  }
  
  /**
   * Get the current loading state
   * @returns {Object} - Current loading state
   */
  getLoadingState() {
    return {
      isLoading: this.isLoading,
      loadingUrls: Array.from(this.loadingMap.keys()),
      loadingCount: this.loadingMap.size
    };
  }
  
  /**
   * Subscribe to loading state changes
   * @param {Function} callback - Function to call when loading state changes
   * @returns {Function} - Unsubscribe function
   */
  subscribeToLoadingState(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    
    this.listeners.push(callback);
    
    // Immediately call with current state
    callback(this.getLoadingState());
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  /**
   * Check if a specific URL is currently loading
   * @param {string} url - URL to check
   * @returns {boolean} - Whether the URL is loading
   */
  isUrlLoading(url) {
    return this.loadingMap.has(url);
  }
  
  /**
   * Setup loading state request interceptor
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupRequestInterceptor(axiosInstance) {
    return axiosInstance.interceptors.request.use(
      (config) => {
        this.startLoading(config);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Setup loading state response interceptor
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupResponseInterceptor(axiosInstance) {
    return axiosInstance.interceptors.response.use(
      (response) => {
        this.stopLoading(response.config);
        return response;
      },
      (error) => {
        if (error.config) {
          this.stopLoading(error.config);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Reset all loading states
   */
  resetLoadingStates() {
    this.loadingMap.clear();
    this.isLoading = false;
    this.notifyLoadingListeners();
  }
}

// Create and export singleton instance
const loadingStateManager = new LoadingStateManager();

export default loadingStateManager;
