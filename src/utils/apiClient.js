// src/utils/apiClient.js
// Updated imports to use @ alias
import useAuthStore from '@/stores/useAuthStore';
import { API_BASE_URL } from '@/config';

/**
 * A centralized API client function for making fetch requests.
 * Handles adding auth tokens and triggering logout on 401 errors.
 *
 * @param {string} endpoint - The API endpoint (e.g., '/api/lists')
 * @param {string} errorContext - A string describing the context for error messages.
 * @param {object} options - Fetch options (method, body, etc.). Defaults to GET.
 * @returns {Promise<any>} - The parsed JSON response.
 * @throws {Error} - Throws an error on network issues or non-ok HTTP status codes.
 */
const apiClient = async (endpoint, errorContext = 'API Request', options = {}) => {
  const token = useAuthStore.getState().token;
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text();

    if (response.status === 401) {
      console.warn(`[apiClient ${errorContext}] Received 401 Unauthorized for ${url}. Triggering logout.`);
      useAuthStore.getState().logout();
      throw new Error('Session expired or invalid. Please log in again.');
    }

    if (!response.ok) {
      let responseErrorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        responseErrorMsg = errorJson.error || errorJson.msg || errorJson.message || responseErrorMsg;
      } catch (e) {
        responseErrorMsg = response.statusText || responseErrorMsg;
      }
      console.error(`[apiClient ${errorContext}] HTTP error! Status: ${response.status}, Response: ${responseText}`);
      throw new Error(responseErrorMsg);
    }

    if (!responseText) {
      if (options.method === 'DELETE' || response.status === 204) {
          return { success: true };
      }
      console.warn(`[apiClient ${errorContext}] Received empty response body for non-DELETE request.`);
      return null;
    }

    const jsonData = JSON.parse(responseText);
    return jsonData;

  } catch (error) {
    if (error.message === 'Session expired or invalid. Please log in again.') {
        throw error;
    }
    console.error(`[apiClient ${errorContext}] Fetch or processing error for ${url}:`, error);
    throw new Error(`Error during ${errorContext}: ${error.message || 'Network request failed'}`);
  }
};

export default apiClient;