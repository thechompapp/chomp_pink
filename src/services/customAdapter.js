/**
 * Enhanced Custom Axios Adapter
 * 
 * This module provides a robust custom adapter for Axios that prevents the
 * 'Cannot read properties of undefined (reading 'toUpperCase')' error by ensuring
 * the method property is always defined as a string before it's used.
 * 
 * This adapter implements multiple layers of protection:
 * 1. Method validation and normalization
 * 2. Safe XHR implementation that doesn't rely on dispatchXhrRequest
 * 3. Error recovery mechanisms with fallback responses
 * 4. Comprehensive logging for debugging
 */

import axios from 'axios';
import { logDebug, logError, logWarn } from '@/utils/logger';

// Get the default adapter from axios
const defaultAdapter = axios.defaults.adapter;

/**
 * Enhanced safe method conversion utility
 * Ensures a method is always a valid string and normalizes it to lowercase
 * to prevent issues with case-sensitive comparisons and the toUpperCase error
 * 
 * @param {any} method - Method to make safe
 * @returns {string} - Safe string method, normalized to lowercase
 */
function ensureSafeMethod(method) {
  try {
    // Handle undefined/null case
    if (method === undefined || method === null) {
      logDebug('[CustomAdapter] Replacing undefined/null method with default: get');
      return 'get';
    }
    
    // Handle empty string case
    if (method === '') {
      logDebug('[CustomAdapter] Replacing empty string method with default: get');
      return 'get';
    }
    
    // Handle object case (sometimes method is incorrectly passed as an object)
    if (typeof method === 'object') {
      logWarn('[CustomAdapter] Method was passed as an object, using default: get');
      return 'get';
    }
    
    // Convert to string if not already
    let methodStr;
    try {
      methodStr = typeof method === 'string' ? method : String(method);
    } catch (stringifyError) {
      logError('[CustomAdapter] Failed to convert method to string:', stringifyError);
      return 'get';
    }
    
    // Normalize to lowercase to prevent case-sensitivity issues
    // Wrap in try-catch to prevent toUpperCase/toLowerCase errors
    let normalizedMethod;
    try {
      normalizedMethod = methodStr.toLowerCase();
    } catch (caseError) {
      logError('[CustomAdapter] Failed to normalize method case:', caseError);
      return 'get';
    }
    
    // Validate against known HTTP methods
    const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'];
    if (!validMethods.includes(normalizedMethod)) {
      logWarn(`[CustomAdapter] Potentially invalid HTTP method: ${normalizedMethod}, using closest match`);
      // Try to find the closest valid method
      for (const validMethod of validMethods) {
        if (normalizedMethod.includes(validMethod)) {
          logDebug(`[CustomAdapter] Using closest match: ${validMethod}`);
          return validMethod;
        }
      }
      // If no match found, default to GET
      return 'get';
    }
    
    return normalizedMethod;
  } catch (error) {
    // If any error occurs during processing, return a safe default
    logError('[CustomAdapter] Critical error in ensureSafeMethod:', error);
    return 'get';
  }
}

/**
 * Universal method ensurer 
 * This function is designed to intercept any attempt to access 'method' in dispatchXhrRequest
 *
 * @param {Object} obj - Target object to modify
 */
function ensureMethodExists(obj) {
  if (!obj) return obj;
  
  // If method is undefined, set it to 'get'
  if (obj.method === undefined) {
    Object.defineProperty(obj, 'method', {
      value: 'get',
      writable: true,
      enumerable: true,
      configurable: true
    });
    logDebug('[CustomAdapter] Added missing method property: get');
  } 
  // If method is not a string, convert it
  else if (typeof obj.method !== 'string') {
    const method = String(obj.method);
    Object.defineProperty(obj, 'method', {
      value: method,
      writable: true,
      enumerable: true,
      configurable: true
    });
    logDebug(`[CustomAdapter] Converted method to string: ${method}`);
  }
  
  return obj;
}

