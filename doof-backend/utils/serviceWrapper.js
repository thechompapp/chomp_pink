/**
 * ServiceWrapper - Centralized service function wrapper
 * 
 * This utility provides a standardized way to wrap service methods,
 * ensuring consistent:
 * - Error handling
 * - Response formatting
 * - Logging
 * - Performance tracking
 * - Cache integration
 */
import { logDebug, logError, logInfo } from './logger.js';

/**
 * Create a wrapped service method with standardized handling
 * 
 * @param {Function} serviceMethod - The service method to wrap
 * @param {Object} options - Configuration options
 * @param {string} options.methodName - Name of method for logging
 * @param {string} options.serviceName - Name of service for logging
 * @param {boolean} options.enableCache - Whether to cache results
 * @param {number} options.cacheTTL - Cache TTL in milliseconds
 * @param {Function} options.getCacheKey - Function to generate cache key from args
 * @param {Function} options.transformResponse - Function to transform the response data
 * @returns {Function} - Wrapped service method
 */
export function createServiceMethod(serviceMethod, {
  methodName = 'unknown',
  serviceName = 'GenericService',
  enableCache = false,
  cacheTTL = 5 * 60 * 1000, // 5 minutes default
  getCacheKey = null,
  transformResponse = data => data,
} = {}) {
  // Validate inputs
  if (typeof serviceMethod !== 'function') {
    throw new Error('serviceMethod must be a function');
  }
  
  // Full context for logging
  const context = `${serviceName}.${methodName}`;
  
  // Return the wrapped method
  return async function wrappedServiceMethod(...args) {
    const startTime = Date.now();
    let cacheKey = null;
    
    try {
      // Check cache if enabled
      if (enableCache && typeof getCacheKey === 'function') {
        cacheKey = getCacheKey(...args);
        
        if (cacheKey && global.cacheManager) {
          const cachedResult = global.cacheManager.get(cacheKey);
          if (cachedResult) {
            logDebug(`[${context}] Cache hit for key: ${cacheKey}`);
            return cachedResult;
          }
          logDebug(`[${context}] Cache miss for key: ${cacheKey}`);
        }
      }
      
      // Execute the service method
      logDebug(`[${context}] Executing with args:`, 
        args.length > 0 ? JSON.stringify(args).substring(0, 200) : 'no args');
      const result = await serviceMethod(...args);
      
      // Process the result
      let response;
      if (result && typeof result === 'object' && 'success' in result) {
        // Result is already in standard format, apply any transformations
        response = {
          ...result,
          data: result.data ? transformResponse(result.data) : null
        };
      } else {
        // Format the result into standard response
        response = formatResponse(
          true,
          transformResponse(result),
          `${methodName} successful`
        );
      }
      
      // Cache the result if enabled
      if (enableCache && cacheKey && response.success && global.cacheManager) {
        global.cacheManager.set(cacheKey, response, cacheTTL);
        logDebug(`[${context}] Cached result with key: ${cacheKey}, TTL: ${cacheTTL}ms`);
      }
      
      // Log completion time
      const duration = Date.now() - startTime;
      if (duration > 500) {
        logInfo(`[${context}] Completed in ${duration}ms (slow)`);
      } else {
        logDebug(`[${context}] Completed in ${duration}ms`);
      }
      
      return response;
    } catch (error) {
      // Handle and log the error
      const duration = Date.now() - startTime;
      logError(`[${context}] Error after ${duration}ms:`, error);
      
      // Create standardized error response
      return formatErrorResponse(
        error.message || `Error in ${methodName}`,
        error.status || 500,
        error.data || null
      );
    }
  };
}

/**
 * Create a service object with wrapped methods
 * 
 * @param {Object} serviceConfig - Configuration for the service
 * @param {string} serviceConfig.name - Name of the service
 * @param {Object} serviceConfig.methods - Methods to wrap
 * @param {Object} serviceConfig.options - Default options for all methods
 * @returns {Object} - Service with wrapped methods
 */
export function createService(serviceConfig) {
  const { name, methods, options = {} } = serviceConfig;
  
  if (!name || typeof name !== 'string') {
    throw new Error('Service name is required');
  }
  
  if (!methods || typeof methods !== 'object') {
    throw new Error('methods must be an object');
  }
  
  const service = {};
  
  // Create wrapped methods
  Object.entries(methods).forEach(([methodName, methodConfig]) => {
    const { fn, ...methodOptions } = methodConfig;
    
    if (typeof fn !== 'function') {
      throw new Error(`Method ${methodName} must have a function`);
    }
    
    service[methodName] = createServiceMethod(fn, {
      methodName,
      serviceName: name,
      ...options,
      ...methodOptions
    });
  });
  
  return service;
}

/**
 * Standardized response formatter
 * 
 * @param {boolean} success - Whether the operation was successful
 * @param {any} data - The data to return
 * @param {string} message - Optional message explaining the result
 * @returns {Object} Standardized response object
 */
export function formatResponse(success = true, data = null, message = '') {
  return {
    success: !!success,
    data: data === undefined ? null : data,
    message: message || (success ? 'Operation successful' : 'Operation failed')
  };
}

/**
 * Standardized error response generator
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Additional error details
 * @returns {Object} Standardized error response
 */
export function formatErrorResponse(message, statusCode = 500, data = null) {
  return {
    success: false,
    message: message || 'An unexpected error occurred',
    status: statusCode,
    data: data
  };
}

/**
 * Create a simple memory cache if not using a dedicated cache manager
 */
export function createMemoryCache() {
  const cache = new Map();
  
  return {
    get: (key) => {
      const item = cache.get(key);
      if (!item) return null;
      
      const now = Date.now();
      if (item.expiry < now) {
        cache.delete(key);
        return null;
      }
      
      return item.value;
    },
    
    set: (key, value, ttl = 5 * 60 * 1000) => {
      cache.set(key, {
        value,
        expiry: Date.now() + ttl
      });
      return value;
    },
    
    delete: (key) => cache.delete(key),
    
    clear: () => cache.clear()
  };
}

// Initialize a global cache manager if not already present
if (!global.cacheManager) {
  global.cacheManager = createMemoryCache();
}

export default {
  createServiceMethod,
  createService,
  formatResponse,
  formatErrorResponse
}; 