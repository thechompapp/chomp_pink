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

// Detect if we're running in browser and check the current port
const isBrowserEnv = typeof window !== 'undefined';
const currentPort = isBrowserEnv ? window.location.port : null;

// In development, if we're not on port 5173, we might need special handling
// This is a workaround for CORS issues when the backend expects connections from port 5173
const useProxy = isBrowserEnv && currentPort && currentPort !== '5173' && config.DEV;

if (useProxy) {
  logInfo(`[API Client] Using proxy configuration due to port mismatch (${currentPort} vs 5173)`);
}

// Create the API client instance with consistent configuration
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true, // Include cookies in cross-site requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Add headers that help with CORS if needed
    ...(useProxy ? { 'X-Forwarded-Host': 'localhost:5173' } : {})
  },
  // Increased timeout for development testing
  timeout: 15000, // 15 seconds
});

// Flag to track network connectivity issues
let hasNetworkIssues = localStorage.getItem('offline_mode') === 'true';
let lastNetworkCheck = 0;
const NETWORK_CHECK_INTERVAL = 10000; // Check network every 10 seconds
const RECHECK_SERVER_INTERVAL = 60000; // Try to reconnect every minute
let lastServerCheck = 0;

// Setup periodic server health check when in offline mode
setInterval(() => {
  const now = Date.now();
  // Only run the check if we're in offline mode and haven't checked recently
  if (hasNetworkIssues && now - lastServerCheck > RECHECK_SERVER_INTERVAL) {
    lastServerCheck = now;
    // Try a health check to see if the server is back
    fetch('/api/health', { method: 'GET', timeout: 2000 })
      .then(response => {
        if (response.ok) {
          logInfo('[API Client] Server appears to be back online');
          // Reset offline mode
          hasNetworkIssues = false;
          localStorage.removeItem('offline_mode');
          // Refresh the page to restart connections
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
        }
      })
      .catch(() => {
        // Server still unavailable, stay in offline mode
        logDebug('[API Client] Server still unavailable in background check');
      });
  }
}, RECHECK_SERVER_INTERVAL / 2);

// Function to check if we're in offline mode
const isInOfflineMode = () => {
  // If force_online is set, always return false (online)
  if (localStorage.getItem('force_online') === 'true') {
    return false;
  }
  
  // Following a list add operation, we want to ensure we're not in offline mode
  // Check if we've recently done a list operation
  const recentListOperation = localStorage.getItem('recent_list_operation');
  if (recentListOperation) {
    const timestamp = parseInt(recentListOperation, 10);
    const now = Date.now();
    // If the operation was within the last 60 seconds, force online mode
    if (now - timestamp < 60000) {
      logDebug('[API Client] Recent list operation detected, forcing online mode');
      return false;
    }
  }
  
  // If we're in development and bypass is enabled, act as if offline
  if (process.env.NODE_ENV === 'development' && 
      localStorage.getItem('bypass_auth_check') === 'true') {
    // IMPORTANT: Don't use bypass for list operations
    if (localStorage.getItem('recent_list_operation')) {
      return false;
    }
    return true;
  }
  
  // Check based on our detected network state
  return hasNetworkIssues;
};

// Ensure we're properly connected but don't disable auth
// This fix ensures we're online but still respect authentication
hasNetworkIssues = false;
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('offline_mode');
  // Don't remove bypass_auth_check as it may be needed for auth persistence
  localStorage.setItem('force_online', 'true');
  
  // Ensure we're using consistent auth token approach
  const authData = localStorage.getItem('auth-storage');
  if (authData) {
    try {
      const parsedData = JSON.parse(authData);
      if (parsedData.state && parsedData.state.isAuthenticated) {
        logInfo('[API Client] Found authenticated session, ensuring token persistence');
      }
    } catch (e) {
      logWarn('[API Client] Could not parse auth storage:', e);
    }
  }
}

