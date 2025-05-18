/**
 * Custom Axios Adapter
 * 
 * This module provides a custom adapter for Axios that ensures the method property
 * is always defined as a string before it's used in the dispatchXhrRequest function.
 */

import axios from 'axios';

// Get the default adapter from axios
const defaultAdapter = axios.defaults.adapter;

/**
 * Custom adapter that ensures the method property is always defined
 * 
 * @param {Object} config - Axios request config
 * @returns {Promise} - Promise that resolves with the response
 */
export function customAdapter(config) {
  // Create a new config to avoid modifying the original
  const safeConfig = { ...config };
  
  // Ensure method is defined and is a string
  if (!safeConfig.method) {
    safeConfig.method = 'get';
    console.debug('[CustomAdapter] Added missing method: get');
  } else if (typeof safeConfig.method !== 'string') {
    safeConfig.method = String(safeConfig.method);
    console.debug(`[CustomAdapter] Converted method to string: ${safeConfig.method}`);
  }
  
  // Log the request for debugging
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[CustomAdapter] ${safeConfig.method.toUpperCase()} ${safeConfig.url}`);
  }
  
  // Use the default adapter with the safe config
  return defaultAdapter(safeConfig);
}

export default customAdapter;
