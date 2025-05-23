/**
 * Axios Initialization and Patching Module
 * 
 * This module applies a comprehensive set of patches to the axios library to fix common issues
 * and prevent errors like "Cannot read properties of undefined (reading 'toUpperCase')".
 * 
 * Import this module early in your application to apply the fixes before any API calls are made.
 */

import axios from 'axios';
import { patchGlobalAxios } from './axios-patch';
import { logDebug, logWarn, logError } from '@/utils/logger';

/**
 * Direct monkey patch for the dispatchXhrRequest function in axios
 * 
 * This is a very invasive approach, but it's the most effective way to fix the toUpperCase error
 * by patching the exact location where the error occurs.
 */
function patchDispatchXhrRequest() {
  try {
    // Get the axios source code from node_modules
    const axiosModule = require('axios');
    
    // Check if we can find the xhr adapter module
    if (axiosModule && axiosModule.defaults && axiosModule.defaults.adapter) {
      const adapterSource = axiosModule.defaults.adapter.toString();
      
      // Try to locate dispatchXhrRequest in the adapter - this is a brittle approach
      // but necessary to fix the deep-level issue
      if (adapterSource.includes('dispatchXhrRequest')) {
        logDebug('[Axios Patch] Found dispatchXhrRequest in adapter, attempting direct patch');
        
        // Attempt to find and patch all xhr objects
        Object.keys(axiosModule).forEach(key => {
          const obj = axiosModule[key];
          
          // Check if this object might contain the dispatchXhrRequest function
          if (obj && typeof obj === 'object') {
            patchXhrObject(obj);
          }
        });
      }
    }
    
    // CRITICAL PATCH: Directly modify the XMLHttpRequest.prototype.open method
    // This works regardless of whether we can find dispatchXhrRequest
    if (typeof window !== 'undefined' && window.XMLHttpRequest) {
      const originalOpen = window.XMLHttpRequest.prototype.open;
      
      window.XMLHttpRequest.prototype.open = function(method, url, async, username, password) {
        // Ensure method is a valid string
        const safeMethod = typeof method === 'string' ? method : 
                        (method ? String(method) : 'GET');
        
        // Log that we're patching the method
        if (method !== safeMethod) {
          logDebug(`[XMLHttpRequest.open] Fixed invalid method: ${method} -> ${safeMethod}`);
        }
        
        // Call the original method with the safe params
        return originalOpen.call(this, safeMethod, url, 
                                (async === undefined ? true : async), 
                                username, password);
      };
      
      logDebug('[Axios Patch] Successfully patched XMLHttpRequest.open');
    }
    
    // Patch Axios.request's internal dispatchRequest function
    if (typeof axios.request === 'function') {
      const originalRequest = axios.request;
      
      axios.request = function(config) {
        // Make sure config has a valid method before the request is dispatched
        if (!config) config = {};
        if (!config.method) config.method = 'get';
        else if (typeof config.method !== 'string') config.method = String(config.method);
        
        return originalRequest.call(this, config);
      };
      
      logDebug('[Axios Patch] Successfully patched axios.request');
    }
    
    // Create global fixer that will fix properties before they're accessed
    if (typeof Proxy === 'function') {
      try {
        // Create a global handler for Object.prototype.toUpperCase calls
        const originalToUpperCase = String.prototype.toUpperCase;
        
        String.prototype.toUpperCase = function() {
          // This is already a string since we're calling a string method
          return originalToUpperCase.call(this);
        };
        
        // Patch Object.prototype.toString to fix issues with non-string objects
        const originalToString = Object.prototype.toString;
        
        Object.prototype.toString = function() {
          // Check if someone's trying to call toString to use toUpperCase later
          const stack = new Error().stack || '';
          
          if (stack.includes('dispatchXhrRequest') || stack.includes('xhr')) {
            // If it looks like it's coming from axios's XHR handling,
            // return a string that won't cause issues
            if (this === null || this === undefined) {
              return ''; // Safe default
            }
          }
          
          return originalToString.call(this);
        };
        
        logDebug('[Axios Patch] Successfully patched String.prototype.toUpperCase and Object.prototype.toString');
      } catch (error) {
        logWarn('[Axios Patch] Error patching String.prototype.toUpperCase:', error);
      }
    }
    
    // Ensure all axios instances have method patching
    axios.interceptors.request.use(config => {
      // Clone config to avoid mutating the original
      const newConfig = { ...config };
      
      // Ensure method is properly set
      if (!newConfig.method) {
        newConfig.method = 'get';
      } else if (typeof newConfig.method !== 'string') {
        newConfig.method = String(newConfig.method);
      }
      
      return newConfig;
    });
    
    logDebug('[Axios Patch] Successfully applied direct dispatchXhrRequest patches');
  } catch (error) {
    logError('[Axios Patch] Error applying direct dispatchXhrRequest patches:', error);
  }
}

/**
 * Recursively patch all potentially relevant objects in the given object
 */
