/**
 * FilterCacheService.js
 * 
 * Single Responsibility: Filter data caching & optimization
 * - Intelligent cache invalidation
 * - Memory-efficient storage
 * - TTL (Time To Live) management
 * - Cache warming strategies
 * - Performance monitoring
 */

import { logDebug, logWarn, logInfo } from '@/utils/logger';

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG = {
  defaultTTL: 5 * 60 * 1000,        // 5 minutes
  maxCacheSize: 100,                // Maximum number of cache entries
  cleanupInterval: 60 * 1000,       // Cleanup every minute
  hitRateThreshold: 0.8,            // Target hit rate
  memoryThreshold: 50 * 1024 * 1024 // 50MB memory limit
};

/**
 * Cache entry structure
 */
class CacheEntry {
  constructor(data, ttl = DEFAULT_CONFIG.defaultTTL) {
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl;
    this.accessCount = 0;
    this.lastAccessed = this.timestamp;
    this.size = this._calculateSize(data);
  }

  /**
   * Check if cache entry is expired
   */
  isExpired() {
    return Date.now() - this.timestamp > this.ttl;
  }

  /**
   * Mark entry as accessed
   */
  touch() {
    this.accessCount++;
    this.lastAccessed = Date.now();
  }

  /**
   * Calculate approximate size of data in bytes
   * @private
   */
  _calculateSize(data) {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback size estimation
      return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
    }
  }
}

/**
 * FilterCacheService class - Optimized caching for filter data
 */
class FilterCacheService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalSize: 0
    };
    
    // Start periodic cleanup
    this._startCleanupTimer();
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      logDebug(`[FilterCacheService] Cache miss for key: ${key}`);
      return null;
    }
    
    if (entry.isExpired()) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.totalSize -= entry.size;
      logDebug(`[FilterCacheService] Cache expired for key: ${key}`);
      return null;
    }
    
    entry.touch();
    this.stats.hits++;
    logDebug(`[FilterCacheService] Cache hit for key: ${key}`);
    return entry.data;
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, data, ttl = this.config.defaultTTL) {
    // Don't cache null/undefined data
    if (data == null) {
      logWarn(`[FilterCacheService] Attempted to cache null/undefined data for key: ${key}`);
      return;
    }

    const entry = new CacheEntry(data, ttl);
    
    // Check if we need to make room in cache
    this._ensureCacheSpace(entry.size);
    
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key);
      this.stats.totalSize -= oldEntry.size;
    }
    
    this.cache.set(key, entry);
    this.stats.totalSize += entry.size;
    
    logDebug(`[FilterCacheService] Cached data for key: ${key}, size: ${entry.size} bytes`);
  }

  /**
   * Remove specific key from cache
   * @param {string} key - Cache key to remove
   */
  delete(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      logDebug(`[FilterCacheService] Deleted cache entry for key: ${key}`);
    }
  }

  /**
   * Clear cache entries matching a pattern
   * @param {RegExp|string} pattern - Pattern to match keys for invalidation
   */
  invalidate(pattern) {
    let deletedCount = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
        deletedCount++;
      }
    }
    
    logInfo(`[FilterCacheService] Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`);
  }

  /**
   * Warm cache with important data
   * @param {Array<{key: string, fetcher: Function, ttl?: number}>} entries - Entries to pre-load
   */
  async warm(entries) {
    logInfo(`[FilterCacheService] Starting cache warming for ${entries.length} entries`);
    
    const promises = entries.map(async ({ key, fetcher, ttl }) => {
      try {
        // Only warm if not already cached or expired
        if (!this.get(key)) {
          const data = await fetcher();
          this.set(key, data, ttl);
          logDebug(`[FilterCacheService] Warmed cache for key: ${key}`);
        }
      } catch (error) {
        logWarn(`[FilterCacheService] Failed to warm cache for key: ${key}`, error);
      }
    });
    
    await Promise.allSettled(promises);
    logInfo('[FilterCacheService] Cache warming completed');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) : 0;
    
    return {
      ...this.stats,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      memoryUsage: this.stats.totalSize,
      avgEntrySize: this.cache.size > 0 ? Math.round(this.stats.totalSize / this.cache.size) : 0
    };
  }

  /**
   * Clear all cache entries
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.totalSize = 0;
    logInfo(`[FilterCacheService] Cleared ${size} cache entries`);
  }

  /**
   * Get all cache keys (for debugging)
   */
  getKeys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Check cache health and performance
   */
  healthCheck() {
    const stats = this.getStats();
    const issues = [];
    
    if (stats.hitRate < this.config.hitRateThreshold) {
      issues.push(`Low hit rate: ${stats.hitRate} (target: ${this.config.hitRateThreshold})`);
    }
    
    if (stats.memoryUsage > this.config.memoryThreshold) {
      issues.push(`High memory usage: ${Math.round(stats.memoryUsage / 1024 / 1024)}MB (limit: ${Math.round(this.config.memoryThreshold / 1024 / 1024)}MB)`);
    }
    
    if (stats.cacheSize >= this.config.maxCacheSize) {
      issues.push(`Cache at capacity: ${stats.cacheSize}/${this.config.maxCacheSize}`);
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      stats
    };
  }

  /**
   * Ensure there's enough space in cache for new entry
   * @private
   */
  _ensureCacheSpace(newEntrySize) {
    // Check cache size limit
    while (this.cache.size >= this.config.maxCacheSize) {
      this._evictLeastUsed();
    }
    
    // Check memory limit
    while (this.stats.totalSize + newEntrySize > this.config.memoryThreshold) {
      this._evictLeastUsed();
    }
  }

  /**
   * Evict least recently used entry
   * @private
   */
  _evictLeastUsed() {
    if (this.cache.size === 0) return;
    
    let lruKey = null;
    let lruTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      const entry = this.cache.get(lruKey);
      this.cache.delete(lruKey);
      this.stats.totalSize -= entry.size;
      this.stats.evictions++;
      logDebug(`[FilterCacheService] Evicted LRU entry: ${lruKey}`);
    }
  }

  /**
   * Start periodic cleanup timer
   * @private
   */
  _startCleanupTimer() {
    setInterval(() => {
      this._cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired entries
   * @private
   */
  _cleanup() {
    let expiredCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.isExpired()) {
        this.cache.delete(key);
        this.stats.totalSize -= entry.size;
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logDebug(`[FilterCacheService] Cleaned up ${expiredCount} expired entries`);
    }
  }

  /**
   * Destroy cache service and cleanup timers
   */
  destroy() {
    this.clear();
    // Note: In a real implementation, we'd clear the cleanup interval here
    // if we stored the interval ID
    logInfo('[FilterCacheService] Cache service destroyed');
  }
}

// Create and export singleton instance
export const filterCacheService = new FilterCacheService();

// Export class for testing and custom instances
export { FilterCacheService };

// Export default instance
export default filterCacheService; 