/**
 * Auth Interceptor Service
 * 
 * Handles authentication interceptors for API requests
 */
import { logDebug, logError } from '@/utils/logger';
import TokenService from './TokenService';

/**
 * AuthInterceptorService - Handles authentication interceptors for API requests
 */
const AuthInterceptorService = {
  /**
   * Sets up authentication interceptors for an Axios instance
   * @param {Object} axiosInstance - Axios instance to configure
   * @returns {Object} The configured Axios instance
   */
  setupAuthInterceptors(axiosInstance) {
    if (!axiosInstance || !axiosInstance.interceptors) {
      logError('[AuthInterceptorService] Invalid Axios instance provided');
      return axiosInstance;
    }
    
    logDebug('[AuthInterceptorService] Setting up auth interceptors');
    
    // Request interceptor to add auth token
    axiosInstance.interceptors.request.use(
      async (config) => {
        // Skip auth header for auth endpoints that don't require it
        const skipAuthPaths = [
          '/auth/login',
          '/auth/register',
          '/auth/request-password-reset',
          '/auth/reset-password'
        ];
        
        const isAuthEndpoint = config.url && config.url.startsWith('/auth/');
        const shouldSkipAuth = skipAuthPaths.some(path => config.url && config.url.includes(path));
        
        if (isAuthEndpoint && shouldSkipAuth) {
          return config;
        }
        
        // Ensure we have a valid token
        const hasValidToken = await TokenService.ensureValidToken();
        
        if (hasValidToken) {
          const token = TokenService.getAccessToken();
          
          if (token) {
            // Clone the headers to avoid modifying the original object
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${token}`
            };
            
            logDebug('[AuthInterceptorService] Added auth token to request');
          }
        } else {
          logDebug('[AuthInterceptorService] No valid token available for request');
        }
        
        return config;
      },
      (error) => {
        logError('[AuthInterceptorService] Request interceptor error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor to handle auth errors
    axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        // Check if error is due to an expired token
        const isAuthError = error.response && error.response.status === 401;
        
        if (isAuthError) {
          logDebug('[AuthInterceptorService] Auth error detected, attempting token refresh');
          
          try {
            // Try to refresh the token
            const refreshResult = await TokenService.refreshToken();
            
            if (refreshResult.success) {
              logDebug('[AuthInterceptorService] Token refreshed, retrying request');
              
              // Retry the original request with the new token
              const token = TokenService.getAccessToken();
              
              if (token && error.config) {
                // Update the Authorization header with the new token
                error.config.headers.Authorization = `Bearer ${token}`;
                
                // Retry the request
                return axiosInstance(error.config);
              }
            } else {
              logDebug('[AuthInterceptorService] Token refresh failed, clearing tokens');
              
              // Clear tokens on refresh failure
              TokenService.clearTokens();
              
              // Dispatch auth error event
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('auth:error', {
                  detail: { type: 'token_expired', message: 'Authentication expired' }
                }));
              }
            }
          } catch (refreshError) {
            logError('[AuthInterceptorService] Error during token refresh:', refreshError);
            
            // Clear tokens on refresh error
            TokenService.clearTokens();
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    logDebug('[AuthInterceptorService] Auth interceptors setup complete');
    return axiosInstance;
  }
};

export default AuthInterceptorService;
