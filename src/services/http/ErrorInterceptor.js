/**
 * Error Interceptor
 * 
 * Handles error responses and retry logic for API requests.
 */
import { toast } from 'react-hot-toast';
import { logDebug, logError, logWarn } from '@/utils/logger';
import ErrorHandler from '@/utils/ErrorHandler';
import { createMockResponseFromError } from '@/services/mockApi';
import OfflineModeHandler from './OfflineModeHandler';

// Constants for configuration
const CONFIG = {
  // Error messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    TIMEOUT_ERROR: 'Request timed out. Please try again.',
    OFFLINE_MODE: 'You are currently in offline mode.'
  },
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  RETRY_STATUS_CODES: [408, 429, 500, 502, 503, 504],
};

/**
 * Error Interceptor class
 */
class ErrorInterceptor {
  constructor() {
    this.offlineModeHandler = new OfflineModeHandler();
  }
  
  /**
   * Handle response errors with standardized approach
   * @param {Error} error - Axios error
   * @param {Object} options - Error handling options
   * @returns {Promise} - Rejected promise or mock response
   */
  async handleResponseError(error, options = {}) {
    const {
      showToast = true,
      retryEnabled = true,
      mockEnabled = true,
      offlineHandlingEnabled = true,
      retryCount = 0,
      originalRequest = null
    } = options;
    
    // Extract request from error or use provided originalRequest
    const request = originalRequest || error.config;
    
    // Check if we're in offline mode
    const isOffline = offlineHandlingEnabled && this.offlineModeHandler.checkOfflineMode();
    
    // Handle offline mode
    if (isOffline) {
      logWarn('[ErrorInterceptor] Request failed in offline mode:', request?.url);
      
      if (showToast) {
        toast.error(CONFIG.ERROR_MESSAGES.OFFLINE_MODE);
      }
      
      // If mock responses are enabled, try to create one
      if (mockEnabled) {
        try {
          const mockResponse = await createMockResponseFromError(error);
          if (mockResponse) {
            logDebug('[ErrorInterceptor] Using mock response for offline request');
            return Promise.resolve(mockResponse);
          }
        } catch (mockError) {
          logError('[ErrorInterceptor] Error creating mock response:', mockError);
        }
      }
      
      // Add offline flag to error
      error.offline = true;
      error.message = CONFIG.ERROR_MESSAGES.OFFLINE_MODE;
      
      return Promise.reject(error);
    }
    
    // Handle network errors
    if (!error.response) {
      logError('[ErrorInterceptor] Network error:', error);
      
      if (showToast) {
        toast.error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
      }
      
      return Promise.reject(error);
    }
    
    // Extract status code and response data
    const { status, data } = error.response;
    
    // Handle retry logic for specific status codes
    if (retryEnabled && 
        CONFIG.RETRY_STATUS_CODES.includes(status) && 
        retryCount < CONFIG.MAX_RETRIES && 
        request) {
      
      logWarn(`[ErrorInterceptor] Retrying request (${retryCount + 1}/${CONFIG.MAX_RETRIES}):`, request.url);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * (retryCount + 1)));
      
      // Retry the request with incremented retry count
      try {
        const axios = request.axios || (request.__proto__ && request.__proto__.axios);
        if (axios) {
          return axios(request);
        }
      } catch (retryError) {
        logError('[ErrorInterceptor] Error retrying request:', retryError);
      }
    }
    
    // Handle specific status codes
    switch (status) {
      case 400:
        logWarn('[ErrorInterceptor] Bad request:', data);
        if (showToast) {
          toast.error(data?.message || 'Invalid request. Please check your input.');
        }
        break;
        
      case 401:
      case 403:
        // Auth errors are handled by AuthInterceptor
        break;
        
      case 404:
        logWarn('[ErrorInterceptor] Resource not found:', request?.url);
        if (showToast) {
          toast.error(data?.message || 'Resource not found.');
        }
        break;
        
      case 408:
      case 504:
        logWarn('[ErrorInterceptor] Request timeout:', request?.url);
        if (showToast) {
          toast.error(CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR);
        }
        break;
        
      case 429:
        logWarn('[ErrorInterceptor] Rate limited:', request?.url);
        if (showToast) {
          toast.error(data?.message || 'Too many requests. Please try again later.');
        }
        break;
        
      case 500:
      case 502:
      case 503:
        logError('[ErrorInterceptor] Server error:', { status, data, url: request?.url });
        if (showToast) {
          toast.error(CONFIG.ERROR_MESSAGES.SERVER_ERROR);
        }
        break;
        
      default:
        logError('[ErrorInterceptor] Unhandled error status:', { status, data, url: request?.url });
        if (showToast) {
          toast.error(data?.message || 'An error occurred. Please try again.');
        }
    }
    
    // Use ErrorHandler utility if available
    try {
      ErrorHandler.handleApiError(error);
    } catch (handlerError) {
      logError('[ErrorInterceptor] Error in ErrorHandler:', handlerError);
    }
    
    return Promise.reject(error);
  }
  
  /**
   * Setup error response interceptor
   * @param {Object} axiosInstance - Axios instance
   * @returns {number} - Interceptor ID
   */
  setupResponseInterceptor(axiosInstance) {
    return axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        return this.handleResponseError(error);
      }
    );
  }
}

// Create and export singleton instance
const errorInterceptor = new ErrorInterceptor();

export default errorInterceptor;
