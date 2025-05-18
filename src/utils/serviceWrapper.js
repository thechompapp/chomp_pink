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
import { logDebug, logError, logInfo } from './logger';
import { formatResponse, formatErrorResponse } from './serviceHelpers';
import { parseApiError } from './parseApiError';
import * as CacheManager from './CacheManager';

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
    const startTime = performance.now();
    let cacheKey = null;
    
    try {
      // Check cache if enabled
      if (enableCache && typeof getCacheKey === 'function') {
        cacheKey = getCacheKey(...args);
        
        if (cacheKey) {
          const cachedResult = CacheManager.get(cacheKey);
          if (cachedResult) {
            logDebug(`[${context}] Cache hit for key: ${cacheKey}`);
            return cachedResult;
          }
          logDebug(`[${context}] Cache miss for key: ${cacheKey}`);
        }
      }
      
      // Execute the service method
      logDebug(`[${context}] Executing with args:`, args.length > 0 ? args : 'no args');
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
      if (enableCache && cacheKey && response.success) {
        CacheManager.set(cacheKey, response, cacheTTL);
        logDebug(`[${context}] Cached result with key: ${cacheKey}, TTL: ${cacheTTL}ms`);
      }
      
      // Log completion time
      const duration = Math.round(performance.now() - startTime);
      if (duration > 500) {
        logInfo(`[${context}] Completed in ${duration}ms (slow)`);
      } else {
        logDebug(`[${context}] Completed in ${duration}ms`);
      }
      
      return response;
    } catch (error) {
      // Handle and log the error
      const duration = Math.round(performance.now() - startTime);
      logError(`[${context}] Error after ${duration}ms:`, error);
      
      // Parse the error and create standardized error response
      const parsedError = parseApiError(error);
      return formatErrorResponse(
        parsedError.message || `Error in ${methodName}`,
        parsedError.status || 500,
        parsedError.data || null
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
 * Create a cached getter function
 * 
 * @param {Function} getter - Function to fetch data
 * @param {Object} options - Cache options
 * @returns {Function} - Wrapped getter with caching
 */
export function createCachedGetter(getter, {
  cacheKey = '',
  ttl = 5 * 60 * 1000,
  paramsToCacheKey = (...args) => JSON.stringify(args)
} = {}) {
  return async function(...args) {
    const fullCacheKey = `${cacheKey}:${paramsToCacheKey(...args)}`;
    
    // Try to get from cache
    const cached = CacheManager.get(fullCacheKey);
    if (cached) {
      return cached;
    }
    
    // Get fresh data
    try {
      const result = await getter(...args);
      
      // Cache the result if valid
      if (result && (result.success !== false)) {
        CacheManager.set(fullCacheKey, result, ttl);
      }
      
      return result;
    } catch (error) {
      logError(`[CachedGetter:${cacheKey}] Error:`, error);
      return null;
    }
  };
}

export default {
  createServiceMethod,
  createService,
  createCachedGetter
}; 