/**
 * Development Mode Handler
 * 
 * Manages development mode settings and mock data handling.
 */
import { logDebug, logWarn, logInfo } from '@/utils/logger';
import { createMockResponseFromError } from '@/services/mockApi';

// Constants for configuration
const CONFIG = {
  // Storage keys
  STORAGE_KEYS: {
    DEV_MODE_NO_BACKEND: 'dev-mode-no-backend'
  }
};

/**
 * Development Mode Handler class
 */
class DevelopmentModeHandler {
  constructor() {
    // Development mode state
    this._devModeNoBackend = null;
    
    // Initialize development mode
    this.initialize();
  }
  
  /**
   * Initialize development mode
   */
  initialize() {
    // Check initial development mode state
    this.isDevelopmentModeNoBackend();
    
    logDebug('[DevelopmentModeHandler] Initialized');
  }
  
  /**
   * Check if the app is in development mode with no backend available
   * @returns {boolean} - Whether we're in development mode with no backend
   */
  isDevelopmentModeNoBackend() {
    // Return cached value if available
    if (this._devModeNoBackend !== null) {
      return this._devModeNoBackend;
    }
    
    // Check if development mode is set in localStorage
    try {
      const storedDevMode = localStorage.getItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND);
      
      if (storedDevMode !== null) {
        this._devModeNoBackend = JSON.parse(storedDevMode) === true;
        return this._devModeNoBackend;
      }
    } catch (error) {
      logWarn('[DevelopmentModeHandler] Error reading dev mode from storage:', error);
    }
    
    // Default to false
    this._devModeNoBackend = false;
    return this._devModeNoBackend;
  }
  
  /**
   * Set the development mode no backend flag
   * @param {boolean} value - Whether we're in development mode with no backend
   */
  setDevelopmentModeNoBackend(value) {
    // Update cache
    this._devModeNoBackend = value === true;
    
    // Store in localStorage
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.DEV_MODE_NO_BACKEND, JSON.stringify(this._devModeNoBackend));
      
      logInfo(`[DevelopmentModeHandler] Development mode ${this._devModeNoBackend ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logWarn('[DevelopmentModeHandler] Error storing dev mode in localStorage:', error);
    }
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('app:devModeChange', {
      detail: {
        devMode: this._devModeNoBackend
      }
    }));
  }
  
  /**
   * Create a mock response for a request
   * @param {Object} config - Axios request config
   * @returns {Promise<Object>} - Mock response
   */
  async createMockResponse(config) {
    if (!config) {
      return null;
    }
    
    try {
      // Create a mock error to pass to createMockResponseFromError
      const mockError = {
        config,
        message: 'Development mode - no backend available',
        devMode: true
      };
      
      // Use the mockApi utility to create a mock response
      const mockResponse = await createMockResponseFromError(mockError);
      
      if (mockResponse) {
        logDebug('[DevelopmentModeHandler] Created mock response for:', config.url);
        return mockResponse;
      }
    } catch (error) {
      logWarn('[DevelopmentModeHandler] Error creating mock response:', error);
    }
    
    return null;
  }
  
  /**
   * Setup development mode request interceptor
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupRequestInterceptor(axiosInstance) {
    return axiosInstance.interceptors.request.use(
      async (config) => {
        // Check if we're in development mode with no backend
        if (this.isDevelopmentModeNoBackend()) {
          logDebug('[DevelopmentModeHandler] Intercepting request in dev mode:', config.url);
          
          // Try to create a mock response
          const mockResponse = await this.createMockResponse(config);
          
          if (mockResponse) {
            // Reject the request with a custom object that will be handled by the response interceptor
            return Promise.reject({
              config,
              message: 'Development mode - using mock data',
              devMode: true,
              mockResponse
            });
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Setup development mode response interceptor
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupResponseInterceptor(axiosInstance) {
    return axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Check if this is a development mode error with a mock response
        if (error.devMode && error.mockResponse) {
          logDebug('[DevelopmentModeHandler] Using mock response for:', error.config?.url);
          return Promise.resolve(error.mockResponse);
        }
        
        // If this is a network error and we're not already in dev mode, 
        // it might indicate that the backend is not available
        if (!this.isDevelopmentModeNoBackend() && error.message && 
            (error.message.includes('Network Error') || error.message.includes('ECONNREFUSED'))) {
          
          logWarn('[DevelopmentModeHandler] Network error detected, suggesting dev mode');
          
          // Dispatch event to suggest enabling dev mode
          window.dispatchEvent(new CustomEvent('app:suggestDevMode', {
            detail: {
              error,
              url: error.config?.url
            }
          }));
        }
        
        return Promise.reject(error);
      }
    );
  }
}

// Create and export singleton instance
const developmentModeHandler = new DevelopmentModeHandler();

export default developmentModeHandler;
