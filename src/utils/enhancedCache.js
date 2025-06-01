/**
 * Enhanced Caching System
 * 
 * Provides intelligent caching with TTL, memory management, 
 * and invalidation strategies for optimal performance.
 */

class EnhancedCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.cache = new Map();
    this.accessTimes = new Map();
    this.expiryTimes = new Map();
    this.tags = new Map(); // For tagged invalidation
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  get(key) {
    // Check if key exists and not expired
    if (!this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const expiryTime = this.expiryTimes.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time for LRU
    this.accessTimes.set(key, Date.now());
    this.stats.hits++;
    
    return this.cache.get(key);
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {Object} options - Options including TTL and tags
   */
  set(key, value, options = {}) {
    const ttl = options.ttl || this.defaultTTL;
    const tags = options.tags || [];
    
    // Check if we need to make space
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    // Set the value
    this.cache.set(key, value);
    this.accessTimes.set(key, Date.now());
    
    // Set expiry time
    if (ttl > 0) {
      this.expiryTimes.set(key, Date.now() + ttl);
    }

    // Handle tags
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(key);
    });

    this.stats.sets++;
  }

  /**
   * Delete item from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.expiryTimes.delete(key);
      
      // Remove from tags
      this.tags.forEach((keys, tag) => {
        keys.delete(key);
        if (keys.size === 0) {
          this.tags.delete(tag);
        }
      });
      
      this.stats.deletes++;
      return true;
    }
    return false;
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const expiryTime = this.expiryTimes.get(key);
    if (expiryTime && Date.now() > expiryTime) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Invalidate cache by tags
   * @param {Array} tags - Tags to invalidate
   */
  invalidateByTags(tags) {
    tags.forEach(tag => {
      const keys = this.tags.get(tag);
      if (keys) {
        keys.forEach(key => this.delete(key));
      }
    });
  }

  /**
   * Get or set with a factory function
   * @param {string} key - Cache key
   * @param {Function} factory - Function to generate value if not cached
   * @param {Object} options - Options including TTL and tags
   */
  async getOrSet(key, factory, options = {}) {
    let value = this.get(key);
    
    if (value === null) {
      value = await factory();
      this.set(key, value, options);
    }
    
    return value;
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    this.accessTimes.forEach((time, key) => {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Clean up expired items
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    this.expiryTimes.forEach((expiryTime, key) => {
      if (now > expiryTime) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.expiryTimes.clear();
    this.tags.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize,
      tags: this.tags.size,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   * @returns {Object} Memory usage information
   */
  getMemoryUsage() {
    let totalSize = 0;
    
    // Rough estimation of memory usage
    this.cache.forEach((value, key) => {
      totalSize += JSON.stringify(value).length + key.length;
    });

    return {
      estimated: `${(totalSize / 1024).toFixed(2)} KB`,
      utilization: `${((this.cache.size / this.maxSize) * 100).toFixed(1)}%`
    };
  }

  /**
   * Get cache contents (for debugging)
   * @returns {Array} Array of cache entries
   */
  getContents() {
    const contents = [];
    
    this.cache.forEach((value, key) => {
      const expiryTime = this.expiryTimes.get(key);
      const accessTime = this.accessTimes.get(key);
      
      contents.push({
        key,
        value,
        expiryTime: expiryTime ? new Date(expiryTime).toISOString() : null,
        accessTime: new Date(accessTime).toISOString(),
        expired: expiryTime ? Date.now() > expiryTime : false
      });
    });

    return contents.sort((a, b) => new Date(b.accessTime) - new Date(a.accessTime));
  }

  /**
   * Destroy cache and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Specialized cache for admin data
class AdminDataCache extends EnhancedCache {
  constructor() {
    super({
      maxSize: 500,
      defaultTTL: 2 * 60 * 1000 // 2 minutes for admin data
    });
  }

  /**
   * Cache data for a specific resource type
   * @param {string} resourceType - Type of resource
   * @param {Array} data - Data to cache
   * @param {Object} filters - Applied filters
   */
  setResourceData(resourceType, data, filters = {}) {
    const key = this.generateResourceKey(resourceType, filters);
    this.set(key, data, {
      tags: [resourceType, 'admin-data'],
      ttl: 2 * 60 * 1000 // 2 minutes
    });
  }

  /**
   * Get cached data for a resource type
   * @param {string} resourceType - Type of resource
   * @param {Object} filters - Applied filters
   * @returns {Array|null} Cached data or null
   */
  getResourceData(resourceType, filters = {}) {
    const key = this.generateResourceKey(resourceType, filters);
    return this.get(key);
  }

  /**
   * Invalidate all data for a resource type
   * @param {string} resourceType - Type of resource
   */
  invalidateResource(resourceType) {
    this.invalidateByTags([resourceType]);
  }

  /**
   * Generate cache key for resource data
   * @param {string} resourceType - Type of resource
   * @param {Object} filters - Applied filters
   * @returns {string} Cache key
   */
  generateResourceKey(resourceType, filters) {
    const filterString = Object.keys(filters)
      .sort()
      .map(key => `${key}:${filters[key]}`)
      .join('|');
    
    return `${resourceType}${filterString ? `|${filterString}` : ''}`;
  }
}

// Create singleton instances
const globalCache = new EnhancedCache();
const adminCache = new AdminDataCache();

// Export classes and instances
export { 
  EnhancedCache, 
  AdminDataCache, 
  globalCache, 
  adminCache 
};

// Utility functions
export const createCache = (options = {}) => new EnhancedCache(options);

export const cacheWithTTL = (cache, key, value, ttl) => {
  cache.set(key, value, { ttl });
};

export const cacheWithTags = (cache, key, value, tags) => {
  cache.set(key, value, { tags });
}; 