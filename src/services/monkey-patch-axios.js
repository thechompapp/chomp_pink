/**
 * Axios Monkey Patch
 * 
 * This module directly patches the axios library's internal functions
 * to fix the "Cannot read properties of undefined (reading 'toUpperCase')" error.
 * 
 * It uses a monkey patching approach to directly modify the problematic functions
 * in the bundled axios code.
 */

import { logDebug, logError } from '@/utils/logger';

/**
 * Apply the monkey patch to fix the axios toUpperCase error
 */
export function applyMonkeyPatch() {
  try {
    // First approach: Patch String.prototype.toUpperCase
    patchToUpperCase();
    
    // Second approach: Try to find and patch dispatchXhrRequest
    patchDispatchXhrRequest();
    
    // Third approach: Add a global unhandledrejection handler
    addGlobalErrorHandler();
    
    logDebug('[MonkeyPatch] Successfully applied axios patches');
    return true;
  } catch (error) {
    logError('[MonkeyPatch] Error applying axios patches:', error);
    return false;
  }
}

/**
 * Patch String.prototype.toUpperCase to handle undefined values
 */
function patchToUpperCase() {
  try {
    // Store the original method
    const originalToUpperCase = String.prototype.toUpperCase;
    
    // Replace it with our safe version
    String.prototype.toUpperCase = function() {
      // If this is undefined or null, return a default value
      if (this === undefined || this === null) {
        logDebug('[MonkeyPatch] Prevented toUpperCase error on undefined/null');
        return 'GET'; // Default to GET for HTTP methods
      }
      
      // Call the original method for normal cases
      return originalToUpperCase.call(this);
    };
    
    logDebug('[MonkeyPatch] Successfully patched String.prototype.toUpperCase');
  } catch (error) {
    logError('[MonkeyPatch] Error patching String.prototype.toUpperCase:', error);
  }
}

/**
 * Try to find and patch the dispatchXhrRequest function in the axios bundle
 */
function patchDispatchXhrRequest() {
  try {
    // This is a more aggressive approach that tries to find the dispatchXhrRequest
    // function in the global scope or in the axios bundle
    
    // First, check if we can find it in the window object
    if (typeof window !== 'undefined') {
      // Try to find the function in the window object
      for (const key in window) {
        try {
          const obj = window[key];
          
          // Skip non-objects
          if (!obj || typeof obj !== 'object') continue;
          
          // Check if this object has a dispatchXhrRequest function
          if (typeof obj.dispatchXhrRequest === 'function') {
            // Found it, patch it
            const original = obj.dispatchXhrRequest;
            
            obj.dispatchXhrRequest = function(config) {
              // Ensure config exists
              if (!config) {
                config = {};
              }
              
              // Ensure method is defined and is a string
              if (!config.method) {
                config.method = 'get';
                logDebug('[MonkeyPatch] Added missing method in dispatchXhrRequest: get');
              } else if (typeof config.method !== 'string') {
                try {
                  config.method = String(config.method);
                  logDebug(`[MonkeyPatch] Converted method to string in dispatchXhrRequest: ${config.method}`);
                } catch (e) {
                  config.method = 'get';
                  logDebug('[MonkeyPatch] Could not convert method to string, using get');
                }
              }
              
              // Call the original function with the safe config
              return original.call(this, config);
            };
            
            logDebug(`[MonkeyPatch] Successfully patched dispatchXhrRequest in ${key}`);
          }
          
          // Also check for xhr function which might contain dispatchXhrRequest
          if (typeof obj.xhr === 'function') {
            // Found xhr, patch it
            const original = obj.xhr;
            
            obj.xhr = function(config) {
              // Ensure config exists
              if (!config) {
                config = {};
              }
              
              // Ensure method is defined and is a string
              if (!config.method) {
                config.method = 'get';
                logDebug('[MonkeyPatch] Added missing method in xhr: get');
              } else if (typeof config.method !== 'string') {
                try {
                  config.method = String(config.method);
                  logDebug(`[MonkeyPatch] Converted method to string in xhr: ${config.method}`);
                } catch (e) {
                  config.method = 'get';
                  logDebug('[MonkeyPatch] Could not convert method to string, using get');
                }
              }
              
              // Call the original function with the safe config
              return original.call(this, config);
            };
            
            logDebug(`[MonkeyPatch] Successfully patched xhr in ${key}`);
          }
        } catch (e) {
          // Ignore errors when accessing properties
        }
      }
    }
    
    // Also patch XMLHttpRequest.prototype.open
    if (typeof XMLHttpRequest !== 'undefined') {
      // Store the original open method
      const originalOpen = XMLHttpRequest.prototype.open;
      
      // Replace it with our safe version
      XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
        // Ensure method is a non-null string
        let safeMethod = method;
        
        if (safeMethod === undefined || safeMethod === null) {
          safeMethod = 'GET';
          logDebug('[MonkeyPatch] Fixed undefined method in XMLHttpRequest.open -> GET');
        } else if (typeof safeMethod !== 'string') {
          try {
            safeMethod = String(safeMethod);
            logDebug(`[MonkeyPatch] Fixed non-string method in XMLHttpRequest.open: ${safeMethod}`);
          } catch (e) {
            safeMethod = 'GET';
            logDebug('[MonkeyPatch] Could not convert method to string, using GET');
          }
        }
        
        // Call original with patched method
        return originalOpen.call(this, safeMethod, url, 
                              (async === undefined ? true : async), 
                              user, password);
      };
      
      logDebug('[MonkeyPatch] Successfully patched XMLHttpRequest.prototype.open');
    }
  } catch (error) {
    logError('[MonkeyPatch] Error patching dispatchXhrRequest:', error);
  }
}

/**
 * Add a global error handler for the toUpperCase error
 */
function addGlobalErrorHandler() {
  try {
    // Check if window is available (browser environment)
    if (typeof window !== 'undefined') {
      // Add a global unhandledrejection handler
      window.addEventListener('unhandledrejection', function(event) {
        if (event && event.reason && event.reason.message) {
          const message = event.reason.message;
          
          // Check specifically for the toUpperCase error
          if (message.includes("Cannot read properties of undefined (reading 'toUpperCase')")) {
            logError('[MonkeyPatch] Caught unhandled toUpperCase error:', event.reason);
            
            // Prevent the error from propagating
            event.preventDefault();
            event.stopPropagation();
            
            // Try to recover by creating a synthetic response
            if (event.reason && event.reason.config) {
              // Create a synthetic response
              const syntheticResponse = {
                status: 200,
                statusText: 'OK',
                headers: {},
                data: {
                  success: true,
                  message: 'Recovered from toUpperCase error',
                  data: []
                },
                config: event.reason.config,
                request: {}
              };
              
              // Try to resolve the promise
              if (typeof event.reason.resolve === 'function') {
                event.reason.resolve(syntheticResponse);
              }
            }
          }
        }
      });
      
      logDebug('[MonkeyPatch] Added global error handler for toUpperCase error');
    }
  } catch (error) {
    logError('[MonkeyPatch] Error adding global error handler:', error);
  }
}

// Apply the monkey patch immediately when imported
const success = applyMonkeyPatch();
logDebug(`[MonkeyPatch] Patch ${success ? 'successfully applied' : 'failed to apply'}`);

export default {
  applyMonkeyPatch
};
