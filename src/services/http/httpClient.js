/* src/services/http/httpClient.js */
/**
 * Enhanced HTTP Client
 * 
 * A wrapper around axios with:
 * - Authentication token handling
 * - Automatic token refresh
 * - Consistent error handling
 * - Offline mode support
 * - Request/response interceptors
 */
import axios from 'axios';
import tokenManager from '@/services/auth/tokenManager';
import { logDebug, logError, logWarn } from '@/utils/logger';

// Create axios instance with default config
const httpClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
// Queue of requests to retry after token refresh
let refreshQueue = [];

/**
 * Execute queued requests after successful token refresh
 * @param {string} newToken - The new access token
 */
const processRefreshQueue = (newToken) => {
  refreshQueue.forEach(({ resolve, reject, config }) => {
    // Update the authorization header with new token
    config.headers.Authorization = `Bearer ${newToken}`;
    
    // Retry the original request
    axios(config)
      .then(response => resolve(response))
      .catch(error => reject(error));
  });
  
  // Clear the queue
  refreshQueue = [];
};

/**
 * Reject all queued requests
 * @param {Error} error - The error that caused the refresh to fail
 */
const rejectRefreshQueue = (error) => {
  refreshQueue.forEach(({ reject }) => {
    reject(error);
  });
  
  // Clear the queue
  refreshQueue = [];
};

// Request interceptor
httpClient.interceptors.request.use(
  async (config) => {
    // Don't add token to auth endpoints except logout
    const isAuthEndpoint = config.url.startsWith('/auth/') && 
                          !config.url.includes('/auth/logout');
    
    // Check offline mode
    const isOfflineMode = localStorage.getItem('offline_mode') === 'true';
    if (isOfflineMode && !config._allowOffline) {
      throw new Error('Cannot make network requests in offline mode');
    }
    
    // Add authorization header if we have a token and it's not an auth endpoint
    if (!isAuthEndpoint) {
      const token = tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    logDebug(`[HttpClient] Request: ${config.method ? config.method.toUpperCase() : 'GET'} ${config.url}`);
    return config;
  },
  (error) => {
    logError('[HttpClient] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
httpClient.interceptors.response.use(
  (response) => {
    logDebug(`[HttpClient] Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle network errors (offline)
    if (!error.response) {
      // Mark as offline if network error occurs
      localStorage.setItem('offline_mode', 'true');
      logWarn('[HttpClient] Network error - switching to offline mode');
      
      // Special handling for requests that support offline mode
      if (originalRequest._allowOffline && originalRequest._offlineHandler) {
        return originalRequest._offlineHandler(originalRequest);
      }
      
      return Promise.reject({
        ...error,
        isOffline: true,
        message: 'Network error - app is now in offline mode'
      });
    }
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response.status === 401 && !originalRequest._retry) {
      // Don't attempt to refresh if this is an auth endpoint
      if (originalRequest.url.includes('/auth/')) {
        return Promise.reject(error);
      }
      
      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true;
      
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject, config: originalRequest });
        });
      }
      
      // Start refreshing process
      isRefreshing = true;
      
      try {
        // Get refresh token
        const refreshToken = tokenManager.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        // Attempt to refresh the token
        const response = await axios.post('/api/auth/refresh', {
          refreshToken
        });
        
        // Store new tokens
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
        tokenManager.setTokens({
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn
        });
        
        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Process queued requests
        processRefreshQueue(accessToken);
        
        // Reset refreshing flag
        isRefreshing = false;
        
        // Retry original request
        return httpClient(originalRequest);
      } catch (refreshError) {
        // Reset refreshing flag
        isRefreshing = false;
        
        // Clear tokens as they are no longer valid
        tokenManager.clearTokens();
        
        // Reject all queued requests
        rejectRefreshQueue(refreshError);
        
        // Trigger logout event
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'token_refresh_failed' }
        }));
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

export default httpClient;
