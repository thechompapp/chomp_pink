/**
 * Axios Method Fix
 * 
 * This module provides a targeted fix for the "Cannot read properties of undefined (reading 'toUpperCase')" error
 * by ensuring the method property is always defined as a string in axios requests.
 * 
 * This is a simpler, more focused approach that should be compatible with the existing codebase.
 */

import axios from 'axios';
import { logDebug, logError } from '@/utils/logger';

/**
 * Apply a targeted fix to axios to ensure the method property is always defined
 */
export function applyMethodFix() {
  try {
    // Store the original request method
    const originalRequest = axios.request;
    
    // Replace it with our safe version
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
      
      // Call the original request method with the safe config
      return originalRequest.call(this, config);
    };
    
    // Also patch the shorthand methods
    ['get', 'post', 'put', 'delete', 'head', 'options', 'patch'].forEach(method => {
      const original = axios[method];
      
      axios[method] = function() {
        // Create a safe config
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
        
        // Ensure method is set correctly
        config.method = method;
        
        // Call the safe request method
        return axios.request(config);
      };
    });
    
    logDebug('[AxiosMethodFix] Successfully applied method fix');
    return true;
  } catch (error) {
    logError('[AxiosMethodFix] Error applying method fix:', error);
    return false;
  }
}

// Apply the fix immediately when imported
const success = applyMethodFix();
logDebug(`[AxiosMethodFix] ${success ? 'Successfully applied' : 'Failed to apply'} method fix`);

export default {
  applyMethodFix
};
