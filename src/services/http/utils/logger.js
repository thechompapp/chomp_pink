/**
 * Logger utility for HTTP requests and responses
 */

/**
 * Log debug message
 * @param {string} message - Message to log
 * @param {Object} [data] - Additional data to log
 */
export const logDebug = (message, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[HTTP] ${message}`, data || '');
  }
};

/**
 * Log info message
 * @param {string} message - Message to log
 * @param {Object} [data] - Additional data to log
 */
export const logInfo = (message, data) => {
  console.info(`[HTTP] ${message}`, data || '');
};

/**
 * Log warning message
 * @param {string} message - Message to log
 * @param {Object} [data] - Additional data to log
 */
export const logWarn = (message, data) => {
  console.warn(`[HTTP] ${message}`, data || '');
};

/**
 * Log error message
 * @param {string} message - Message to log
 * @param {Error} [error] - Error object to log
 */
export const logError = (message, error) => {
  console.error(`[HTTP] ${message}`, error || '');
};

/**
 * Log request details
 * @param {Object} config - Axios request config
 */
export const logRequest = (config) => {
  const { method, url, params, data, baseURL } = config;
  const fullUrl = baseURL ? new URL(url, baseURL).href : url;
  
  logDebug(`→ ${method?.toUpperCase()} ${fullUrl}`, {
    params,
    data: data && typeof data === 'object' ? data : '[Data]'
  });
};

/**
 * Log response details
 * @param {Object} response - Axios response
 */
export const logResponse = (response) => {
  const { config, status, statusText, data } = response;
  const { method, url } = config;
  
  logDebug(`← ${status} ${method?.toUpperCase()} ${url}`, {
    status,
    statusText,
    data: data && typeof data === 'object' ? data : '[Data]'
  });
};
