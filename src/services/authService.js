/* src/services/authService.js */
import apiClient from '@/services/apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug } from '@/utils/logger.js';

const API_ENDPOINT = '/auth'; // Use '/auth' since apiClient already has '/api' as baseURL

export const authService = {
    /**
     * Logs in a user.
     * @param {object} credentials - { email, password }
     * @returns {Promise<object>} - Promise resolving with { success: true, token, user } or rejecting with standardized error.
     */
    login: async (credentials) => {
        try {
            // CRITICAL: Clear offline mode flags first to ensure we're in online mode
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('offline-mode');
                localStorage.removeItem('offline_mode');
                localStorage.setItem('force_online', 'true');
            }
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('offline-mode');
                sessionStorage.removeItem('offline_mode');
            }
            
            // Input validation before API call
            if (!credentials || !credentials.email || !credentials.password) {
                throw new Error("Email and password are required.");
            }
            
            // Check for admin login in development mode
            if (process.env.NODE_ENV === 'development' && 
                credentials.email === 'admin@example.com' && 
                credentials.password === 'doof123') {
                logDebug('[AuthService] Using admin credentials in development mode');
                // Set admin flags for development mode
                localStorage.setItem('admin_access_enabled', 'true');
                localStorage.setItem('superuser_override', 'true');
            }
            
            logDebug('[AuthService] Attempting login for:', credentials.email);
            
            // Create a direct axios config object with explicit method
            const axiosConfig = {
                url: `${API_ENDPOINT}/login`,
                method: 'post', // Explicitly set method as a string
                data: credentials,
                // Add a timeout to prevent hanging requests
                timeout: 10000
            };
            
            const response = await handleApiResponse(
                () => apiClient(axiosConfig), // Use direct config approach
                'AuthService Login'
            );
            
            if (response?.token && response?.user) {
                // Login successful, ensure offline mode is disabled
                if (typeof localStorage !== 'undefined') {
                    localStorage.removeItem('offline-mode');
                    localStorage.removeItem('offline_mode');
                    localStorage.setItem('force_online', 'true');
                    localStorage.removeItem('user_explicitly_logged_out');
                    
                    // In development mode, set admin flags if user is admin
                    if (process.env.NODE_ENV === 'development' && 
                        (response.user.role === 'admin' || 
                         response.user.account_type === 'superuser')) {
                        localStorage.setItem('admin_access_enabled', 'true');
                        localStorage.setItem('superuser_override', 'true');
                    }
                }
                
                // Dispatch event to force UI refresh
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('forceUiRefresh', {
                        detail: { timestamp: Date.now() }
                    }));
                }
                
                return response;
            } else {
                throw new Error('Login failed: Invalid response from server.');
            }
        } catch (error) {
            logError('[AuthService] Login failed:', error);
            throw error;
        }
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
        
        // Create a direct axios config object with explicit method
        const axiosConfig = {
            url: `${API_ENDPOINT}/register`,
            method: 'post', // Explicitly set method as a string
            data: userData
        };
        
        return handleApiResponse(
            () => apiClient(axiosConfig), // Use direct config approach
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
         
         // Create a direct axios config object with explicit method
         const axiosConfig = {
             url: `${API_ENDPOINT}/update-account-type/${userId}`,
             method: 'put', // Explicitly set method as a string
             data: { account_type: accountType }
         };
         
         return handleApiResponse(
             () => apiClient(axiosConfig), // Use direct config approach
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
        
        // Create a direct axios config object with explicit method
        const axiosConfig = {
            url: `${API_ENDPOINT}/refresh-token`,
            method: 'post', // Explicitly set method as a string
            data: {}
        };
        
        return handleApiResponse(
            () => apiClient(axiosConfig), // Use direct config approach
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
     * Logs out the current user.
     * @returns {Promise<object>} - Promise resolving with { success: true, message } or rejecting with standardized error.
     */
    logout: async () => {
        try {
            // CRITICAL: Clear offline mode flags first to ensure we're in online mode
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('offline-mode');
                localStorage.removeItem('offline_mode');
                localStorage.setItem('force_online', 'true');
            }
            if (typeof sessionStorage !== 'undefined') {
                sessionStorage.removeItem('offline-mode');
                sessionStorage.removeItem('offline_mode');
            }
            
            // Check if user is already logged out
            const authStorage = localStorage.getItem('auth-storage');
            let isAuthenticated = false;
            try {
                if (authStorage) {
                    const authData = JSON.parse(authStorage);
                    isAuthenticated = authData?.state?.isAuthenticated || false;
                }
            } catch (parseError) {
                logError('[AuthService] Error parsing auth storage:', parseError);
            }
            
            if (!isAuthenticated) {
                logDebug('[AuthService] Already logged out, skipping API call');
                return { success: true, message: 'Already logged out' };
            }
            
            // Try to call the server logout endpoint but don't depend on its success
            try {
                // Create a direct axios config object with explicit method
                const axiosConfig = {
                    url: `${API_ENDPOINT}/logout`,
                    method: 'post', // Explicitly set method as a string
                    data: {},
                    // Skip interceptors for logout requests to avoid token refresh attempts
                    _skipAuthRefresh: true,
                    // Prevent 401 errors from being thrown during logout
                    validateStatus: status => status < 500,
                    // Add a timeout to prevent hanging requests
                    timeout: 5000
                };
                
                // Use the direct config approach to avoid method issues
                const response = await apiClient(axiosConfig);
                logDebug('[AuthService] Logout API call successful:', response);
            } catch (apiError) {
                // Just log the error but continue with client-side logout
                logError('[AuthService] Logout API call failed:', apiError);
            }
            
            // Clear local storage regardless of API success
            try {
                // Clear all auth-related items
                localStorage.removeItem('auth-storage');
                localStorage.removeItem('auth-token');
                localStorage.removeItem('admin_access_enabled');
                localStorage.removeItem('superuser_override');
                localStorage.removeItem('admin_api_key');
                
                // Also clear admin flags to ensure clean logout
                if (process.env.NODE_ENV === 'development') {
                    localStorage.setItem('user_explicitly_logged_out', 'true');
                }
                
                logDebug('[AuthService] Cleared auth storage');
                
                // Dispatch event to force UI refresh
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('forceUiRefresh', {
                        detail: { timestamp: Date.now() }
                    }));
                }
            } catch (storageError) {
                logError('[AuthService] Failed to clear localStorage:', storageError);
            }
            
            return { success: true, message: 'Logged out successfully' };
        } catch (error) {
            // Log the error but still report success to ensure UI updates properly
            logError('[AuthService] Unexpected error during logout:', error);
            
            // Even if there's an error, try to clear storage as a last resort
            try {
                localStorage.removeItem('auth-storage');
                localStorage.removeItem('auth-token');
            } catch (e) {}
            
            return { success: true, message: 'Logged out on client-side only' };
        }
    },
};