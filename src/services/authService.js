/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls and token management
 */
import apiClient from '@/services/apiClient'; // This apiClient is actually apiUtils from apiClient.js
import { logDebug, logError } from '@/utils/logger';
import { handleApiResponse } from '@/utils/serviceHelpers.js';

const API_ENDPOINT = '/auth';

/**
 * AuthService - Handles all authentication-related operations
 */
const AuthService = {
  /**
   * Logs in a user with email and password
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} User data and tokens or error object
   */
  async login(credentials) {
    logDebug('[AuthService] Attempting login for:', credentials.email);
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/login`, credentials),
      'AuthService.login'
    );

    if (result.success && result.data?.token) {
      localStorage.setItem('token', result.data.token);
      if (result.data.refreshToken) {
        localStorage.setItem('refreshToken', result.data.refreshToken);
      }
      logDebug('[AuthService] Login successful, tokens stored');
    }
    
    return result.success ? result.data : { success: false, error: result.error };
  },

  /**
   * Registers a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user data or error object
   */
  async register(userData) {
    logDebug('[AuthService] Attempting user registration');
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/register`, userData),
      'AuthService.register'
    );
    
    return result.success ? result.data : { success: false, error: result.error };
  },

  /**
   * Gets the current authenticated user's profile
   * @returns {Promise<Object>} User profile data or error object
   */
  async getCurrentUser() {
    logDebug('[AuthService] Fetching current user');
    
    const result = await handleApiResponse(
      () => apiClient.get(`${API_ENDPOINT}/me`),
      'AuthService.getCurrentUser'
    );
    
    return result.success ? result.data : { success: false, error: result.error };
  },

  /**
   * Logs out the current user
   * @returns {Promise<Object>} Success status
   */
  async logout() {
    try {
      logDebug('[AuthService] Logging out user');
      
      // Clear all auth-related data from storage
      const authKeys = [
        'token',
        'refreshToken',
        'user',
        'auth-storage',
        'offline-mode',
        'offline_mode',
        'admin_access_enabled',
        'superuser_override'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Attempt to call the logout endpoint
      try {
        // Assuming apiClient.post returns a promise that handleApiResponse would wrap
        // If logout doesn't need special handling by handleApiResponse, call directly
        await apiClient.post(`${API_ENDPOINT}/logout`);
      } catch (error) {
        logError('[AuthService] Logout API call failed, but continuing with local cleanup', error);
      }
      
      logDebug('[AuthService] User logged out successfully');
      return { success: true };
    } catch (error) {
      logError('[AuthService] Logout failed:', error);
      throw error;
    }
  },

  /**
   * Refreshes the authentication token
   * @returns {Promise<Object>} New token data or error object
   */
  async refreshToken() {
    logDebug('[AuthService] Refreshing token');
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logError('[AuthService] No refresh token available');
      return { success: false, error: 'No refresh token available' };
    }
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/refresh-token`, { refreshToken }),
      'AuthService.refreshToken'
    );
    
    if (result.success && result.data?.token) {
      const { token, refreshToken: newRefreshToken } = result.data;
      
      localStorage.setItem('token', token);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      logDebug('[AuthService] Token refreshed successfully');
      return { success: true, token, refreshToken: newRefreshToken || refreshToken };
    }
    
    logError('[AuthService] Token refresh failed:', result.error || 'Invalid token refresh response');
    AuthService.clearTokens(); // Changed from this.clearTokens()
    return { success: false, error: result.error || 'Invalid token refresh response' };
  },

  /**
   * Clears all authentication tokens
   */
  clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    logDebug('[AuthService] Tokens cleared');
  },

  /**
   * Requests a password reset email
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Success status or error object
   */
  async requestPasswordReset(email) {
    logDebug(`[AuthService] Requesting password reset for: ${email}`);
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/forgot-password`, { email }),
      'AuthService.requestPasswordReset'
    );
    
    return result.success 
      ? { success: true, message: 'Password reset email sent' }
      : { success: false, error: result.error };
  },

  /**
   * Resets the user's password using a reset token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success status
   */
  async resetPassword(token, newPassword) {
    logDebug('[AuthService] Attempting to reset password');
    
    const result = await handleApiResponse(
      () => apiClient.post(`${API_ENDPOINT}/reset-password`, { token, newPassword }),
      'AuthService.resetPassword'
    );

    return result.success 
      ? { success: true, message: 'Password reset successfully' }
      : { success: false, error: result.error };
  },

  /**
   * Verifies an email address using a verification token
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Success status
   */
  async verifyEmail(token) {
    try {
      logDebug('[AuthService] Verifying email');
      
      // This was not using handleApiResponse, let's keep it direct or wrap it if needed
      // Assuming direct call is fine and it handles its own errors or they propagate
      await apiClient.post(`${API_ENDPOINT}/verify-email`, { token });
      
      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      logError('[AuthService] Email verification failed:', error);
      // Re-throw or return a structured error, matching other methods
      return { success: false, error: error.response?.data?.message || error.message || 'Email verification failed' };
    }
  }
};

export const setupAuthInterceptors = (axiosInstance) => {
  // Request interceptor to include auth token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle token refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If the error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true; // Mark that we've tried to refresh for this request
        try {
          logDebug('[AuthService Interceptor] Attempting token refresh due to 401');
          // Use AuthService directly as it's in the same module scope
          const refreshResult = await AuthService.refreshToken(); 
          
          if (refreshResult.success && refreshResult.token) {
            // Update the default Authorization header for subsequent requests on this instance
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${refreshResult.token}`;
            // Update the Authorization header for the original request
            originalRequest.headers['Authorization'] = `Bearer ${refreshResult.token}`;
            // Retry the original request with the new token
            return axiosInstance(originalRequest);
          } else {
            // Refresh token failed or didn't return a new token
            logError('[AuthService Interceptor] Token refresh failed or no new token received.');
            AuthService.clearTokens();
            // Optionally, trigger a global logout event or redirect to login
            // window.dispatchEvent(new Event('forceLogout'));
            return Promise.reject(error); // Reject with the original 401 error
          }
        } catch (refreshError) {
          logError('[AuthService Interceptor] Exception during token refresh:', refreshError);
          AuthService.clearTokens();
          // window.dispatchEvent(new Event('forceLogout'));
          return Promise.reject(refreshError); // Reject with the refresh error
        }
      }
      return Promise.reject(error);
    }
  );
  logDebug('[AuthService] Axios interceptors configured on the provided instance.');
};

export default AuthService;
