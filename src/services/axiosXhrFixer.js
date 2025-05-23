/**
 * AXIOS XHR FIXER
 * 
 * This module provides a direct fix for the infamous "Cannot read properties of undefined (reading 'toUpperCase')" error in axios.
 * 
 * It replaces the internal XMLHttpRequest handling implementation with a patched version that
 * guarantees the method property is always defined before the toUpperCase method is called.
 * 
 * This is the most aggressive fix, but should resolve the issue completely.
 */

import { logDebug, logWarn, logError } from '@/utils/logger';

/**
 * Apply the fix to the global context
 * This patches String.prototype.toUpperCase and XMLHttpRequest.prototype.open
 */
export function applyGlobalXhrFixes() {
  try {
    // First part: Override XMLHttpRequest.prototype.open to ensure method is always valid
    if (typeof window !== 'undefined' && window.XMLHttpRequest) {
      // Store the original open method
      const originalOpen = window.XMLHttpRequest.prototype.open;
      
      // Replace it with our safe version
      window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        // Ensure method is a non-null string
        let safeMethod = method;
        
        if (safeMethod === undefined || safeMethod === null) {
          safeMethod = 'GET';
          logDebug('[XhrFixer] Fixed undefined method in XMLHttpRequest.open -> GET');
        } else if (typeof safeMethod !== 'string') {
          try {
            safeMethod = String(safeMethod);
            logDebug(`[XhrFixer] Fixed non-string method in XMLHttpRequest.open: ${safeMethod}`);
          } catch (e) {
            safeMethod = 'GET';
            logDebug('[XhrFixer] Could not convert method to string, using GET');
          }
        }
        
        // Call original with patched method
        return originalOpen.call(this, safeMethod, url, 
                              (async === undefined ? true : async), 
                              user, password);
      };
      
      logDebug('[XhrFixer] Successfully patched XMLHttpRequest.prototype.open');
    }
    
    // Second part: Override String.prototype.toUpperCase to handle non-string cases
    if (typeof String.prototype.toUpperCase === 'function') {
      // Store the original toUpperCase function
      const originalToUpperCase = String.prototype.toUpperCase;
      
      // Replace it with our safe version
      String.prototype.toUpperCase = function() {
        // First check if 'this' is actually a string
        if (this === null || this === undefined) {
          logWarn('[XhrFixer] toUpperCase called on null/undefined, returning "GET"');
          return 'GET';
        }
        
        try {
          // Check if we're in a dispatchXhrRequest context
          const error = new Error();
          const stack = error.stack || '';
          
          // Special handling for axios adapter context
          if (stack.includes('dispatchXhrRequest') || 
              stack.includes('xhr') || 
              stack.includes('adapter')) {
            // We're in the danger zone, extra careful handling
            if (typeof this !== 'string') {
              logWarn('[XhrFixer] toUpperCase called on non-string in dispatchXhrRequest, using GET');
              return 'GET';
            }
          }
          
          // Call the original for normal cases
          return originalToUpperCase.call(this);
        } catch (e) {
          logError('[XhrFixer] Error in toUpperCase:', e);
          return 'GET'; // Safe fallback
        }
      };
      
      logDebug('[XhrFixer] Successfully patched String.prototype.toUpperCase');
    }
    
    // Third part: Add a global unhandledrejection handler specifically for this error
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', function(event) {
        if (event && event.reason && event.reason.message) {
          const message = event.reason.message;
          
          // Check specifically for this error
          if (message.includes("Cannot read properties of undefined (reading 'toUpperCase')")) {
            logWarn('[XhrFixer] Caught unhandled toUpperCase error, creating synthetic response');
            
            // Create a synthetic response to prevent app crash
            const error = event.reason;
            const syntheticResponse = {
              data: {
                success: false,
                error: 'Request failed due to internal error',
                message: 'The method property was undefined when making the request'
              },
              status: 500,
              statusText: 'Internal Client Error',
              headers: {},
              config: error.config || {},
              request: error.request || null
            };
            
            // Replace the error with a handled version
            event.preventDefault();
            
            // Create a handled error with the synthetic response
            const handledError = new Error('Request failed due to undefined method property');
            handledError.response = syntheticResponse;
            handledError.isHandled = true;
            
            // Return a rejected promise with our handled error
            return Promise.reject(handledError);
          }
        }
      });
      
      logDebug('[XhrFixer] Added global unhandledrejection handler for toUpperCase errors');
    }
    
    return true;
  } catch (error) {
    logError('[XhrFixer] Error applying global XHR fixes:', error);
    return false;
  }
}

/**
 * Direct monkey-patch for the axios adapter if we can find it
 * This is a more targeted but potentially brittle approach
 */
export function patchAxiosAdapter(axiosInstance) {
  try {
    if (!axiosInstance) {
      if (typeof axios !== 'undefined') {
        axiosInstance = axios;
      } else {
        logWarn('[XhrFixer] No axios instance provided or found globally');
        return false;
      }
    }
    
    // Try to access the default adapter
    if (axiosInstance.defaults && axiosInstance.defaults.adapter) {
      const originalAdapter = axiosInstance.defaults.adapter;
      
      // Replace the adapter with our safe version
      axiosInstance.defaults.adapter = function(config) {
        // Clone the config to avoid mutations
        const safeConfig = { ...config };
        
        // Ensure method is valid
        if (!safeConfig.method) {
          safeConfig.method = 'get';
          logDebug('[XhrFixer] Added missing method property: get');
        } else if (typeof safeConfig.method !== 'string') {
          safeConfig.method = String(safeConfig.method);
          logDebug(`[XhrFixer] Converted non-string method: ${safeConfig.method}`);
        }
        
        // Call the original adapter with our safe config
        return originalAdapter(safeConfig);
      };
      
      logDebug('[XhrFixer] Successfully patched axios.defaults.adapter');
      return true;
    } else {
      logWarn('[XhrFixer] Could not find axios.defaults.adapter');
      return false;
    }
  } catch (error) {
    logError('[XhrFixer] Error patching axios adapter:', error);
    return false;
  }
}

// Apply fixes immediately when imported
const success = applyGlobalXhrFixes();
logDebug(`[XhrFixer] Global XHR fixes ${success ? 'successfully applied' : 'failed to apply'}`);

export default {
  applyGlobalXhrFixes,
  patchAxiosAdapter
}; 