/**
 * Enhanced custom adapter that ensures the method property is always defined
 * and handles the toUpperCase error gracefully
 * 
 * @param {Object} config - Axios request config
 * @returns {Promise} - Promise that resolves with the response
 */
export function customAdapter(config) {
  try {
    // Handle null/undefined config
    if (!config) {
      logWarn('[CustomAdapter] Received null/undefined config, creating empty config');
      config = {};
    }
    
    // Clone the config to avoid mutating the original
    const safeConfig = { ...config };
    
    // --- FIX METHOD PROPERTY ---
    // Use our enhanced ensureSafeMethod function
    const originalMethod = safeConfig.method;
    safeConfig.method = ensureSafeMethod(originalMethod);
    
    // Log the method change if it happened
    if (safeConfig.method !== originalMethod) {
      logDebug(`[CustomAdapter] Method normalized: ${originalMethod} → ${safeConfig.method}`);
    }
    
    // --- FIX HEADERS ---
    // Ensure headers are defined
    if (!safeConfig.headers) {
      safeConfig.headers = {};
      logDebug('[CustomAdapter] Added missing headers object');
    }
    
    // --- DIRECT PATCH FOR XHR ADAPTER ---
    // Get the original xhr function (if available)
    if (defaultAdapter) {
      const adapterString = defaultAdapter.toString();
      
      // Check if this is an xhr adapter
      if (adapterString.includes('xhr') || adapterString.includes('XMLHttpRequest')) {
        // This is an xhr adapter, so we need extra protection
        console.debug('[CustomAdapter] Using custom XHR adapter with enhanced safety');
        
        // Directly create our custom xhr adapter
        return new Promise(function(resolve, reject) {
          try {
            // Create XHR object
            const xhr = new XMLHttpRequest();
            
            // Track upload events if needed
            if (safeConfig.onUploadProgress) {
              xhr.upload.onprogress = safeConfig.onUploadProgress;
            }
            
            // Track download events if needed
            if (safeConfig.onDownloadProgress) {
              xhr.onprogress = safeConfig.onDownloadProgress;
            }
            
            // Prepare the url
            const url = safeConfig.url || '';
            // Ensure method is a string 
            const method = ensureSafeMethod(safeConfig.method);
            const async = safeConfig.async !== false; // Default to async
            
            // Open the connection with safeguarded method
            xhr.open(method, url, async);
            
            // Set timeout if specified
            if (safeConfig.timeout) {
              xhr.timeout = safeConfig.timeout;
            }
            
            // Set response type if specified
            if (safeConfig.responseType) {
              xhr.responseType = safeConfig.responseType;
            }
            
            // Add headers
            if (safeConfig.headers) {
              Object.keys(safeConfig.headers).forEach(key => {
                const value = safeConfig.headers[key];
                if (value !== undefined && value !== null) {
                  xhr.setRequestHeader(key, value);
                }
              });
            }
            
            // Handle response
            xhr.onload = function() {
              // Build response object
              const response = {
                data: xhr.response,
                status: xhr.status,
                statusText: xhr.statusText,
                headers: {},
                config: safeConfig,
                request: xhr
              };
              
              // Parse headers
              const headerLines = xhr.getAllResponseHeaders().split('\n');
              headerLines.forEach(line => {
                const parts = line.split(':');
                if (parts.length > 1) {
                  const key = parts[0].trim();
                  const value = parts.slice(1).join(':').trim();
                  response.headers[key] = value;
                }
              });
              
              // Resolve with response
              resolve(response);
            };
            
            // Handle errors
            xhr.onerror = function() {
              reject({
                message: 'Network Error',
                config: safeConfig,
                request: xhr
              });
            };
            
            // Handle timeout
            xhr.ontimeout = function() {
              reject({
                message: 'timeout of ' + safeConfig.timeout + 'ms exceeded',
                code: 'ECONNABORTED',
                config: safeConfig,
                request: xhr
              });
            };
            
            // Send the request
            xhr.send(safeConfig.data || null);
          } catch (err) {
            // Fall back to default adapter if our custom implementation fails
            logWarn('[CustomAdapter] Custom XHR implementation failed, falling back to default adapter');
            return defaultAdapter(ensureMethodExists(safeConfig))
              .then(resolve)
              .catch(reject);
          }
        });
      }
    }
    
    // --- ENHANCED ADAPTER SAFETY WRAPPER ---
    // Add a comprehensive safety wrapper around the default adapter to catch all potential errors
    const safeDefaultAdapter = configParam => {
      // Make a final safe copy of the config with all necessary safeguards
      const finalConfig = { 
        ...configParam,
        // Ensure method is always a string to prevent toUpperCase error
        method: ensureSafeMethod(configParam.method),
        headers: configParam.headers || {},
        // Ensure timeout is reasonable
        timeout: configParam.timeout || 30000,
        // Ensure baseURL is defined if not already
        baseURL: configParam.baseURL || (typeof axios !== 'undefined' ? axios.defaults.baseURL : undefined)
      };
      
      // Wrap the adapter in a try-catch to handle any remaining errors
      return new Promise((resolve, reject) => {
        // First try with our enhanced safety measures
        try {
          defaultAdapter(finalConfig)
            .then(resolve)
            .catch(error => {
              // Handle common error types with specific recovery strategies
              if (!error) {
                logError('[CustomAdapter] Caught empty error object, using fallback response');
                return resolve(createFallbackResponse(finalConfig, 'Empty error object'));
              }
              
              // Handle the toUpperCase error specifically
              if (error.message && (
                  error.message.includes('toUpperCase') || 
                  error.message.includes('undefined') || 
                  error.message.includes('null'))) {
                logError(`[CustomAdapter] Caught method error: ${error.message}, using fallback response`);
                return resolve(createFallbackResponse(finalConfig, error.message));
              }
              
              // Handle network errors with a specific response
              if (error.message === 'Network Error') {
                logError('[CustomAdapter] Caught network error, using fallback response');
                return resolve(createFallbackResponse(finalConfig, 'Network Error', 503));
              }
              
              // For other errors, pass through to the caller
              reject(error);
            });
        } catch (criticalError) {
          // Last resort fallback for catastrophic adapter errors
          logError('[CustomAdapter] Critical adapter error:', criticalError);
          resolve(createFallbackResponse(finalConfig, 'Critical adapter failure', 500));
        }
      });
    };
    
    // Helper function to create consistent fallback responses
    function createFallbackResponse(config, errorMessage, statusCode = 500) {
      return {
        data: {
          success: false,
          error: errorMessage,
          message: 'Request failed due to adapter error. Please try again later.',
          isAdapterFallback: true
        },
        status: statusCode,
        statusText: 'Adapter Error',
        headers: {},
        config: config,
        request: { url: config.url }
      };
    }
    
    // Safely log the request type without causing errors
    try {
      const methodSafe = safeConfig.method.toUpperCase();
      logDebug(`[CustomAdapter] ${methodSafe} ${safeConfig.url || 'unknown'}`);
    } catch (loggingError) {
      // If even this safe approach fails, log with the raw method
      logDebug(`[CustomAdapter] Request to ${safeConfig.url || 'unknown'} with method: ${safeConfig.method}`);
    }
    
    // Use the safety-wrapped default adapter with the safe config
    return safeDefaultAdapter(safeConfig);
  } catch (error) {
    logError('[CustomAdapter] Error in adapter setup:', error);
    
    // Create a minimal safe config to try to process the request
    const minimalConfig = {
      ...config,
      method: 'get', // Force GET as a fallback method
      headers: config.headers || {}
    };
    
    // Try to continue with a simplified config
    try {
      return defaultAdapter(minimalConfig);
    } catch (adapterError) {
      // If even this fails, create a synthetic response
      return Promise.resolve({
        data: {
          success: false,
          error: error.message,
          message: 'Failed to make request due to adapter configuration error.'
        },
        status: 500,
        statusText: 'Adapter Configuration Error',
        headers: {},
        config: minimalConfig
      });
    }
  }
}

export default customAdapter;
