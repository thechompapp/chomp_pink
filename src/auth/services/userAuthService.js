/**
 * User Authentication Service
 * 
 * Handles user-specific authentication operations including login, registration,
 * and profile management.
 */
import { apiClient } from '@/services/http';
import { tokenService } from './tokenService';
import { offlineAuthService } from './offlineAuthService';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Base URL for authentication endpoints
 * @type {string}
 */
const BASE_URL = '/api/auth';

/**
 * Storage keys
 * @type {Object}
 */
const STORAGE_KEYS = {
  USER: 'auth_user'
};

/**
 * User Authentication Service
 */
class UserAuthService {
  /**
   * Login with credentials
   * @param {Object} credentials - User credentials
   * @param {string} credentials.email - User email
   * @param {string} credentials.password - User password
   * @returns {Promise<Object>} Auth result
   */
  async login(credentials) {
    if (!credentials || !credentials.email || !credentials.password) {
      return { success: false, message: 'Email and password are required' };
    }
    
    logDebug('[UserAuthService] Logging in user');
    
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
      
      // Store tokens
      tokenService.setTokens(token, refreshToken, expiryTime);
      
      // Store user data
      this.setUser(user);
      
      // Save data for offline use
      offlineAuthService.saveOfflineData({
        user,
        timestamp: Date.now()
      });
      
      // Process any pending offline actions
      await offlineAuthService.processPendingActions(this);
      
      logInfo('[UserAuthService] User logged in successfully');
      
      return { 
        success: true, 
        user,
        isAdmin: user.role === 'admin'
      };
    } catch (error) {
      logError('[UserAuthService] Login error:', error);
      
      // Try offline authentication if server is unavailable
      if (error.message === 'Network Error' || !navigator.onLine) {
        logInfo('[UserAuthService] Attempting offline authentication');
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
    
    logDebug('[UserAuthService] Registering new user');
    
    try {
      const response = await apiClient.post(`${BASE_URL}/register`, userData);
      
      if (!response || !response.data) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      logInfo('[UserAuthService] User registered successfully');
      
      return { 
        success: true, 
        message: 'Registration successful',
        user: response.data.user
      };
    } catch (error) {
      logError('[UserAuthService] Registration error:', error);
      
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
    logDebug('[UserAuthService] Logging out user');
    
    try {
      // Call logout endpoint if available
      await apiClient.post(`${BASE_URL}/logout`).catch(() => {
        // Ignore errors from logout endpoint
      });
      
      // Clear tokens
      tokenService.clearTokens();
      
      // Clear user data
      this.clearUser();
      
      // Clear offline data
      offlineAuthService.clearOfflineData();
      
      logInfo('[UserAuthService] User logged out successfully');
      
      return { success: true };
    } catch (error) {
      // Still clear tokens even if API call fails
      tokenService.clearTokens();
      this.clearUser();
      
      // If offline, add pending action
      if (error.message === 'Network Error' || !navigator.onLine) {
        offlineAuthService.addPendingAction('logout', {});
      }
      
      // Clear offline data
      offlineAuthService.clearOfflineData();
      
      logError('[UserAuthService] Logout error:', error);
      
      return { success: true }; // Always return success for logout
    }
  }
  
  /**
   * Get the current authentication status
   * @returns {Promise<Object>} Auth status
   */
  async getAuthStatus() {
    logDebug('[UserAuthService] Getting auth status');
    
    // Check if we have a valid token
    const token = tokenService.getAccessToken();
    const user = this.getUser();
    
    if (!token || !user) {
      // Check for offline authentication data
      if (offlineAuthService.hasOfflineData()) {
        logInfo('[UserAuthService] Using offline authentication data');
        return offlineAuthService.getOfflineAuthStatus();
      }
      
      return { 
        isAuthenticated: false,
        user: null,
        isAdmin: false
      };
    }
    
    // Check if token is expired
    if (tokenService.isTokenExpired()) {
      // Try to refresh the token
      const refreshResult = await tokenService.refreshToken();
      
      if (!refreshResult.success) {
        // Check for offline authentication data
        if (offlineAuthService.hasOfflineData()) {
          logInfo('[UserAuthService] Using offline authentication after failed refresh');
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
        tokenService.clearTokens();
        this.clearUser();
        
        // Check for offline authentication data
        if (offlineAuthService.hasOfflineData()) {
          logInfo('[UserAuthService] Using offline authentication after server rejection');
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
      logError('[UserAuthService] Auth status error:', error);
      
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
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object>} Update result
   */
  async updateProfile(userData) {
    if (!userData) {
      return { success: false, message: 'No user data provided' };
    }
    
    logDebug('[UserAuthService] Updating user profile');
    
    try {
      const response = await apiClient.put(`${BASE_URL}/profile`, userData);
      
      if (!response || !response.data) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      // Update stored user data
      this.setUser(response.data.user);
      
      // Update offline data
      offlineAuthService.saveOfflineData({
        user: response.data.user,
        timestamp: Date.now()
      });
      
      logInfo('[UserAuthService] User profile updated successfully');
      
      return { 
        success: true, 
        user: response.data.user
      };
    } catch (error) {
      logError('[UserAuthService] Profile update error:', error);
      
      // If offline, add pending action
      if (error.message === 'Network Error' || !navigator.onLine) {
        offlineAuthService.addPendingAction('updateProfile', userData);
        return { success: true, message: 'Profile update queued for when online', offlineMode: true };
      }
      
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
    
    logDebug('[UserAuthService] Changing user password');
    
    try {
      const response = await apiClient.post(`${BASE_URL}/change-password`, passwordData);
      
      if (!response || !response.data) {
        return { success: false, message: 'Invalid response from server' };
      }
      
      logInfo('[UserAuthService] Password changed successfully');
      
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      logError('[UserAuthService] Password change error:', error);
      
      return { 
        success: false, 
        message: error.response?.data?.message || 'Password change failed' 
      };
    }
  }
  
  /**
   * Set user data
   * @param {Object} user - User data
   */
  setUser(user) {
    if (!user) return;
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    logDebug('[UserAuthService] User data set');
  }
  
  /**
   * Get user data
   * @returns {Object|null} User data or null if not found
   */
  getUser() {
    try {
      const userJson = localStorage.getItem(STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      logError('[UserAuthService] Error parsing user data:', error);
      return null;
    }
  }
  
  /**
   * Clear user data
   */
  clearUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    logDebug('[UserAuthService] User data cleared');
  }
}

// Create and export a singleton instance
export const userAuthService = new UserAuthService();

export default UserAuthService;