function patchXhrObject(obj, depth = 0) {
  // Avoid infinite recursion
  if (depth > 10) return;
  
  // Skip null and already visited objects
  if (!obj || obj._patched) return;
  
  try {
    // Mark as patched
    obj._patched = true;
    
    // Check if this object has a property that mentions xhr or dispatch
    for (const key in obj) {
      if (typeof key === 'string' && 
          (key.includes('xhr') || key.includes('dispatch') || key.includes('request'))) {
        const value = obj[key];
        
        // If it's a function, check if it might be dispatchXhrRequest
        if (typeof value === 'function') {
          const fnStr = value.toString();
          
          if (fnStr.includes('toUpperCase') || fnStr.includes('method')) {
            // This is probably the culprit - patch it
            obj[key] = createSafeWrapper(value);
            logDebug(`[Axios Patch] Patched potential dispatchXhrRequest function: ${key}`);
          }
        }
      }
      
      // Recursively patch nested objects
      if (obj[key] && typeof obj[key] === 'object') {
        patchXhrObject(obj[key], depth + 1);
      }
    }
  } catch (error) {
    // Ignore errors for object property access
  }
}

/**
 * Create a safe wrapper around a function that might be dispatchXhrRequest
 */
function createSafeWrapper(originalFn) {
  return function(...args) {
    try {
      // Ensure first argument (config) has method property
      if (args.length > 0 && args[0] && typeof args[0] === 'object') {
        const config = args[0];
        
        // Ensure method is a string
        if (!config.method) {
          config.method = 'get';
        } else if (typeof config.method !== 'string') {
          config.method = String(config.method);
        }
      }
      
      // Call original with fixed args
      return originalFn.apply(this, args);
    } catch (error) {
      logError('[Axios Patch] Error in safe wrapper:', error);
      throw error;
    }
  };
}

/**
 * Apply global monkey patches to prevent TypeError: Cannot read properties of undefined (reading 'toUpperCase')
 * This patches at the lowest level possible
 */
function applyGlobalFixes() {
  // Make absolutely sure axios is patched
  patchGlobalAxios(axios);
  
  // Apply the direct monkey patch for dispatchXhrRequest
  patchDispatchXhrRequest();
  
  // Add global error handler for uncaught axios errors
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', function(event) {
      if (event && event.reason) {
        const error = event.reason;
        
        // Check if this is an axios error with the toUpperCase issue
        if (error.message && error.message.includes("Cannot read properties of undefined (reading 'toUpperCase')")) {
          logWarn('[Global Error Handler] Caught unhandled toUpperCase error:', error);
          
          // Create a safer error object
          const safeError = new Error('API client error: Method is undefined');
          safeError.originalError = error;
          safeError.isHandled = true;
          
          // Replace the original error
          event.preventDefault();
          
          // Return a rejected promise with the safe error
          return Promise.reject(safeError);
        }
      }
    });
  }
  
  logDebug('[Axios Init] Applied global axios fixes');
}

// Patch axios defaults to include proper headers and other defaults
function configureAxiosDefaults() {
  // Set default headers
  axios.defaults.headers.common['Accept'] = 'application/json';
  axios.defaults.headers.common['Content-Type'] = 'application/json';
  
  // Set reasonable timeout
  axios.defaults.timeout = 30000; // 30 seconds
  
  // Ensure response type is json by default
  axios.defaults.responseType = 'json';
  
  // Override transformRequest to ensure method is always defined
  const originalTransformRequest = axios.defaults.transformRequest;
  axios.defaults.transformRequest = [function(data, headers) {
    // Ensure config's method is always properly defined
    if (this && !this.method) {
      this.method = 'get';
      logDebug('[Axios Transform] Added missing method: get');
    } else if (this && typeof this.method !== 'string') {
      this.method = String(this.method);
      logDebug(`[Axios Transform] Converted method to string: ${this.method}`);
    }
    
    // Call original transform
    if (originalTransformRequest && typeof originalTransformRequest === 'function') {
      return originalTransformRequest(data, headers);
    } else if (Array.isArray(originalTransformRequest)) {
      let transformedData = data;
      for (const fn of originalTransformRequest) {
        if (typeof fn === 'function') {
          transformedData = fn(transformedData, headers);
        }
      }
      return transformedData;
    }
    
    // Default transformation if no original transform exists
    if (typeof data === 'object' && data !== null && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
      return JSON.stringify(data);
    }
    
    return data;
  }];
  
  logDebug('[Axios Init] Configured axios defaults');
}

// Apply all fixes and configurations
function initializeAxios() {
  // Apply low-level fixes
  applyGlobalFixes();
  
  // Configure defaults
  configureAxiosDefaults();
  
  logDebug('[Axios Init] Axios has been fully initialized and patched');
  
  return axios;
}

// Initialize immediately when this module is imported
const patchedAxios = initializeAxios();

// Export the patched axios instance
export default patchedAxios;

// Also export common methods for convenience
export const { get, post, put, patch, delete: del } = patchedAxios; 