/**
 * Axios Patch Module
 * 
 * This module patches the Axios library to fix the TypeError: Cannot read properties of undefined (reading 'toUpperCase')
 * by ensuring that the method property is always defined as a string before it's used.
 */

// Apply the patch to an axios instance
export function patchAxiosInstance(axiosInstance) {
  // Store the original request method
  const originalRequest = axiosInstance.request;
  
  // Override the request method to ensure method is always a string
  axiosInstance.request = function(config) {
    // Create a new config object to avoid modifying the original
    const safeConfig = { ...config };
    
    // Ensure method is defined and is a string
    if (!safeConfig.method) {
      safeConfig.method = 'get';
    } else if (typeof safeConfig.method !== 'string') {
      safeConfig.method = String(safeConfig.method);
    }
    
    // Call the original request method with the safe config
    return originalRequest.call(this, safeConfig);
  };
  
  // DO NOT patch the adapter - it's causing issues
  // Just patch the request method which is safer
  
  return axiosInstance;
}

// Apply the patch to the global axios object
export function patchGlobalAxios(axios) {
  if (!axios) return;
  
  // Store the original create method
  const originalCreate = axios.create;
  
  // Override the create method to patch new instances
  axios.create = function(...args) {
    // Create the instance using the original method
    const instance = originalCreate.apply(this, args);
    
    // Patch the new instance
    return patchAxiosInstance(instance);
  };
  
  // Patch the global axios instance as well
  patchAxiosInstance(axios);
  
  return axios;
}

export default {
  patchAxiosInstance,
  patchGlobalAxios
};
