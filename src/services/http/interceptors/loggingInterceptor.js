import { logDebug, logRequest, logResponse } from '../utils/logger';

/**
 * Setup logging interceptors
 * @param {Object} axiosInstance - Axios instance
 * @returns {Function} Cleanup function to eject interceptors
 */
export const setupLoggingInterceptors = (axiosInstance) => {
  // Request interceptor for logging
  const requestInterceptor = axiosInstance.interceptors.request.use(
    (config) => {
      logRequest(config);
      return config;
    },
    (error) => {
      logDebug('Request Error:', {
        url: error.config?.url,
        method: error.config?.method,
        error: error.message
      });
      return Promise.reject(error);
    }
  );
  
  // Response interceptor for logging
  const responseInterceptor = axiosInstance.interceptors.response.use(
    (response) => {
      logResponse(response);
      return response;
    },
    (error) => {
      // Don't log 401 errors as they're handled by the auth interceptor
      if (error.response?.status !== 401) {
        logDebug('Response Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          error: error.message
        });
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
