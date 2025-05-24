/**
 * Unified Axios Fix Module
 * 
 * This module provides a comprehensive solution to the "Cannot read properties of undefined (reading 'toUpperCase')" error
 * by combining the best approaches from multiple fix implementations.
 * 
 * Features:
 * - Ensures method property is always defined as a string before use
 * - Patches axios at multiple levels (request, adapter, XHR)
 * - Provides safe fallbacks for error cases
 * - Minimal console logging for better performance
 * 
 * This consolidates fixes from multiple previous files:
 * - axios-method-fix.js
 * - axios-patch.js
 * - axios-simple-fix.js
 * - axiosXhrFixer.js
 * - axios-init.js
 */

import { logDebug, logError } from '@/utils/logger';

// Utility: Normalize HTTP method to string
function normalizeHttpMethod(method) {
  if (method === undefined || method === null) {
    return 'get';
  } else if (typeof method !== 'string') {
    try {
      return String(method).toLowerCase();
    } catch (e) {
      return 'get';
    }
  }
  return method.toLowerCase();
}

/**
 * Apply fixes to an axios instance
 * @param {Object} axiosInstance - The axios instance to patch
 * @returns {Object} The patched axios instance
 */
export function patchAxiosInstance(axiosInstance) {
  if (!axiosInstance) {
    logError('[AxiosFix] Invalid axios instance provided');
    return null;
  }
  
  try {
    // 1. Patch the request method
    const originalRequest = axiosInstance.request;
    
    axiosInstance.request = function(config) {
      // Handle case where config is a string (url)
      if (typeof config === 'string') {
        config = {
          url: config,
          method: 'get'
        };
      } else if (!config) {
        config = { method: 'get' };
      } else {
        // Create a new config object to avoid modifying the original
        config = { ...config };
        
        // Ensure method is defined and is a string
        if (!config.method) {
          config.method = 'get';
        } else if (typeof config.method !== 'string') {
          config.method = normalizeHttpMethod(config.method);
        }
      }
      
      // Call the original request method with the safe config
      return originalRequest.call(this, config);
    };
    
    // 2. Patch the adapter if available
    if (axiosInstance.defaults && typeof axiosInstance.defaults.adapter === 'function') {
      const originalAdapter = axiosInstance.defaults.adapter;
      
      axiosInstance.defaults.adapter = function(config) {
        // Create a new config to avoid modifying the original
        const safeConfig = { ...config };
        
        // Ensure method is defined and is a string
        if (!safeConfig.method) {
          safeConfig.method = 'get';
        } else if (typeof safeConfig.method !== 'string') {
          safeConfig.method = normalizeHttpMethod(safeConfig.method);
        }
        
        // Call the original adapter with the safe config
        return originalAdapter(safeConfig);
      };
    }
    
    // 3. Patch all method shortcuts (get, post, etc.)
    ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].forEach(method => {
      const original = axiosInstance[method];
      
      axiosInstance[method] = function() {
        // Create a safe config with the correct method
        const config = {
          method: method
        };
        
        // Handle arguments based on method type
        if (arguments.length > 0) {
          config.url = arguments[0];
        }
        
        if (method !== 'get' && method !== 'head' && arguments.length > 1) {
          config.data = arguments[1];
        }
        
        if (arguments.length > (method === 'get' || method === 'head' ? 1 : 2)) {
          const extraConfig = arguments[method === 'get' || method === 'head' ? 1 : 2];
          if (extraConfig && typeof extraConfig === 'object') {
            Object.assign(config, extraConfig);
          }
        }
        
        // Call the safe request method
        return axiosInstance.request(config);
      };
    });
    
    logDebug('[AxiosFix] Successfully patched axios instance');
  } catch (error) {
    logError('[AxiosFix] Error patching axios instance:', error);
  }
  
  return axiosInstance;
}

/**
 * Apply fixes to the global axios object
 * @param {Object} axios - The global axios object
 */
export function patchGlobalAxios(axios) {
  if (!axios) {
    logError('[AxiosFix] No axios instance provided to patchGlobalAxios');
    return;
  }
  
  try {
    // Patch the main axios instance
    patchAxiosInstance(axios);
    
    // Patch the create method to ensure all new instances are also patched
    const originalCreate = axios.create;
    axios.create = function(...args) {
      try {
        // Create the instance using the original method
        const instance = originalCreate.apply(this, args);
        
        // Patch the new instance
        return patchAxiosInstance(instance);
      } catch (error) {
        logError('[AxiosFix] Error patching axios.create:', error);
        // Fall back to original implementation
        return originalCreate.apply(this, args);
      }
    };
    
    logDebug('[AxiosFix] Successfully patched global axios');
  } catch (error) {
    logError('[AxiosFix] Error patching global axios:', error);
  }
}

/**
 * Apply XHR-level fixes for browser environments
 */
export function applyXhrFixes() {
  if (typeof window === 'undefined' || !window.XMLHttpRequest) {
    return false;
  }
  
  try {
    // Patch XMLHttpRequest.prototype.open
    const originalOpen = window.XMLHttpRequest.prototype.open;
    
    window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      // Ensure method is a string
      const safeMethod = normalizeHttpMethod(method);
      
      // Call original with safe method
      return originalOpen.call(this, safeMethod, url, 
                            async === undefined ? true : async, 
                            user, password);
    };
    
    // Add global error handler for this specific error
    window.addEventListener('unhandledrejection', function(event) {
      if (event && event.reason && event.reason.message && 
          event.reason.message.includes("Cannot read properties of undefined (reading 'toUpperCase')")) {
        logError('[AxiosFix] Caught unhandled toUpperCase error');
        
        // Prevent the error from propagating
        event.preventDefault();
      }
    });
    
    logDebug('[AxiosFix] Successfully applied XHR fixes');
    return true;
  } catch (error) {
    logError('[AxiosFix] Error applying XHR fixes:', error);
    return false;
  }
}

export default {
  patchAxiosInstance,
  patchGlobalAxios,
  applyXhrFixes
};
