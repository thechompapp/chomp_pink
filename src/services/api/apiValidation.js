/**
 * API Validation Utilities
 *
 * Provides validation functions for API requests:
 * - URL validation
 * - Method validation
 * - Configuration validation
 * - Parameter validation
 */

import { logWarn, logError } from '@/utils/logger';
import { getApiBaseUrl } from './apiClientCore';

/**
 * Validate and normalize a URL
 * 
 * @param {string} url - URL to validate
 * @param {string} context - Context for error messages
 * @returns {string|null} Normalized URL or null if invalid
 */
export function validateUrl(url, context = 'API') {
  if (!url) {
    logError(`[${context}] URL is required for API request`);
    return null;
  }
  
  // Normalize URL (remove leading slash if present)
  let normalizedUrl = url;
  if (typeof normalizedUrl === 'string' && normalizedUrl.startsWith('/')) {
    normalizedUrl = normalizedUrl.substring(1);
  }
  
  return normalizedUrl;
}

/**
 * Validate and normalize an HTTP method
 * 
 * @param {string} method - Method to validate
 * @param {string} context - Context for error messages
 * @returns {string} Normalized method
 */
export function validateMethod(method, context = 'API') {
  if (!method) {
    logWarn(`[${context}] Method not specified, defaulting to GET`);
    return 'get';
  }
  
  if (typeof method !== 'string') {
    try {
      return String(method).toLowerCase();
    } catch (e) {
      logWarn(`[${context}] Failed to convert method to string, defaulted to GET`);
      return 'get';
    }
  }
  
  return method.toLowerCase();
}

/**
 * Validate request configuration
 * 
 * @param {Object} config - Request configuration
 * @param {string} context - Context for error messages
 * @returns {Object} Validated configuration
 */
export function validateConfig(config, context = 'API') {
  // Create a safe copy
  const safeConfig = { ...(config || {}) };
  
  // Validate URL
  if (!safeConfig.url) {
    logError(`[${context}] URL is required for API request`);
    throw new Error('URL is required for API request');
  }
  
  // Normalize URL
  if (typeof safeConfig.url === 'string' && safeConfig.url.startsWith('/')) {
    safeConfig.url = safeConfig.url.substring(1);
  }
  
  // Validate method
  safeConfig.method = validateMethod(safeConfig.method, context);
  
  // Ensure baseURL is set
  if (!safeConfig.baseURL) {
    safeConfig.baseURL = getApiBaseUrl();
  } else if (typeof safeConfig.baseURL === 'string') {
    // Remove trailing slashes
    safeConfig.baseURL = safeConfig.baseURL.replace(/\/+$/, '');
  }
  
  // Ensure headers object exists
  safeConfig.headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(safeConfig.headers || {})
  };
  
  return safeConfig;
}

/**
 * Validate ID parameter
 * 
 * @param {string|number} id - ID to validate
 * @param {string} context - Context for error messages
 * @returns {string|number|null} Validated ID or null if invalid
 */
export function validateId(id, context = 'API') {
  if (id === undefined || id === null) {
    logError(`[${context}] ID is required`);
    return null;
  }
  
  // Allow string or number IDs
  if (typeof id !== 'string' && typeof id !== 'number') {
    try {
      return String(id);
    } catch (e) {
      logError(`[${context}] Invalid ID type: ${typeof id}`);
      return null;
    }
  }
  
  return id;
}

export default {
  validateUrl,
  validateMethod,
  validateConfig,
  validateId
};
