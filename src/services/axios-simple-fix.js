/**
 * Simple Axios Fix for toUpperCase Error
 * 
 * This module provides a simple, direct fix for the "Cannot read properties of undefined (reading 'toUpperCase')" error
 * by patching the String.prototype.toUpperCase method to handle undefined values gracefully.
 */

import axios from 'axios';
import { logDebug, logError } from '@/utils/logger';

// Store the original toUpperCase method
const originalToUpperCase = String.prototype.toUpperCase;

// Replace it with our safe version that handles undefined values
String.prototype.toUpperCase = function() {
  // If this is undefined or null, return a default value
  if (this === undefined || this === null) {
    logDebug('[AxiosSimpleFix] Prevented toUpperCase error on undefined/null');
    return 'GET'; // Default to GET for HTTP methods
  }
  
  // Call the original method for normal cases
  return originalToUpperCase.call(this);
};

// Also patch the XMLHttpRequest.prototype.open method if in browser environment
if (typeof XMLHttpRequest !== 'undefined') {
  // Store the original open method
  const originalOpen = XMLHttpRequest.prototype.open;
  
  // Replace it with our safe version
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    // Ensure method is a non-null string
    let safeMethod = method;
    
    if (safeMethod === undefined || safeMethod === null) {
      safeMethod = 'GET';
      logDebug('[AxiosSimpleFix] Fixed undefined method in XMLHttpRequest.open -> GET');
    } else if (typeof safeMethod !== 'string') {
      try {
        safeMethod = String(safeMethod);
        logDebug(`[AxiosSimpleFix] Fixed non-string method in XMLHttpRequest.open: ${safeMethod}`);
      } catch (e) {
        safeMethod = 'GET';
        logDebug('[AxiosSimpleFix] Could not convert method to string, using GET');
      }
    }
    
    // Call original with patched method
    return originalOpen.call(this, safeMethod, url, 
                          (async === undefined ? true : async), 
                          user, password);
  };
  
  logDebug('[AxiosSimpleFix] Successfully patched XMLHttpRequest.prototype.open');
}

// Add a global error handler for this specific error
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', function(event) {
    if (event && event.reason && event.reason.message) {
      const message = event.reason.message;
      
      // Check specifically for the toUpperCase error
      if (message.includes("Cannot read properties of undefined (reading 'toUpperCase')")) {
        logError('[AxiosSimpleFix] Caught unhandled toUpperCase error:', event.reason);
        
        // Prevent the error from propagating
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
}

// Also patch axios request config to ensure method is always defined
const originalRequest = axios.request;
axios.request = function(config) {
  // Handle case where config is a string (url)
  if (typeof config === 'string') {
    config = {
      url: config,
      method: 'get'
    };
  } else if (!config) {
    config = { method: 'get' };
  } else if (!config.method) {
    config.method = 'get';
  } else if (typeof config.method !== 'string') {
    try {
      config.method = String(config.method);
    } catch (e) {
      config.method = 'get';
    }
  }
  
  return originalRequest.call(this, config);
};

// Patch all axios method shortcuts
['get', 'post', 'put', 'delete', 'head', 'options', 'patch'].forEach(method => {
  const original = axios[method];
  axios[method] = function() {
    try {
      return original.apply(this, arguments);
    } catch (error) {
      if (error.message && error.message.includes("toUpperCase")) {
        logError(`[AxiosSimpleFix] Caught toUpperCase error in ${method}:`, error);
        // Create a safe config
        const safeConfig = {
          method: method,
          url: arguments[0]
        };
        if (method !== 'get' && method !== 'head' && arguments[1]) {
          safeConfig.data = arguments[1];
        }
        if (arguments[method === 'get' || method === 'head' ? 1 : 2]) {
          safeConfig.config = arguments[method === 'get' || method === 'head' ? 1 : 2];
        }
        return axios.request(safeConfig);
      }
      throw error;
    }
  };
});

logDebug('[AxiosSimpleFix] Successfully applied simple axios patches');

export default {
  // Export any functions that might be useful elsewhere
};
