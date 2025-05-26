/**
 * Authentication Service
 * 
 * Provides a clean API for authentication-related operations.
 * Handles token management, refresh logic, and API calls.
 */
import { apiClient } from '@/services/http';
import { handleApiResponse } from '@/services/utils/serviceHelpers';
import { logDebug, logError, logInfo, logWarn } from '@/utils/logger';
import { offlineAuthService } from './offlineAuthService';
import { initTokenRefresher } from './tokenRefresher';

/**
 * Base URL for authentication endpoints
 * @type {string}
 */
const BASE_URL = '/api/auth';

/**
 * Token storage keys
 * @type {Object}
 */
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRY: 'auth_token_expiry',
  USER: 'auth_user'
};

/**
 * Service for authentication operations
 */
class AuthService {
  /**
   * Login with credentials
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object|null>} Auth result or null on error
   */
  async login(credentials) {
    if (!credentials || !credentials.email || !credentials.password) {
      return { success: false, message: 'Email and password are required' };
    }
    
    logDebug('[AuthService] Logging in user');
    
    try {
      const response = await apiClient.post(`${BASE_URL}/login`, credentials);
      
      if (!response || !response.data) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      const { token, user, refreshToken, expiresIn } = response.data;
      
      if (!token || !user) {
        return { success: false, message: 'Invalid authentication data' };
      }
      
      // Calculate token expiry
      const expiryTime = expiresIn 
        ? Date.now() + (expiresIn * 1000) 
        : Date.now() + (24 * 60 * 60 * 1000); // Default to 24 hours
      
      // Store tokens and user data
      this.setTokens(token, refreshToken, expiryTime, user);
      
      // Save data for offline use
      offlineAuthService.saveOfflineData({
        user,
        timestamp: Date.now()
      });
      
      // Process any pending offline actions
      await offlineAuthService.processPendingActions(this);
      
      logInfo('[AuthService] User logged in successfully');
      
      return { 
        success: true, 
        user,
        isAdmin: user.role === 'admin'
      };
    } catch (error) {
      logError('[AuthService] Login error:', error);
      
      // Try offline authentication if server is unavailable
      if (error.message === 'Network Error' || !navigator.onLine) {
        logInfo('[AuthService] Attempting offline authentication');
        return offlineAuthService.verifyOfflineAuth(credentials);
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  }
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Registration result
   */
  async register(userData) {
    if (!userData || !userData.email || !userData.password || !userData.username) {
      return { success: false, message: 'Email, username, and password are required' };
    }
    
    logDebug('[AuthService] Registering new user');
    
    try {
      const response = await apiClient.post(`${BASE_URL}/register`, userData);
      
      if (!response || !response.data) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      logInfo('[AuthService] User registered successfully');
      
      return { 
        success: true, 
        message: 'Registration successful',
        user: response.data.user
      };
    } catch (error) {
      logError('[AuthService] Registration error:', error);
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  }
  
  /**
   * Logout the current user
   * @returns {Promise<Object>} Logout result
   */
  async logout() {
    logDebug('[AuthService] Logging out user');
    
    try {
      // Call logout endpoint if available
      await apiClient.post(`${BASE_URL}/logout`).catch(() => {
        // Ignore errors from logout endpoint
      });
      
      // Clear tokens regardless of API response
      this.clearTokens();
      
      // Clear offline data
      offlineAuthService.clearOfflineData();
      
      logInfo('[AuthService] User logged out successfully');
      
      return { success: true };
    } catch (error) {
      // Still clear tokens even if API call fails
      this.clearTokens();
      
      // If offline, add pending action
      if (error.message === 'Network Error' || !navigator.onLine) {
        offlineAuthService.addPendingAction('logout', {});
      }
      
      // Clear offline data
      offlineAuthService.clearOfflineData();
      
      logError('[AuthService] Logout error:', error);
      
      return { success: true }; // Always return success for logout
    }
  }
  
  /**
   * Get the current authentication status
   * @returns {Promise<Object>} Auth status
   */
  async getAuthStatus() {
    logDebug('[AuthService] Getting auth status');
    
    // Check if we have a valid token
    const token = this.getAccessToken();
    const user = this.getUser();
    
    if (!token || !user) {
      // Check for offline authentication data
      if (offlineAuthService.hasOfflineData()) {
        logInfo('[AuthService] Using offline authentication data');
        return offlineAuthService.getOfflineAuthStatus();
      }
      
      return { 
        isAuthenticated: false,
        user: null,
        isAdmin: false
      };
    }
    
    // Check if token is expired
    if (this.isTokenExpired()) {
      // Try to refresh the token
      const refreshResult = await this.refreshToken();
      
      if (!refreshResult.success) {
        // Check for offline authentication data
        if (offlineAuthService.hasOfflineData()) {
          logInfo('[AuthService] Using offline authentication after failed refresh');
          return offlineAuthService.getOfflineAuthStatus();
        }
        
        return { 
          isAuthenticated: false,
          user: null,
          isAdmin: false
        };
      }
    }
    
    // Verify token with server if needed
    try {
      const response = await apiClient.get(`${BASE_URL}/status`);
      
      if (!response || !response.data || !response.data.isAuthenticated) {
        this.clearTokens();
        
        // Check for offline authentication data
        if (offlineAuthService.hasOfflineData()) {
          logInfo('[AuthService] Using offline authentication after server rejection');
          return offlineAuthService.getOfflineAuthStatus();
        }
        
        return { 
          isAuthenticated: false,
          user: null,
          isAdmin: false
        };
      }
      
      // Update stored user data if provided
      if (response.data.user) {
        this.setUser(response.data.user);
        
        // Also update offline data
        offlineAuthService.saveOfflineData({
          user: response.data.user,
          timestamp: Date.now()
        });
      }
      
      return { 
        isAuthenticated: true,
        user: this.getUser(),
        isAdmin: this.getUser()?.role === 'admin'
      };
    } catch (error) {
      logWarn('[AuthService] Auth status error, using offline validation:', error);
      
      // If server is unavailable, use local token validation
      return { 
        isAuthenticated: true,
        user: this.getUser(),
        isAdmin: this.getUser()?.role === 'admin',
        offlineMode: true
      };
    }
  }
  
  /**
   * Refresh the authentication token
   * @returns {Promise<Object>} Refresh result
   */
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return { success: false, message: 'No refresh token available' };
    }
    
    logDebug('[AuthService] Refreshing auth token');
    
    try {
      const response = await apiClient.post(`${BASE_URL}/refresh`, { refreshToken });
      
      if (!response || !response.data || !response.data.token) {
        this.clearTokens();
        return { success: false, message: 'Invalid refresh response' };
      }
      
      const { token, expiresIn } = response.data;
      
      // Calculate new expiry time
      const expiryTime = expiresIn 
        ? Date.now() + (expiresIn * 1000) 
        : Date.now() + (24 * 60 * 60 * 1000); // Default to 24 hours
      
      // Update tokens
      this.setAccessToken(token, expiryTime);
      
      logInfo('[AuthService] Token refreshed successfully');
      
      return { success: true };
    } catch (error) {
      logError('[AuthService] Token refresh error:', error);
      
      // Clear tokens on refresh failure
      this.clearTokens();
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Token refresh failed' 
      };
    }
  }
  
  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(userData) {
    if (!userData) {
      return { success: false, message: 'No user data provided' };
    }
    
    logDebug('[AuthService] Updating user profile');
    
    try {
      const response = await apiClient.put(`${BASE_URL}/profile`, userData);
      
      if (!response || !response.data) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      // Update stored user data
      this.setUser(response.data.user);
      
      logInfo('[AuthService] User profile updated successfully');
      
      return { 
        success: true, 
        user: response.data.user
      };
    } catch (error) {
      logError('[AuthService] Profile update error:', error);
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profile update failed' 
      };
    }
  }
  
  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.newPassword - New password
   * @returns {Promise<Object>} Password change result
   */
  async changePassword(passwordData) {
    if (!passwordData || !passwordData.currentPassword || !passwordData.newPassword) {
      return { success: false, message: 'Current and new passwords are required' };
    }
    
    logDebug('[AuthService] Changing user password');
    
    try {
      const response = await apiClient.post(`${BASE_URL}/change-password`, passwordData);
      
      if (!response || !response.data) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      logInfo('[AuthService] Password changed successfully');
      
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      logError('[AuthService] Password change error:', error);
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password change failed' 
      };
    }
  }
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} Password reset request result
   */
  async requestPasswordReset(email) {
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    logDebug('[AuthService] Requesting password reset');
    
    try {
      const response = await apiClient.post(`${BASE_URL}/forgot-password`, { email });
      
      if (!response || !response.data) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      logInfo('[AuthService] Password reset requested successfully');
      
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      logError('[AuthService] Password reset request error:', error);
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password reset request failed' 
      };
    }
  }
  
  /**
   * Reset password with token
   * @param {Object} resetData - Password reset data
   * @param {string} resetData.token - Reset token
   * @param {string} resetData.password - New password
   * @returns {Promise<Object>} Password reset result
   */
  async resetPassword(resetData) {
    if (!resetData || !resetData.token || !resetData.password) {
      return { success: false, message: 'Token and new password are required' };
    }
    
    logDebug('[AuthService] Resetting password');
    
    try {
      const response = await apiClient.post(`${BASE_URL}/reset-password`, resetData);
      
      if (!response || !response.data) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      logInfo('[AuthService] Password reset successfully');
      
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      logError('[AuthService] Password reset error:', error);
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password reset failed' 
      };
    }
  }
  
  // Token management methods
  
  /**
   * Set access token and expiry
   * @param {string} token - Access token
   * @param {number} expiryTime - Token expiry timestamp
   */
  setAccessToken(token, expiryTime) {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(TOKEN_KEYS.EXPIRY, expiryTime.toString());
  }
  
  /**
   * Set refresh token
   * @param {string} refreshToken - Refresh token
   */
  setRefreshToken(refreshToken) {
    if (refreshToken) {
      localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    }
  }
  
  /**
   * Set user data
   * @param {Object} user - User data
   */
  setUser(user) {
    if (user) {
      localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
    }
  }
  
  /**
   * Set all tokens and user data
   * @param {string} accessToken - Access token
   * @param {string} refreshToken - Refresh token
   * @param {number} expiryTime - Token expiry timestamp
   * @param {Object} user - User data
   */
  setTokens(accessToken, refreshToken, expiryTime, user) {
    this.setAccessToken(accessToken, expiryTime);
    this.setRefreshToken(refreshToken);
    this.setUser(user);
  }
  
  /**
   * Get access token
   * @returns {string|null} Access token or null if not found
   */
  getAccessToken() {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  }
  
  /**
   * Get refresh token
   * @returns {string|null} Refresh token or null if not found
   */
  getRefreshToken() {
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  }
  
  /**
   * Get token expiry timestamp
   * @returns {number|null} Expiry timestamp or null if not found
   */
  getTokenExpiry() {
    const expiry = localStorage.getItem(TOKEN_KEYS.EXPIRY);
    return expiry ? parseInt(expiry, 10) : null;
  }
  
  /**
   * Get user data
   * @returns {Object|null} User data or null if not found
   */
  getUser() {
    const userData = localStorage.getItem(TOKEN_KEYS.USER);
    return userData ? JSON.parse(userData) : null;
  }
  
  /**
   * Check if token is expired
   * @returns {boolean} True if token is expired or expiry not found
   */
  isTokenExpired() {
    const expiry = this.getTokenExpiry();
    return !expiry || Date.now() > expiry;
  }
  
  /**
   * Clear all tokens and user data
   */
  clearTokens() {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.EXPIRY);
    localStorage.removeItem(TOKEN_KEYS.USER);
  }
}

// Create and export a singleton instance
export const authService = new AuthService();

// Initialize token refresher
initTokenRefresher();

// Export the class for testing or extension
export default AuthService;
