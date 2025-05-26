/**
 * API Error Utilities
 *
 * Provides utilities for handling API errors:
 * - Error enhancement
 * - Error classification
 * - Error message extraction
 */

import { logError, logWarn } from '@/utils/logger';

/**
 * Enhance an error with additional context
 * 
 * @param {Error} error - Original error
 * @param {Object} context - Additional context
 * @returns {Error} Enhanced error
 */
export function enhanceError(error, context = {}) {
  if (!error) {
    return new Error('Unknown error');
  }

  // Create a new error to avoid modifying the original
  const enhancedError = new Error(error.message || 'API request failed');
  
  // Copy properties from the original error
  Object.getOwnPropertyNames(error).forEach(prop => {
    if (prop !== 'stack') {
      enhancedError[prop] = error[prop];
    }
  });
  
  // Add context
  enhancedError.context = {
    ...(error.context || {}),
    ...context
  };
  
  // Add timestamp
  enhancedError.timestamp = new Date().toISOString();
  
  // Add error classification
  enhancedError.errorType = classifyError(error);
  
  return enhancedError;
}

/**
 * Classify an error by type
 * 
 * @param {Error} error - Error to classify
 * @returns {string} Error type
 */
export function classifyError(error) {
  if (!error) {
    return 'unknown';
  }
  
  // Check for network errors
  if (error.message && (
    error.message.includes('Network Error') ||
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('timeout')
  )) {
    return 'network';
  }
  
  // Check for authentication errors
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    return 'auth';
  }
  
  // Check for server errors
  if (error.response && error.response.status >= 500) {
    return 'server';
  }
  
  // Check for client errors
  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    return 'client';
  }
  
  // Check for URL errors
  if (error.message && (
    error.message.includes('undefined (reading \'url\')') ||
    error.message.includes('URL is required')
  )) {
    return 'url';
  }
  
  // Check for method errors
  if (error.message && (
    error.message.includes('undefined (reading \'toUpperCase\')') ||
    error.message.includes('Method is required')
  )) {
    return 'method';
  }
  
  // Default to unknown
  return 'unknown';
}

/**
 * Extract a user-friendly message from an error
 * 
 * @param {Error} error - Error to extract message from
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error) {
  if (!error) {
    return 'An unknown error occurred';
  }
  
  // Check for network errors
  if (classifyError(error) === 'network') {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Check for authentication errors
  if (classifyError(error) === 'auth') {
    return 'Authentication error. Please log in again.';
  }
  
  // Check for server errors
  if (classifyError(error) === 'server') {
    return 'Server error. Please try again later.';
  }
  
  // Check for client errors
  if (classifyError(error) === 'client') {
    // Try to extract error message from response
    if (error.response && error.response.data && error.response.data.message) {
      return error.response.data.message;
    }
    
    return 'Request error. Please check your input and try again.';
  }
  
  // Check for URL errors
  if (classifyError(error) === 'url') {
    return 'API configuration error. Please contact support.';
  }
  
  // Check for method errors
  if (classifyError(error) === 'method') {
    return 'API configuration error. Please contact support.';
  }
  
  // Default to original message or generic error
  return error.message || 'An error occurred';
}

/**
 * Log an error with context
 * 
 * @param {Error} error - Error to log
 * @param {string} context - Context for the error
 */
export function logApiError(error, context = 'API') {
  if (!error) {
    logError(`[${context}] Unknown error`);
    return;
  }
  
  const errorType = classifyError(error);
  const errorContext = error.context || {};
  
  logError(`[${context}] ${errorType} error: ${error.message}`, {
    url: errorContext.url || 'unknown',
    method: errorContext.method || 'unknown',
    status: error.response?.status,
    data: error.response?.data,
    stack: error.stack
  });
}

export default {
  enhanceError,
  classifyError,
  getUserFriendlyMessage,
  logApiError
};
