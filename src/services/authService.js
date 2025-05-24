/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls and token management
 */
import apiClient from '@/services/apiClient';
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
      () => apiClient({
        url: `${API_ENDPOINT}/login`,
        method: 'post',
        data: credentials
      }),
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
      () => apiClient({
        url: `${API_ENDPOINT}/register`,
        method: 'post',
        data: userData
      }),
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
      () => apiClient({
        url: `${API_ENDPOINT}/me`,
        method: 'get'
      }),
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
        await apiClient({
          url: `${API_ENDPOINT}/logout`,
          method: 'post'
        });
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
      () => apiClient({
        url: `${API_ENDPOINT}/refresh-token`,
        method: 'post',
        data: { refreshToken }
      }),
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
    
    // If we reach here, either the API call failed or the response didn't contain a token
    logError('[AuthService] Token refresh failed:', result.error || 'Invalid token refresh response');
    this.clearTokens();
    return { success: false, error: result.error || 'Invalid token refresh response' };
  },

  /**
   * Clears all authentication tokens
   */
  clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Requests a password reset email
   * @param {string} email - User's email address
   * @returns {Promise<Object>} Success status or error object
   */
  async requestPasswordReset(email) {
    logDebug(`[AuthService] Requesting password reset for: ${email}`);
    
    const result = await handleApiResponse(
      () => apiClient({
        url: `${API_ENDPOINT}/forgot-password`,
        method: 'post',
        data: { email }
      }),
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
    try {
      logDebug('[AuthService] Resetting password');
      
      await apiClient({
        url: `${API_ENDPOINT}/reset-password`,
        method: 'post',
        data: { token, newPassword }
      });
      
      return { success: true, message: 'Password reset successful' };
    } catch (error) {
      logError('[AuthService] Password reset failed:', error);
      throw error;
    }
  },

  /**
   * Verifies an email address using a verification token
   * @param {string} token - Email verification token
   * @returns {Promise<Object>} Success status
   */
  async verifyEmail(token) {
    try {
      logDebug('[AuthService] Verifying email');
      
      await apiClient({
        url: `${API_ENDPOINT}/verify-email`,
        method: 'post',
        data: { token }
      });
      
      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      logError('[AuthService] Email verification failed:', error);
      throw error;
    }
  }
};

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { token } = await AuthService.refreshToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        await AuthService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default AuthService;