// Enhanced request interceptor with proper CORS and authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token to each request
    const authState = window.authStore?.getState?.();
    
    // If user is authenticated, ensure we send the right auth headers
    if (authState?.isAuthenticated) {
      // Add the authentication token to the Authorization header
      config.headers = {
        ...config.headers,
        'X-Auth-Authenticated': 'true',
        'Authorization': `Bearer ${authState.token || localStorage.getItem('auth-token')}`,
      };
      
      // Ensure withCredentials is true to send cookies
      config.withCredentials = true;
      
      // Debug log for authentication detection
      logDebug(`[API Client] Sending authenticated request to ${config.url} with token`);
      
      // For admin endpoints, ensure we have the token
      if (config.url.includes('/admin/')) {
        logDebug(`[API Client] Admin endpoint detected: ${config.url}`);
      }
    }
    
    // Check if we should bypass API requests when in offline mode
    const now = Date.now();
    
    // Only check network status occasionally to avoid excessive checks
    if (now - lastNetworkCheck > NETWORK_CHECK_INTERVAL) {
      hasNetworkIssues = !navigator.onLine;
      lastNetworkCheck = now;
      
      if (hasNetworkIssues) {
        logWarn('[API Client] Network appears to be offline');
      }
    }
    
    // Skip non-critical API calls when in offline mode
    if (isInOfflineMode()) {
      // Only allow certain API paths even in offline mode
      const ALLOWED_OFFLINE_PATHS = [
        '/auth/logout', // Always allow logout
        '/lists/', // Allow list operations
      ];
      
      // Always allow POST requests, especially for list operations
      const isWriteOperation = config.method === 'post' || config.method === 'put' || config.method === 'patch';
      
      const isAllowedPath = ALLOWED_OFFLINE_PATHS.some(path => 
        config.url.includes(path)
      ) || isWriteOperation;
      
      if (!isAllowedPath) {
        // Cancel the request
        const offlineError = new Error('Request cancelled - operating in offline mode');
        offlineError.config = config;
        offlineError.isOfflineError = true;
        
        logWarn(`[API Client] Skipping request to ${config.url} (offline mode)`);
        return Promise.reject(offlineError);
      }
    }
    
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

// Export offline mode functions for other services to use
export const networkUtils = {
  isOffline: isInOfflineMode,
  setOfflineMode: (isOffline) => {
    hasNetworkIssues = isOffline;
    if (isOffline) {
      localStorage.setItem('offline_mode', 'true');
    } else {
      localStorage.removeItem('offline_mode');
    }
  }
};

