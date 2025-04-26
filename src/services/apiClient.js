/* src/services/apiClient.js */
import axios from 'axios';
import * as logger from '@/utils/logger.js';

// Custom error class for API errors (keep as is)
export class ApiError extends Error { /* ... */ }

const apiClient = async (endpoint, context, config = {}) => {
  const token = config.token || localStorage.getItem('auth_token') || null;

  const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...config.headers,
  };

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  if (!import.meta.env.VITE_API_BASE_URL) {
    logger.logWarn('[apiClient] VITE_API_BASE_URL not defined, falling back to http://localhost:5001');
  }

  // --- Corrected URL Construction (v6 - Explicit String Check) ---
  // 1. Ensure baseUrl does NOT end with /
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // 2. Ensure endpoint STARTS with /
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // 3. Determine the full path relative to the domain
  //    If endpoint already starts with '/api/', use it directly after the domain.
  //    Otherwise, prepend '/api' to the endpoint.
  const fullPath = cleanEndpoint.startsWith('/api/')
    ? cleanEndpoint
    : `/api${cleanEndpoint}`;
  // 4. Construct final URL
  const requestUrl = `${cleanBaseUrl}${fullPath}`;
  // --- End Corrected URL Construction ---


  logger.logDebug(`[apiClient] Requesting: ${config.method || 'GET'} ${requestUrl}`);

  try {
     const response = await axios({ /* ...axios config... */
       url: requestUrl,
       method: config.method || 'GET',
       headers,
       data: config.body,
       params: config.params,
     });
     logger.logDebug(`[apiClient] Raw response for ${context}:`, response);
     logger.logDebug(`[apiClient] Response data for ${context}:`, response.data);
     return { success: true, data: response.data, status: response.status };
  } catch (error) {
     const errorDetails = { /* ... */ };
     logger.logError('[apiClient] Error:', errorDetails);
     if (error.response) { /* ... */ throw new ApiError(/* ... */); }
     else if (error.request) { /* ... */ throw new ApiError(/* ... */); }
     else { /* ... */ throw new ApiError(/* ... */); }
  }
};

export default apiClient;