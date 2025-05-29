/**
 * Token Refresher
 * 
 * Handles automatic token refresh for expired tokens.
 * Implements interceptors for axios to handle token refresh.
 */
import { getDefaultApiClient } from '@/services/http';
import { authService } from './authService';
import { logDebug, logError } from '@/utils/logger';

// Track refresh token promise to prevent multiple refresh calls
let refreshTokenPromise = null;

/**
 * Initialize token refresh interceptor
 * Sets up axios interceptors to handle token refresh
 */
export const initTokenRefresher = () => {
  // Response interceptor to handle 401 errors
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Only handle 401 errors that haven't been retried yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        // Mark this request as retried to prevent infinite loops
        originalRequest._retry = true;
        
        // If we don't have a refresh token, we can't refresh
        const refreshToken = authService.getRefreshToken();
        if (!refreshToken) {
          // Force logout on auth failure without refresh token
          await authService.logout();
          return Promise.reject(error);
        }
        
        try {
          // Use existing refresh promise or create a new one
          if (!refreshTokenPromise) {
            logDebug('[tokenRefresher] Token expired, attempting refresh');
            refreshTokenPromise = authService.refreshToken();
          }
          
          // Wait for the refresh to complete
          const result = await refreshTokenPromise;
          
          // Clear the promise for next time
          refreshTokenPromise = null;
          
          // If refresh was successful, retry the original request
          if (result.success) {
            logDebug('[tokenRefresher] Token refresh successful, retrying request');
            
            // Update the authorization header with the new token
            originalRequest.headers.Authorization = `Bearer ${authService.getAccessToken()}`;
            
            // Retry the original request
            return apiClient(originalRequest);
          } else {
            // If refresh failed, force logout
            logDebug('[tokenRefresher] Token refresh failed, logging out');
            await authService.logout();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Clear the promise for next time
          refreshTokenPromise = null;
          
          // Force logout on refresh error
          logError('[tokenRefresher] Error refreshing token:', refreshError);
          await authService.logout();
          return Promise.reject(error);
        }
      }
      
      // For other errors, just reject the promise
      return Promise.reject(error);
    }
  );
  
  logDebug('[tokenRefresher] Token refresh interceptor initialized');
};

export default {
  initTokenRefresher
};
