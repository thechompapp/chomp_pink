/* src/services/authService.js */
/* REFACTORED: Let apiClient handle and propagate standardized errors */
import apiClient from '@/services/apiClient.js';

const API_ENDPOINT = '/api/auth'; // Define base endpoint

export const authService = {
    /**
     * Logs in a user.
     * @param {object} credentials - { email, password }
     * @returns {Promise<object>} - Promise resolving with { success: true, token, user } or rejecting with standardized error.
     */
    login: async (credentials) => {
        if (!credentials || !credentials.email || !credentials.password) {
             throw new Error("Email and password are required."); // Input validation before API call
        }
        const endpoint = `${API_ENDPOINT}/login`;
        const context = 'AuthService Login';
        // Let apiClient handle the call and potential errors (e.g., 401, 400, 500)
        const response = await apiClient(endpoint, context, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        // Assuming backend returns { success: true, token: '...', user: {...} } on success
        if (response.success && response.token && response.user) {
            return response; // Return the whole success response object from apiClient
        } else {
            // This case should not be reached if apiClient rejects properly
            throw new Error(response.error || 'Login failed: Invalid response from server.');
        }
        // REMOVED try/catch
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
        const endpoint = `${API_ENDPOINT}/register`;
        const context = 'AuthService Register';
        // Let apiClient handle the call and potential errors (e.g., 400, 409, 500)
        const response = await apiClient(endpoint, context, {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        // Assuming backend returns { success: true, token: '...', user: {...} } on success
        if (response.success && response.token && response.user) {
            return response;
        } else {
            throw new Error(response.error || 'Registration failed: Invalid response from server.');
        }
        // REMOVED try/catch
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
         const endpoint = `${API_ENDPOINT}/update-account-type/${userId}`;
         const context = 'AuthService Update Account Type';
         const response = await apiClient(endpoint, context, {
             method: 'PUT',
             body: JSON.stringify({ account_type: accountType }),
         });

          if (response.success && response.data) {
             // Assuming backend returns the updated user object in response.data
             return response;
          } else {
             throw new Error(response.error || 'Failed to update account type.');
          }
     },
};