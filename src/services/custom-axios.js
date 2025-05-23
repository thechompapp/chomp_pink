/**
 * Custom Axios Instance
 * 
 * This module creates a completely custom axios instance with a safe adapter
 * that doesn't rely on the problematic dispatchXhrRequest function.
 * 
 * It completely bypasses the issue with "Cannot read properties of undefined (reading 'toUpperCase')"
 * by using a custom implementation of the XHR adapter.
 */

import axios from 'axios';
import { logDebug, logError, logWarn } from '@/utils/logger';

// Create a completely custom XHR adapter that doesn't use dispatchXhrRequest
function safeXhrAdapter(config) {
  return new Promise((resolve, reject) => {
    try {
      // Extract request data and headers
      const requestData = config.data;
      const requestHeaders = config.headers || {};
      
      // Ensure method is defined and is a string
      if (!config.method) {
        config.method = 'get';
        logDebug('[CustomAxios] Added missing method: get');
      } else if (typeof config.method !== 'string') {
        try {
          config.method = String(config.method);
          logDebug(`[CustomAxios] Converted method to string: ${config.method}`);
        } catch (e) {
          config.method = 'get';
          logDebug('[CustomAxios] Could not convert method to string, using get');
        }
      }
      
      // Convert method to uppercase safely
      let requestMethod;
      try {
        requestMethod = config.method.toUpperCase();
      } catch (e) {
        requestMethod = 'GET';
        logDebug('[CustomAxios] Error in toUpperCase, using GET');
      }
      
      // Create the request
      const request = new XMLHttpRequest();
      
      // Open the request
      request.open(
        requestMethod,
        config.url,
        true,
        config.auth ? config.auth.username : undefined,
        config.auth ? config.auth.password : undefined
      );
      
      // Set the timeout
      request.timeout = config.timeout || 0;
      
      // Set up onload handler
      request.onreadystatechange = function() {
        if (!request || request.readyState !== 4) {
          return;
        }
        
        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        if (request.status === 0 && !request.responseURL) {
          return;
        }
        
        // Prepare the response
        const responseHeaders = parseHeaders(request.getAllResponseHeaders());
        let responseData;
        
        try {
          // Try to parse response as JSON if possible
          if (request.responseType === 'json' || config.responseType === 'json') {
            if (request.responseText) {
              try {
                responseData = JSON.parse(request.responseText);
              } catch (e) {
                responseData = request.responseText;
              }
            } else {
              responseData = {};
            }
          } else {
            responseData = request.response || request.responseText;
          }
        } catch (e) {
          responseData = request.responseText;
        }
        
        // Create the response object
        const response = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config: config,
          request: request
        };
        
        // Resolve or reject based on status
        if (request.status >= 200 && request.status < 300) {
          resolve(response);
        } else {
          reject(createError(
            'Request failed with status code ' + request.status,
            config,
            null,
            request,
            response
          ));
        }
      };
      
      // Handle network errors
      request.onerror = function() {
        reject(createError('Network Error', config, null, request));
      };
      
      // Handle timeout
      request.ontimeout = function() {
        reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', request));
      };
      
      // Add xsrf header
      // This is only done if running in a standard browser environment.
      if (typeof document !== 'undefined' && typeof document.cookie !== 'undefined') {
        const xsrfValue = config.withCredentials || isURLSameOrigin(config.url) ?
          config.xsrfCookieName && getCookie(config.xsrfCookieName) :
          undefined;
        
        if (xsrfValue) {
          requestHeaders[config.xsrfHeaderName] = xsrfValue;
        }
      }
      
      // Add headers to the request
      Object.keys(requestHeaders).forEach(function(key) {
        // If the request data is undefined and the content type is application/x-www-form-urlencoded,
        // remove the content-type header
        if (requestData === undefined && key.toLowerCase() === 'content-type' && 
            requestHeaders[key].toLowerCase().indexOf('application/x-www-form-urlencoded') !== -1) {
          delete requestHeaders[key];
        } else {
          // Otherwise, add the header
          request.setRequestHeader(key, requestHeaders[key]);
        }
      });
      
      // Add withCredentials to request if needed
      if (config.withCredentials) {
        request.withCredentials = true;
      }
      
      // Add responseType to request if needed
      if (config.responseType) {
        try {
          request.responseType = config.responseType;
        } catch (e) {
          // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
          // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
          if (config.responseType !== 'json') {
            throw e;
          }
        }
      }
      
      // Send the request
      request.send(requestData || null);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Parse headers string into an object
 * 
 * @param {string} headers - Headers string
 * @returns {Object} - Headers object
 */
function parseHeaders(headers) {
  const parsed = {};
  let key;
  let val;
  let i;
  
  if (!headers) {
    return parsed;
  }
  
  headers.split('\\n').forEach(function(line) {
    i = line.indexOf(':');
    key = line.substr(0, i).trim().toLowerCase();
    val = line.substr(i + 1).trim();
    
    if (key) {
      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
    }
  });
  
  return parsed;
}

/**
 * Create an error object
 * 
 * @param {string} message - Error message
 * @param {Object} config - Request config
 * @param {string} code - Error code
 * @param {Object} request - XMLHttpRequest object
 * @param {Object} response - Response object
 * @returns {Error} - Error object
 */
function createError(message, config, code, request, response) {
  const error = new Error(message);
  error.config = config;
  error.code = code;
  error.request = request;
  error.response = response;
  error.isAxiosError = true;
  
  error.toJSON = function() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  };
  
  return error;
}

/**
 * Check if URL is same origin
 * 
 * @param {string} url - URL to check
 * @returns {boolean} - Whether URL is same origin
 */
function isURLSameOrigin(url) {
  // URL has the same origin if the URL's origin matches the current origin
  if (typeof URL === 'function') {
    try {
      const parsedUrl = new URL(url, window.location.href);
      return parsedUrl.origin === window.location.origin;
    } catch (e) {
      // If URL parsing fails, assume it's not same origin
      return false;
    }
  }
  
  // Fallback for older browsers
  const urlParsingNode = document.createElement('a');
  urlParsingNode.href = url;
  
  return (
    urlParsingNode.protocol === window.location.protocol &&
    urlParsingNode.host === window.location.host
  );
}

/**
 * Get cookie value
 * 
 * @param {string} name - Cookie name
 * @returns {string} - Cookie value
 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|;\\\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

// Create a custom axios instance with our safe adapter
const customAxios = axios.create({
  adapter: safeXhrAdapter
});

// Also patch the original axios instance
axios.defaults.adapter = safeXhrAdapter;

// Export both the custom instance and the patched original
export { customAxios, axios };

// Also export as default
export default customAxios;
