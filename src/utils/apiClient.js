// src/utils/apiClient.js
import useAuthStore from '../stores/useAuthStore'; // Adjust path as needed
import { API_BASE_URL } from '../config'; // Adjust path as needed

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
  const token = useAuthStore.getState().token; // Get current token
  const url = `${API_BASE_URL}${endpoint}`; // Construct full URL

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers, // Allow overriding headers
  };

  // Add authorization token if it exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`[apiClient ${errorContext}] ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const responseText = await response.text(); // Read text first for better error handling

    // Handle 401 Unauthorized specifically
    if (response.status === 401) {
      console.warn(`[apiClient ${errorContext}] Received 401 Unauthorized for ${url}. Triggering logout.`);
      useAuthStore.getState().logout(); // Trigger logout action
      throw new Error('Session expired or invalid. Please log in again.');
    }

    // Handle other non-ok responses
    if (!response.ok) {
      let responseErrorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(responseText);
        responseErrorMsg = errorJson.error || errorJson.msg || errorJson.message || responseErrorMsg;
      } catch (e) {
        responseErrorMsg = response.statusText || responseErrorMsg; // Fallback to status text
      }
      console.error(`[apiClient ${errorContext}] HTTP error! Status: ${response.status}, Response: ${responseText}`);
      throw new Error(responseErrorMsg);
    }

    // Handle successful empty responses (e.g., 204 No Content for DELETE)
    if (!responseText) {
      if (options.method === 'DELETE' || response.status === 204) {
          console.log(`[apiClient ${errorContext}] Received empty response (Status: ${response.status}). Assuming success for ${options.method || 'request'}.`);
          return { success: true }; // Indicate success
      }
      console.warn(`[apiClient ${errorContext}] Received empty response body for non-DELETE request.`);
      return null; // Or return empty array/object based on expected type?
    }

    // Parse successful response
    const jsonData = JSON.parse(responseText);
    return jsonData;

  } catch (error) {
    // Catch network errors or errors thrown from response checks/parsing
    // Re-throw the specific 401 error or a formatted general error
    if (error.message === 'Session expired or invalid. Please log in again.') {
        throw error;
    }
    console.error(`[apiClient ${errorContext}] Fetch or processing error for ${url}:`, error);
    // Provide a more generic error message for other types of failures
    throw new Error(`Error during ${errorContext}: ${error.message || 'Network request failed'}`);
  }
};

export default apiClient;