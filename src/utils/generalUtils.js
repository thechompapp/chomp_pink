/**
 * General Utilities
 * 
 * Common utility functions used across the application
 */

import { logDebug, logError } from './logger';

/**
 * Configuration constants
 */
export const APP_CONFIG = {
  batchSize: 10,
  defaultCityId: 1,
  retryAttempts: 3,
  retryDelay: 1000
};

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of the function
 */
export const retryWithBackoff = async (fn, maxAttempts = APP_CONFIG.retryAttempts, baseDelay = APP_CONFIG.retryDelay) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        logError(`[retryWithBackoff] All ${maxAttempts} attempts failed:`, error);
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logDebug(`[retryWithBackoff] Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Process items in batches
 * @param {Array} items - Items to process
 * @param {Function} processor - Function to process each batch
 * @param {number} batchSize - Size of each batch
 * @param {Function} progressCallback - Optional progress callback
 * @returns {Promise<Array>} Results from all batches
 */
export const batchProcess = async (items, processor, batchSize = APP_CONFIG.batchSize, progressCallback = null) => {
  const results = [];
  const totalBatches = Math.ceil(items.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, items.length);
    const batch = items.slice(start, end);
    
    logDebug(`[batchProcess] Processing batch ${i + 1}/${totalBatches} (${batch.length} items)`);
    
    try {
      const batchResult = await processor(batch);
      results.push(...(Array.isArray(batchResult) ? batchResult : [batchResult]));
      
      if (progressCallback) {
        const progress = ((i + 1) / totalBatches) * 100;
        progressCallback(progress);
      }
    } catch (error) {
      logError(`[batchProcess] Error processing batch ${i + 1}:`, error);
      throw error;
    }
  }
  
  return results;
};

/**
 * Parse input text into structured data
 * @param {string} text - Raw input text
 * @returns {Array} Parsed items
 */
export const parseInputText = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const parts = line.split(',').map(part => part.trim());
      
      if (parts.length >= 2) {
        return {
          name: parts[0],
          address: parts[1],
          city: parts[2] || '',
          state: parts[3] || '',
          zip: parts[4] || ''
        };
      }
      
      return {
        name: line,
        address: '',
        city: '',
        state: '',
        zip: ''
      };
    });
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}; 