// Enhanced response interceptor with token refresh and consistent error handling
apiClient.interceptors.response.use(
  (response) => {
    // Network is working, reset network issues flag
    hasNetworkIssues = false;
    
    // Log successful responses
    logApiResponse(response, response.config.url, 'API Client');
    return response;
  },
  async (error) => {
    // Check if this is a network error and update our network status
    if (error.message === 'Network Error' || 
        error.code === 'ECONNABORTED' || 
        error.code === 'ERR_NETWORK') {
      
      hasNetworkIssues = true;
      localStorage.setItem('offline_mode', 'true');
      logWarn('[API Client] Network error detected, enabling offline mode');
      
      // Try to activate auth bypass in development
      if (process.env.NODE_ENV === 'development') {
        localStorage.setItem('bypass_auth_check', 'true');
      }
    }
    
    const originalRequest = error.config;
    
    // Check for 401 Unauthorized error for token refresh
    // Skip refresh if explicitly requested (used during logout)
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest._skipAuthRefresh) {
      originalRequest._retry = true;

      // Improve handling of auth-related paths
      const authPaths = ['/auth/login', '/auth/register', '/auth/refresh-token', '/auth/status', '/auth/logout'];
      const requestPath = originalRequest.url.replace(apiClient.defaults.baseURL, '');
      const authStore = getAuthStore();
      const authState = authStore.getState();
      
      // Don't trigger token refresh on explicit auth endpoints
      if (authPaths.some(path => requestPath.endsWith(path))) {
        // Only log out on auth status check failure when authenticated
        if (requestPath.endsWith('/auth/status') && authState.isAuthenticated) {
          logWarn('[API Client] Auth status returned 401 for an authenticated user');
          
          // Try to restore from localStorage before giving up
          try {
            // Check if we have auth data in localStorage
            const storedAuth = localStorage.getItem('auth-storage');
            
            if (storedAuth) {
              logDebug('[API Client] Found auth data in localStorage, attempting to restore session');
              
              // Will force a check against the server with the data from localStorage
              if (authState.checkAuthStatus) {
                await authState.checkAuthStatus(true);
                // If we're still authenticated after the check, don't log out
                if (authStore.getState().isAuthenticated) {
                  logInfo('[API Client] Successfully restored authentication from storage');
                  // Retry the original request with the restored auth
                  return apiClient(originalRequest);
                }
              }
            }
          } catch (e) {
            logError('[API Client] Error restoring auth from localStorage:', e);
          }
          
          // Only log out if restoration failed
          logWarn('[API Client] Unable to restore session, logging out user');
          authState.logout();
        }
        return Promise.reject(handleApiError(error, 'API Client Auth'));
      }

      // Try to handle auth gracefully, with fallbacks for development and missing tokens
      try {
        logDebug('[API Client] Handling auth for request:', originalRequest.url);
        
        // Development bypass - immediately retry with bypass header
        if (process.env.NODE_ENV === 'development' && 
            localStorage.getItem('bypass_auth_check') === 'true') {
          logInfo('[API Client] Development auth bypass enabled, retrying request');
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers['X-Bypass-Auth'] = 'true';
          return apiClient(originalRequest);
        }
        
        // Import auth service here to avoid circular dependencies
        const { authService } = await import('./authService.js');
        
        try {
          // Attempt standard token refresh
          logDebug('[API Client] Attempting token refresh');
          const refreshResponse = await authService.refreshToken();
          
          if (refreshResponse && refreshResponse.token) {
            logInfo('[API Client] Token refreshed successfully');
            // Retry with new token
            return apiClient(originalRequest);
          }
          
          // If we get here without an error or token, something is wrong
          logWarn('[API Client] Token refresh returned without a token');
        } catch (refreshTokenError) {
          // Special handling for 'token not found' errors
          const isTokenMissing = refreshTokenError.message && 
                              (refreshTokenError.message.includes('not found') ||
                               refreshTokenError.message.includes('missing'));
          
          if (isTokenMissing) {
            logWarn('[API Client] No refresh token available, attempting fallback auth...');
            
            // Try to use temporary auth for this request only
            const authState = getAuthStore().getState();
            if (authState && authState.isAuthenticated && authState.user) {
              logDebug('[API Client] Using fallback auth method for user:', authState.user.id);              
              // Add special headers for this request
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['X-Auth-Authenticated'] = 'true';
              originalRequest.headers['X-Auth-User-Id'] = authState.user.id;
              originalRequest.headers['X-Auth-Bypass-Refresh'] = 'true';
              
              // Enable mock data for this request
              localStorage.setItem('use_mock_data', 'true');
              logInfo('[API Client] Enabled mock data as auth fallback');
              
              // Retry the request with these special headers
              return apiClient(originalRequest);
            }
            
            // If we can't use alternative auth, check if it's a critical path
            const isCriticalAuthPath = originalRequest.url.includes('/profile') || 
                                     originalRequest.url.includes('/admin') ||
                                     originalRequest.url.includes('/settings');
            
            if (!isCriticalAuthPath) {
              // For non-critical paths, use mock data instead of failing
              logWarn('[API Client] Using mock data for non-critical path:', originalRequest.url);
              localStorage.setItem('use_mock_data', 'true');
              return Promise.reject({
                ...handleApiError(refreshTokenError, 'API Client Auth'),
                _useMockData: true
              });
            }
          }
          
          // Re-throw if we can't handle it
          throw refreshTokenError;
        }
        
        // If all token refresh attempts fail, decide whether to log out based on path
        const isCriticalAuthPath = originalRequest.url.includes('/profile') || 
                                 originalRequest.url.includes('/admin') ||
                                 originalRequest.url.includes('/settings');
        
        const authStore = getAuthStore();
        
        if (isCriticalAuthPath) {
          if (authStore && authStore.getState) {
            logWarn('[API Client] Critical auth path failure, logging out');
            authStore.getState().logout();
          }
        } else {
          // For non-critical paths, just use mock data
          logWarn('[API Client] Enabling mock data for continued functionality');
          localStorage.setItem('use_mock_data', 'true');
        }
        
        return Promise.reject(handleApiError(error, 'API Client Token Refresh'));
        
      } catch (refreshError) {
        logError('[API Client] Error during token refresh process:', refreshError);
        
        // Only log out for critical paths
        const isCriticalPath = originalRequest.url.includes('/profile') || 
                              originalRequest.url.includes('/admin') || 
                              originalRequest.url.includes('/settings');
        
        if (isCriticalPath) {
          const authStore = getAuthStore();
          if (authStore && authStore.getState) {
            logError('[API Client] Critical path detected, logging out due to token refresh failure');
            authStore.getState().logout();
          }
        } else {
          // For non-critical paths, enable mock data to maintain functionality
          logWarn('[API Client] Using mock data to maintain functionality');
          localStorage.setItem('use_mock_data', 'true');
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
