/**
 * Logging Interceptor
 * 
 * Handles request and response logging for HTTP operations:
 * - Request logging with method, URL, headers
 * - Response logging with status, timing, data size
 * - Configurable verbosity levels
 * - Development-specific logging enhancements
 */

import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Log request details
 * @param {Object} config - Axios request config
 */
function logRequest(config) {
  try {
    const { method, url, params, data } = config;
    
    // Create a clean log object without sensitive data
    const logData = {
      method: method?.toUpperCase(),
      url,
      hasParams: !!params && Object.keys(params).length > 0,
      hasData: !!data,
      timestamp: new Date().toISOString()
    };
    
    // Add parameter count if present
    if (params) {
      logData.paramCount = Object.keys(params).length;
    }
    
    // Add data size if present
    if (data) {
      logData.dataSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    }
    
    logDebug(`[LoggingInterceptor] → ${logData.method} ${logData.url}`, logData);
  } catch (error) {
    logError('[LoggingInterceptor] Error logging request:', error);
  }
}

/**
 * Log response details
 * @param {Object} response - Axios response object
 */
function logResponse(response) {
  try {
    const { status, statusText, config, data } = response;
    const { method, url } = config;
    
    // Calculate response time if available
    const startTime = config._startTime;
    const responseTime = startTime ? Date.now() - startTime : null;
    
    // Create a clean log object
    const logData = {
      method: method?.toUpperCase(),
      url,
      status,
      statusText,
      timestamp: new Date().toISOString()
    };
    
    // Add response time if calculated
    if (responseTime !== null) {
      logData.responseTime = `${responseTime}ms`;
    }
    
    // Add data size if present
    if (data) {
      logData.dataSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    }
    
    // Add mock response indicator if applicable
    if (response.isFromCache) {
      logData.source = 'cache';
    } else if (response.usedMockResponse) {
      logData.source = 'mock';
    }
    
    // Use different log levels based on status
    if (status >= 400) {
      logError(`[LoggingInterceptor] ← ${logData.method} ${logData.url} (${status})`, logData);
    } else {
      logDebug(`[LoggingInterceptor] ← ${logData.method} ${logData.url} (${status})`, logData);
    }
  } catch (error) {
    logError('[LoggingInterceptor] Error logging response:', error);
  }
}

/**
 * Log request error details
 * @param {Object} error - Axios error object
 */
function logRequestError(error) {
  try {
    const { config, response, message } = error;
    
    const logData = {
      method: config?.method?.toUpperCase(),
      url: config?.url,
      status: response?.status,
      message,
      timestamp: new Date().toISOString()
    };
    
    // Calculate response time if available
    const startTime = config?._startTime;
    if (startTime) {
      logData.responseTime = `${Date.now() - startTime}ms`;
    }
    
    // Add error type information
    if (error.isAxiosError) {
      logData.errorType = 'axios';
    }
    
    if (error.isNetworkError) {
      logData.errorType = 'network';
    }
    
    if (error.isOfflineError) {
      logData.errorType = 'offline';
    }
    
    logError(`[LoggingInterceptor] ✖ ${logData.method} ${logData.url}`, logData);
  } catch (logError) {
    logError('[LoggingInterceptor] Error logging request error:', logError);
  }
}

/**
 * Add timing information to request config
 * @param {Object} config - Axios request config
 * @returns {Object} - Modified request config
 */
function addRequestTiming(config) {
  // Add start time for response time calculation
  config._startTime = Date.now();
  return config;
}

/**
 * Get request summary for debugging
 * @param {Object} config - Axios request config
 * @returns {string} - Request summary string
 */
export function getRequestSummary(config) {
  const { method, url, params, data } = config;
  let summary = `${method?.toUpperCase()} ${url}`;
  
  if (params && Object.keys(params).length > 0) {
    summary += ` (${Object.keys(params).length} params)`;
  }
  
  if (data) {
    const dataSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    summary += ` [${dataSize} bytes]`;
  }
  
  return summary;
}

/**
 * Get response summary for debugging
 * @param {Object} response - Axios response object
 * @returns {string} - Response summary string
 */
export function getResponseSummary(response) {
  const { status, statusText, config, data } = response;
  const { method, url } = config;
  
  let summary = `${method?.toUpperCase()} ${url} → ${status} ${statusText}`;
  
  if (data) {
    const dataSize = typeof data === 'string' ? data.length : JSON.stringify(data).length;
    summary += ` [${dataSize} bytes]`;
  }
  
  const startTime = config._startTime;
  if (startTime) {
    const responseTime = Date.now() - startTime;
    summary += ` (${responseTime}ms)`;
  }
  
  return summary;
}

/**
 * Get error summary for debugging
 * @param {Object} error - Axios error object
 * @returns {string} - Error summary string
 */
export function getErrorSummary(error) {
  const { config, response, message } = error;
  const method = config?.method?.toUpperCase() || 'UNKNOWN';
  const url = config?.url || 'unknown';
  const status = response?.status;
  
  let summary = `${method} ${url}`;
  
  if (status) {
    summary += ` → ${status}`;
  }
  
  if (message) {
    summary += ` (${message})`;
  }
  
  return summary;
}

/**
 * Setup logging interceptor for an axios instance
 * @param {Object} axiosInstance - Axios instance to configure
 * @param {Object} options - Configuration options
 */
export function setupLoggingInterceptor(axiosInstance, options = {}) {
  const { 
    enabled = process.env.NODE_ENV === 'development',
    logRequests = true,
    logResponses = true,
    logErrors = true,
    addTiming = true
  } = options;
  
  if (!enabled) {
    logDebug('[LoggingInterceptor] Request/response logging disabled');
    return;
  }
  
  // Request interceptor for logging and timing
  axiosInstance.interceptors.request.use(
    (config) => {
      if (addTiming) {
        config = addRequestTiming(config);
      }
      
      if (logRequests) {
        logRequest(config);
      }
      
      return config;
    },
    (error) => {
      if (logErrors) {
        logRequestError(error);
      }
      return Promise.reject(error);
    }
  );
  
  // Response interceptor for logging
  axiosInstance.interceptors.response.use(
    (response) => {
      if (logResponses) {
        logResponse(response);
      }
      return response;
    },
    (error) => {
      if (logErrors) {
        logRequestError(error);
      }
      return Promise.reject(error);
    }
  );
  
  logDebug('[LoggingInterceptor] Request/response logging configured', {
    logRequests,
    logResponses,
    logErrors,
    addTiming
  });
}
