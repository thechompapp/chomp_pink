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

// Create axios instance with development-optimized timeout
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
  timeout: import.meta.env.DEV ? 30000 : 10000, // 30 seconds in dev, 10 seconds in prod
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
    // Ensure config exists
    if (!config) {
      logError('[HttpClient] Request interceptor: config is undefined');
      return Promise.reject(new Error('Request configuration is undefined'));
    }

    // Don't add token to auth endpoints except logout
    const isAuthEndpoint = config.url?.startsWith('/auth/') && 
                          !config.url?.includes('/auth/logout');
    
    // Check offline mode with proper null checking
    const isOfflineMode = localStorage.getItem('offline_mode') === 'true';
    if (isOfflineMode && !config._allowOffline) {
      throw new Error('Cannot make network requests in offline mode');
    }
    
    // Add authorization header if we have a token and it's not an auth endpoint
    if (!isAuthEndpoint) {
      const token = tokenManager.getAccessToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
        if (config.url?.includes('/admin/')) {
          logDebug(`[HttpClient] Admin request - using token: ${token.substring(0, 20)}...`);
        }
      } else {
        if (config.url?.includes('/admin/')) {
          logWarn(`[HttpClient] Admin request - NO TOKEN AVAILABLE for ${config.url}`);
        }
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
    logDebug(`[HttpClient] Response: ${response.status} from ${response?.config?.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Ensure originalRequest exists before proceeding
    if (!originalRequest) {
      logError('[HttpClient] Response interceptor: originalRequest is undefined');
      return Promise.reject(error);
    }
    
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
      if (originalRequest.url?.includes('/auth/')) {
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
        
        // Special handling for development mode with fake refresh tokens
        if (refreshToken.startsWith('dev-refresh-') && import.meta.env.DEV) {
          logDebug('[HttpClient] Development mode - re-authenticating instead of refreshing');
          
          // Import AdminAuthSetup and re-authenticate
          const { AdminAuthSetup } = await import('@/utils/adminAuthSetup');
          const success = await AdminAuthSetup.setupDevelopmentAuth();
          
          if (!success) {
            throw new Error('Development re-authentication failed');
          }
          
          // Get the new token
          const newToken = tokenManager.getAccessToken();
          if (!newToken) {
            throw new Error('No new token after development re-authentication');
          }
          
          // Ensure headers object exists
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Process queued requests
          processRefreshQueue(newToken);
          
          // Reset refreshing flag
          isRefreshing = false;
          
          // Retry original request
          return httpClient(originalRequest);
        }
        
        // Attempt to refresh the token
        const response = await axios.post('/api/auth/refresh-token', {
          refreshToken
        });
        
        // Store new tokens
        const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data;
        tokenManager.setTokens({
          accessToken,
          refreshToken: newRefreshToken,
          expiresIn
        });
        
        // Ensure headers object exists
        originalRequest.headers = originalRequest.headers || {};
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
