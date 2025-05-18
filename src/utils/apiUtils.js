// File: src/utils/apiUtils.js
import axios from 'axios';
import * as config from '../config'; // Corrected: Namespace import for config
import { logError, logDebug, logWarn, logInfo } from './logger';
import { parseApiError } from './parseApiError';
import { retryWithBackoff, isNetworkError } from './errorHandling';

/**
 * Creates a delay for a given amount of milliseconds.
 * @param {number} ms - The number of milliseconds to delay.
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Default configuration for API requests
 */
const DEFAULT_REQUEST_CONFIG = {
  maxRetries: config.MAX_API_RETRIES || 3,
  baseDelay: config.API_RETRY_DELAY_MS || 1000,
  shouldRetry: (error) => isNetworkError(error) || (error.response && error.response.status >= 500)
};

/**
 * Generic GET request helper with enhanced retry functionality.
 * @param {string} url - The URL to fetch.
 * @param {object} [params={}] - Query parameters.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const get = async (url, params = {}, options = {}) => {
  const requestName = options.requestName || `GET ${url}`;
  
  const apiCall = async () => {
    logDebug(`[apiUtils.get] Calling ${url} with params:`, params);
    const response = await axios.get(`${config.API_BASE_URL}${url}`, { params });
    return response.data;
  };
  
  return retryWithBackoff(apiCall, {
    ...DEFAULT_REQUEST_CONFIG,
    ...options,
    shouldRetry: options.shouldRetry || DEFAULT_REQUEST_CONFIG.shouldRetry
  });
};

/**
 * Generic POST request helper with enhanced retry functionality.
 * @param {string} url - The URL to post to.
 * @param {object} data - The data to send in the request body.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const post = async (url, data, options = {}) => {
  const requestName = options.requestName || `POST ${url}`;
  
  const apiCall = async () => {
    logDebug(`[apiUtils.post] Calling ${url} with data:`, { dataKeys: Object.keys(data || {}) });
    const response = await axios.post(`${config.API_BASE_URL}${url}`, data);
    return response.data;
  };
  
  return retryWithBackoff(apiCall, {
    ...DEFAULT_REQUEST_CONFIG,
    ...options,
    shouldRetry: options.shouldRetry || DEFAULT_REQUEST_CONFIG.shouldRetry
  });
};

/**
 * Generic PUT request helper with enhanced retry functionality.
 * @param {string} url - The URL to put to.
 * @param {object} data - The data to send in the request body.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const put = async (url, data, options = {}) => {
  const requestName = options.requestName || `PUT ${url}`;
  
  const apiCall = async () => {
    logDebug(`[apiUtils.put] Calling ${url} with data:`, { dataKeys: Object.keys(data || {}) });
    const response = await axios.put(`${config.API_BASE_URL}${url}`, data);
    return response.data;
  };
  
  return retryWithBackoff(apiCall, {
    ...DEFAULT_REQUEST_CONFIG,
    ...options,
    shouldRetry: options.shouldRetry || DEFAULT_REQUEST_CONFIG.shouldRetry
  });
};

/**
 * Generic DELETE request helper with enhanced retry functionality.
 * @param {string} url - The URL to delete.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const del = async (url, options = {}) => { // 'delete' is a reserved keyword
  const requestName = options.requestName || `DELETE ${url}`;
  
  const apiCall = async () => {
    logDebug(`[apiUtils.del] Calling ${url}`);
    const response = await axios.delete(`${config.API_BASE_URL}${url}`);
    return response.data;
  };
  
  return retryWithBackoff(apiCall, {
    ...DEFAULT_REQUEST_CONFIG,
    ...options,
    shouldRetry: options.shouldRetry || DEFAULT_REQUEST_CONFIG.shouldRetry
  });
};

/**
 * Generic PATCH request helper with enhanced retry functionality.
 * @param {string} url - The URL to patch.
 * @param {object} data - The data to send in the request body.
 * @param {object} [options={}] - Additional options for retries.
 * @returns {Promise<object>} - API response data.
 */
export const patch = async (url, data, options = {}) => {
  const requestName = options.requestName || `PATCH ${url}`;
  
  const apiCall = async () => {
    logDebug(`[apiUtils.patch] Calling ${url} with data:`, { dataKeys: Object.keys(data || {}) });
    const response = await axios.patch(`${config.API_BASE_URL}${url}`, data);
    return response.data;
  };
  
  return retryWithBackoff(apiCall, {
    ...DEFAULT_REQUEST_CONFIG,
    ...options,
    shouldRetry: options.shouldRetry || DEFAULT_REQUEST_CONFIG.shouldRetry
  });
};

// You can add other HTTP methods (HEAD, OPTIONS, etc.) if needed.