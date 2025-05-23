/**
 * Axios Patch Module
 * 
 * This module patches the Axios library to fix the TypeError: Cannot read properties of undefined (reading 'toUpperCase')
 * by ensuring that the method property is always defined as a string before it's used.
 * 
 * This is a comprehensive patch that fixes the issue at multiple levels:
 * 1. At the request level - ensures method is defined before making a request
 * 2. At the adapter level - ensures method is defined before passing to the adapter
 * 3. At the XHR level - ensures method is a string when opening an XHR request
 * 4. Provides a safe wrapper for dispatchXhrRequest - the source of most toUpperCase errors
 */

// Safe wrapper for dispatchXhrRequest function
function createSafeDispatcher(originalDispatch) {
  return function safeDispatchXhrRequest(config) {
    try {
      // Ensure config exists
      if (!config) {
        console.error('[AxiosPatch] Missing config in dispatchXhrRequest');
        config = {};
      }
      
      // Ensure method is defined and is a string
      if (!config.method) {
        config.method = 'get';
        console.debug('[AxiosPatch] Added missing method in dispatcher: get');
      } else if (typeof config.method !== 'string') {
        config.method = String(config.method);
        console.debug(`[AxiosPatch] Converted method to string in dispatcher: ${config.method}`);
      }
      
      return originalDispatch(config);
    } catch (error) {
      console.error('[AxiosPatch] Error in safeDispatchXhrRequest:', error);
      throw error;
    }
  };
}

// Apply the patch to an axios instance
export function patchAxiosInstance(axiosInstance) {
  if (!axiosInstance) {
    console.warn('[AxiosPatch] Invalid axios instance provided');
    return null;
  }
  
  try {
    // Store the original request method
    const originalRequest = axiosInstance.request;
    
    // Override the request method to ensure method is always a string
    axiosInstance.request = function(config) {
      try {
        // Handle case where config is a string (url)
        if (typeof config === 'string') {
          config = {
            url: config,
            method: 'get'
          };
        }
        
        // Create a new config object to avoid modifying the original
        const safeConfig = { ...config };
        
        // Ensure method is defined and is a string
        if (!safeConfig.method) {
          safeConfig.method = 'get';
          console.debug('[AxiosPatch] Added missing method: get');
        } else if (typeof safeConfig.method !== 'string') {
          safeConfig.method = String(safeConfig.method);
          console.debug(`[AxiosPatch] Converted method to string: ${safeConfig.method}`);
        }
        
        // Call the original request method with the safe config
        return originalRequest.call(this, safeConfig);
      } catch (error) {
        console.error('[AxiosPatch] Error in patched request:', error);
        throw error;
      }
    };
  } catch (error) {
    console.error('[AxiosPatch] Error patching axios instance:', error);
  }
  
  try {
    // Fix for the adapter issue - patch adapter-level method by overriding defaults.adapter
    if (axiosInstance.defaults && typeof axiosInstance.defaults.adapter === 'function') {
      const originalAdapter = axiosInstance.defaults.adapter;
      
      // Override the adapter to ensure method is defined
      axiosInstance.defaults.adapter = function(config) {
        try {
          // Create a new config to avoid modifying the original
          const safeConfig = { ...config };
          
          // Ensure method is defined and is a string
          if (!safeConfig.method) {
            safeConfig.method = 'get';
            console.debug('[AxiosPatch] Added missing method in adapter: get');
          } else if (typeof safeConfig.method !== 'string') {
            safeConfig.method = String(safeConfig.method);
            console.debug(`[AxiosPatch] Converted method to string in adapter: ${safeConfig.method}`);
          }
          
          // Call the original adapter with the safe config
          return originalAdapter(safeConfig);
        } catch (error) {
          console.error('[AxiosPatch] Error in adapter patch:', error);
          throw error;
        }
      };
    }
  } catch (error) {
    console.error('[AxiosPatch] Error patching adapter:', error);
  }
  // Patch http and xhr adapters to ensure method is always defined before toUpperCase is called
  try {
    // Try to find the xhr adapter in the codebase
    const xhrAdapter = axiosInstance.defaults.adapter || axiosInstance.constructor?.defaults?.adapter;
    
    if (xhrAdapter && typeof xhrAdapter === 'function') {
      // Use Function.toString() to check if this adapter contains dispatchXhrRequest
      const adapterSource = xhrAdapter.toString();
      
      // If this looks like it contains xhr functionality, monkey patch it
      if (adapterSource.includes('dispatchXhrRequest') || adapterSource.includes('xhr')) {
        console.debug('[AxiosPatch] Attempting to patch XHR adapter');
        
        // If this instance uses dispatchXhrRequest, patch that too
        // Since we can't directly access it, we use a global patch approach
        if (typeof window !== 'undefined' && window.XMLHttpRequest) {
          const originalXMLHttpRequest = window.XMLHttpRequest;
          const originalOpen = originalXMLHttpRequest.prototype.open;
          
          // Patch the XMLHttpRequest.open method to ensure method is a string
          XMLHttpRequest.prototype.open = function(...args) {
            try {
              // Method is always the first argument to open
              let [method, ...otherArgs] = args;
              
              // Ensure method is a string
              if (method === undefined || method === null) {
                method = 'GET';
                console.debug('[AxiosPatch] XMLHttpRequest.open: Added missing method: GET');
              } else if (typeof method !== 'string') {
                method = String(method);
                console.debug(`[AxiosPatch] XMLHttpRequest.open: Converted method to string: ${method}`);
              }
              
              // Call original with safe method
              return originalOpen.call(this, method, ...otherArgs);
            } catch (error) {
              console.error('[AxiosPatch] Error in XMLHttpRequest.open patch:', error);
              // Fall back to original implementation
              return originalOpen.apply(this, args);
            }
          };
        }
      }
    }
  } catch (e) {
    console.warn('[AxiosPatch] Error patching XHR adapter:', e);
  }
  
  return axiosInstance;
}

// Apply the patch to the global axios object
export function patchGlobalAxios(axios) {
  if (!axios) {
    console.warn('[AxiosPatch] No axios instance provided to patchGlobalAxios');
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
        console.error('[AxiosPatch] Error patching axios.create:', error);
        // Fall back to original implementation
        return originalCreate.apply(this, args);
      }
    };
    
    // Try to monkey patch any relevant modules in the global scope
    if (typeof window !== 'undefined') {
      // Make sure XMLHttpRequest.prototype.open uses a string method
      if (window.XMLHttpRequest) {
        const originalOpen = window.XMLHttpRequest.prototype.open;
        
        window.XMLHttpRequest.prototype.open = function(...args) {
          try {
            let [method, ...restArgs] = args;
            
            // Always ensure method is a valid string
            if (method === undefined || method === null) {
              method = 'GET';
              console.debug('[AxiosPatch] XMLHttpRequest.open: Added missing method: GET');
            } else if (typeof method !== 'string') {
              method = String(method);
              console.debug(`[AxiosPatch] XMLHttpRequest.open: Converted method to string: ${method}`);
            }
            
            return originalOpen.call(this, method, ...restArgs);
          } catch (error) {
            console.error('[AxiosPatch] Error in XMLHttpRequest.open patch:', error);
            // Fall back to original implementation
            return originalOpen.apply(this, args);
          }
        };
      }
    }
    
    console.debug('[AxiosPatch] Successfully patched global axios');
    return axios;
  } catch (error) {
    console.error('[AxiosPatch] Error patching global axios:', error);
    return axios; // Return the original axios instance if patching fails
  }
}

export default {
  patchAxiosInstance,
  patchGlobalAxios
};
