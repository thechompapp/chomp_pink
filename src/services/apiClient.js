// src/services/apiClient.js - Enhanced and standardized API client
import axios from 'axios';
import config from '../config.js';
import { logError, logDebug, logWarn, logInfo } from '../utils/logger.js';
import { handleApiError, getApiBaseUrl, logApiRequest, logApiResponse } from '../utils/apiUtils.js';

// Use a function to get the auth store state to avoid circular dependencies
let getAuthStore = () => {
  return window.authStore || { getState: () => ({ isAuthenticated: false, logout: () => {} }) };
};

// Function to set the auth store reference later (will be called from useAuthStore)
export const setAuthStoreRef = (storeRef) => {
  window.authStore = storeRef;
  getAuthStore = () => window.authStore;
  logDebug('[API Client] Auth store reference set');
};

// Use proxy approach to avoid CORS issues
// With the vite proxy configuration, we can use relative paths that will be automatically proxied

// In development, use the current origin with /api path which will be proxied
// In production, use the configured API base URL
let apiBaseUrl;

if (config.DEV) {
  // For development, use relative /api path which will be proxied by Vite
  // This avoids CORS issues completely as requests will be sent to the same origin
  apiBaseUrl = '/api';
  logInfo(`[API Client] Using API proxy URL: ${apiBaseUrl}`);
} else {
  // For production, use the configured API base URL
  apiBaseUrl = config.VITE_API_BASE_URL;
  logInfo(`[API Client] Using production API URL: ${apiBaseUrl}`);
}

// Create the API client instance with consistent configuration
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // Include cookies in cross-site requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Enhanced request interceptor with detailed logging
apiClient.interceptors.request.use(
  (config) => {
    // Log API requests for debugging
    logApiRequest(
      config.url, 
      config.params || config.data, 
      config.method, 
      'API Client'
    );
    
    // httpOnly cookies are sent automatically by the browser
    return config;
  },
  (error) => {
    logError('[API Client Request Interceptor] Error:', error);
    return Promise.reject(handleApiError(error, 'API Client Request'));
  }
);

// Enhanced response interceptor with token refresh and consistent error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses
    logApiResponse(response, response.config.url, 'API Client');
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check for 401 Unauthorized error for token refresh
    // Skip refresh if explicitly requested (used during logout)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest._skipAuthRefresh) {
      originalRequest._retry = true;

      // List of auth-related paths that should not trigger a token refresh
      const authPaths = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/status'];
      const requestPath = originalRequest.url.replace(apiClient.defaults.baseURL, '');

      // Handle special auth paths differently
      if (authPaths.some(path => requestPath.endsWith(path))) {
        const authStore = getAuthStore();
        if (requestPath.endsWith('/auth/status') && authStore.getState().isAuthenticated) {
          logWarn('[API Client] Auth status returned 401 for an authenticated user. Logging out.');
          authStore.getState().logout();
        }
        return Promise.reject(handleApiError(error, 'API Client Auth'));
      }

      // Try to refresh the token
      try {
        logDebug('[API Client] Attempting token refresh');
        
        // Import auth service here to avoid circular dependencies
        const { authService } = await import('./authService.js');
        const refreshResponse = await authService.refreshToken();

        if (refreshResponse && refreshResponse.token) {
          logInfo('[API Client] Token refreshed successfully');
          // Retry the original request with the new token
          return apiClient(originalRequest);
        } else {
          logWarn('[API Client] Token refresh failed, logging out user');
          const authStore = getAuthStore();
          if (authStore && authStore.getState) {
            authStore.getState().logout();
          }
          return Promise.reject(handleApiError(error, 'API Client Token Refresh'));
        }
      } catch (refreshError) {
        logError('[API Client] Critical error during token refresh, logging out:', refreshError);
        const authStore = getAuthStore();
        if (authStore && authStore.getState) {
          authStore.getState().logout();
        }
        return Promise.reject(handleApiError(refreshError, 'API Client Token Refresh'));
      }
    }
    
    // Handle all other errors consistently
    return Promise.reject(handleApiError(error, 'API Client Response'));
  }
);

// Export the enhanced API client
export default apiClient;
