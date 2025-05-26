/**
 * API Cache Manager
 *
 * Provides caching functionality for API requests:
 * - Request-level caching with TTL
 * - Cache invalidation
 * - Pattern-based cache clearing
 */

import { logDebug } from '@/utils/logger';
import CacheManager from '@/utils/CacheManager';

// Create a dedicated cache instance for API requests
const apiCache = new CacheManager('api-cache');

/**
 * Get a cached response or execute the request
 * 
 * @param {Function} requestFn - Function to execute if cache miss
 * @param {string} cacheKey - Cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Promise<any>} Response data
 */
export async function getWithCache(requestFn, cacheKey, ttl) {
  // Check if we have a cached response
  const cachedResponse = apiCache.get(cacheKey);
  
  if (cachedResponse) {
    logDebug(`[ApiCache] Cache hit for: ${cacheKey}`);
    return cachedResponse;
  }
  
  // No cache hit, execute the request
  logDebug(`[ApiCache] Cache miss for: ${cacheKey}`);
  const response = await requestFn();
  
  // Cache the response
  apiCache.set(cacheKey, response, ttl);
  
  return response;
}

/**
 * Clear cache entries matching a pattern
 * 
 * @param {string|RegExp} pattern - Pattern to match cache keys
 * @returns {number} Number of entries cleared
 */
export function clearCache(pattern) {
  return apiCache.clearPattern(pattern);
}

/**
 * Clear all cache entries
 * 
 * @returns {number} Number of entries cleared
 */
export function clearAllCache() {
  return apiCache.clear();
}

/**
 * Generate a cache key from request parameters
 * 
 * @param {string} url - Request URL
 * @param {Object} params - Request parameters
 * @param {string} method - HTTP method
 * @returns {string} Cache key
 */
export function generateCacheKey(url, params = {}, method = 'GET') {
  const normalizedUrl = url.startsWith('/') ? url.substring(1) : url;
  const methodKey = method.toUpperCase();
  
  // For GET requests, include params in the key
  if (methodKey === 'GET' && Object.keys(params).length > 0) {
    // Sort params to ensure consistent keys regardless of order
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
    
    return `${methodKey}:${normalizedUrl}:${JSON.stringify(sortedParams)}`;
  }
  
  return `${methodKey}:${normalizedUrl}`;
}

export default {
  getWithCache,
  clearCache,
  clearAllCache,
  generateCacheKey
};
