import { API_BASE_URL } from '../config';

/**
 * Get the API base URL from configuration
 * Falls back to localhost if not configured
 * @returns {string} The base URL for API requests
 */
export function getApiBaseUrl() {
  return API_BASE_URL || 'http://localhost:5001/api';
}

/**
 * Get the full URL for an API endpoint
 * @param {string} endpoint - The API endpoint path
 * @returns {string} The full URL
 */
export function getApiUrl(endpoint) {
  const baseUrl = getApiBaseUrl();
  // Remove any trailing slash from the base URL
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // Remove any leading slash from the endpoint
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${normalizedBaseUrl}/${normalizedEndpoint}`;
}

export default {
  getApiBaseUrl,
  getApiUrl
}; 