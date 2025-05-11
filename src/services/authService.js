/* src/services/authService.js */
import apiClient from '@/services/apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug } from '@/utils/logger.js';

const API_ENDPOINT = '/auth'; // Define base endpoint to avoid double '/api' prefix

export const authService = {
    /**
     * Logs in a user.
     * @param {object} credentials - { email, password }
     * @returns {Promise<object>} - Promise resolving with { success: true, token, user } or rejecting with standardized error.
     */
    login: async (credentials) => {
        // Input validation before API call
        if (!credentials || !credentials.email || !credentials.password) {
             throw new Error("Email and password are required.");
        }
        
        logDebug('[AuthService] Attempting login for:', credentials.email);
        
        return handleApiResponse(
            () => apiClient.post(`${API_ENDPOINT}/login`, credentials),
            'AuthService Login'
        ).then(response => {
            if (response?.token && response?.user) {
                return response;
            } else {
                throw new Error('Login failed: Invalid response from server.');
            }
        }).catch(error => {
            logError('[AuthService] Login failed:', error);
            throw error;
        });
    },

    /**
     * Registers a new user.
     * @param {object} userData - { username, email, password }
     * @returns {Promise<object>} - Promise resolving with { success: true, token, user } or rejecting with standardized error.
     */
    register: async (userData) => {
        if (!userData || !userData.username || !userData.email || !userData.password) {
            throw new Error("Username, email, and password are required for registration.");
        }
        
        logDebug('[AuthService] Attempting registration for:', userData.email);
        
        return handleApiResponse(
            () => apiClient.post(`${API_ENDPOINT}/register`, userData),
            'AuthService Register'
        ).then(response => {
            if (response?.token && response?.user) {
                return response;
            } else {
                throw new Error('Registration failed: Invalid response from server.');
            }
        }).catch(error => {
            logError('[AuthService] Registration failed:', error);
            throw error;
        });
    },

     /**
      * Updates user account type (admin action).
      * @param {number} userId - The ID of the user to update.
      * @param {string} accountType - The new account type ('user', 'contributor', 'superuser').
      * @returns {Promise<object>} - Promise resolving with { success: true, data: { updated user } } or rejecting.
      */
     updateAccountType: async (userId, accountType) => {
         if (!userId || !accountType) {
             throw new Error("User ID and account type are required.");
         }
         
         logDebug(`[AuthService] Attempting to update account type for user ${userId} to ${accountType}`);
         
         return handleApiResponse(
             () => apiClient.put(`${API_ENDPOINT}/update-account-type/${userId}`, { account_type: accountType }),
             'AuthService Update Account Type'
         ).then(response => {
             if (response?.data) {
                 return response;
             } else {
                 throw new Error('Failed to update account type: Invalid response from server.');
             }
         }).catch(error => {
             logError(`[AuthService] Failed to update account type for user ${userId}:`, error);
             throw error;
         });
     },

    /**
     * Refresh the authentication token
     * @returns {Promise<object>} - Promise resolving with new token data or rejecting with standardized error
     */
    refreshToken: async () => {
        logDebug('[AuthService] Attempting to refresh token');
        
        return handleApiResponse(
            () => apiClient.post(`${API_ENDPOINT}/refresh-token`),
            'AuthService Refresh Token'
        ).then(response => {
            if (response?.token) {
                return response;
            } else {
                throw new Error('Token refresh failed: Invalid response from server.');
            }
        }).catch(error => {
            logError('[AuthService] Token refresh failed:', error);
            throw error;
        });
    },

    /**
     * Logs out a user by clearing tokens
     * @returns {Promise<object>} - Promise resolving with success status
     */
    logout: async () => {
        logDebug('[AuthService] Attempting logout');
        
        try {
            // Check local storage first to see if we're already logged out
            const authStorage = localStorage.getItem('auth-storage');
            if (!authStorage || !JSON.parse(authStorage)?.state?.isAuthenticated) {
                logDebug('[AuthService] Already logged out, skipping API call');
                return { success: true, message: 'Already logged out' };
            }
            
            // Try to call the server logout endpoint but don't depend on its success
            try {
                await apiClient.post(`${API_ENDPOINT}/logout`, {}, {
                    // Skip interceptors for logout requests to avoid token refresh attempts
                    _skipAuthRefresh: true,
                    // Prevent 401 errors from being thrown during logout
                    validateStatus: status => status < 500
                });
                logDebug('[AuthService] Logout API call successful');
            } catch (apiError) {
                // Just log the error but continue with client-side logout
                logError('[AuthService] Logout API call failed:', apiError);
            }
            
            // Clear local storage regardless of API success
            try {
                localStorage.removeItem('auth-storage');
                logDebug('[AuthService] Cleared auth storage');
            } catch (storageError) {
                logError('[AuthService] Failed to clear localStorage:', storageError);
            }
            
            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            // Log the error but still report success to ensure UI updates properly
            logError('[AuthService] Unexpected error during logout:', error);
            return { success: true, message: 'Logged out on client-side only' };
        }
    },
};