/**
 * Unified Axios Fix Module
 * 
 * This module fixes the "Cannot read properties of undefined (reading 'toUpperCase')" error
 * by ensuring the method parameter is always properly defined as a string.
 * 
 * This consolidates fixes from multiple previous files:
 * - axios-method-fix.js
 * - axios-patch.js
 * - axios-simple-fix.js
 * - axiosXhrFixer.js
 * - axios-init.js
 */

import axios from 'axios';

// Store original axios methods
const originalRequest = axios.request;
const originalGet = axios.get;
const originalPost = axios.post;
const originalPut = axios.put;
const originalPatch = axios.patch;
const originalDelete = axios.delete;

// Fix axios.request method
axios.request = function(config) {
  if (typeof config === 'string') {
    return originalRequest({ url: config, method: 'get' });
  }
  
  // Ensure method is defined and is a string
  if (!config) {
    config = { method: 'get' };
  } else if (!config.method) {
    config.method = 'get';
  } else if (typeof config.method !== 'string') {
    try {
      config.method = String(config.method).toLowerCase();
    } catch (e) {
      config.method = 'get';
      console.warn('Failed to convert method to string, defaulting to GET');
    }
  }
  
  return originalRequest(config);
};

// Fix axios.get method
axios.get = function(url, config = {}) {
  return axios.request({ ...config, url, method: 'get' });
};

// Fix axios.post method
axios.post = function(url, data, config = {}) {
  return axios.request({ ...config, url, method: 'post', data });
};

// Fix axios.put method
axios.put = function(url, data, config = {}) {
  return axios.request({ ...config, url, method: 'put', data });
};

// Fix axios.patch method
axios.patch = function(url, data, config = {}) {
  return axios.request({ ...config, url, method: 'patch', data });
};

// Fix axios.delete method
axios.delete = function(url, config = {}) {
  return axios.request({ ...config, url, method: 'delete' });
};

// Fix axios instance creation to apply the same fixes
const originalCreate = axios.create;
axios.create = function(config) {
  const instance = originalCreate(config);
  
  // Apply the same fixes to the instance methods
  const originalInstanceRequest = instance.request;
  
  instance.request = function(instanceConfig) {
    if (typeof instanceConfig === 'string') {
      return originalInstanceRequest({ url: instanceConfig, method: 'get' });
    }
    
    // Ensure method is defined and is a string
    if (!instanceConfig) {
      instanceConfig = { method: 'get' };
    } else if (!instanceConfig.method) {
      instanceConfig.method = 'get';
    } else if (typeof instanceConfig.method !== 'string') {
      try {
        instanceConfig.method = String(instanceConfig.method).toLowerCase();
      } catch (e) {
        instanceConfig.method = 'get';
        console.warn('Failed to convert method to string, defaulting to GET');
      }
    }
    
    return originalInstanceRequest(instanceConfig);
  };
  
  // Fix instance methods
  instance.get = function(url, config = {}) {
    return instance.request({ ...config, url, method: 'get' });
  };
  
  instance.post = function(url, data, config = {}) {
    return instance.request({ ...config, url, method: 'post', data });
  };
  
  instance.put = function(url, data, config = {}) {
    return instance.request({ ...config, url, method: 'put', data });
  };
  
  instance.patch = function(url, data, config = {}) {
    return instance.request({ ...config, url, method: 'patch', data });
  };
  
  instance.delete = function(url, config = {}) {
    return instance.request({ ...config, url, method: 'delete' });
  };
  
  return instance;
};

export default axios;
