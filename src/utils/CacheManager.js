/**
 * CacheManager - Advanced caching utility for API responses and other data
 * 
 * Features:
 * - LRU (Least Recently Used) eviction policy
 * - Automatic expiration
 * - Size limits
 * - Cache statistics
 * - Support for different storage strategies
 */

/**
 * Cache entry with metadata
 * @typedef {Object} CacheEntry
 * @property {*} value - The cached value
 * @property {number} expiry - Timestamp when this entry expires
 * @property {number} lastAccessed - Timestamp when this entry was last accessed
 * @property {number} hits - Number of times this entry was accessed
 */

/**
 * Advanced memory cache with LRU eviction
 */
export class CacheManager {
  /**
   * Create a new cache manager
   * @param {Object} options - Cache configuration
   * @param {number} [options.maxSize=100] - Maximum number of items to store
   * @param {number} [options.defaultTTL=300000] - Default TTL in ms (5 minutes)
   * @param {number} [options.cleanupInterval=60000] - Cleanup interval in ms (1 minute)
   * @param {boolean} [options.debug=false] - Enable debug logging
   */
  constructor(options = {}) {
    const {
      maxSize = 100,
      defaultTTL = 5 * 60 * 1000, // 5 minutes
      cleanupInterval = 60 * 1000, // 1 minute
      debug = false
    } = options;

    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.debug = debug;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      expirations: 0
    };

    // Set up automatic cleanup interval
    if (typeof window !== 'undefined' && cleanupInterval > 0) {
      this.cleanupInterval = setInterval(() => this.cleanup(), cleanupInterval);
    }
    
    if (this.debug) {
      console.log(`[CacheManager] Initialized with maxSize=${maxSize}, defaultTTL=${defaultTTL}ms`);
    }
  }

  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [ttl] - Time to live in ms, defaults to defaultTTL
   * @returns {*} The cached value
   */
  set(key, value, ttl = this.defaultTTL) {
    // Enforce size limit by removing least recently used items
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    this.cache.set(key, {
      value,
      expiry: now + ttl,
      lastAccessed: now,
      hits: 0
    });
    
    this.stats.sets++;
    
    if (this.debug) {
      console.log(`[CacheManager] Set: ${key}, expires in ${ttl}ms`);
    }

    return value;
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {*|null} Cached value or null if not found or expired
   */
  get(key) {
    const entry = this.cache.get(key);
    const now = Date.now();

    // Return null if not found or expired
    if (!entry) {
      this.stats.misses++;
      if (this.debug) {
        console.log(`[CacheManager] Miss: ${key}`);
      }
      return null;
    }

    if (entry.expiry < now) {
      this.stats.expirations++;
      this.cache.delete(key);
      if (this.debug) {
        console.log(`[CacheManager] Expired: ${key}`);
      }
      return null;
    }

    // Update access metadata
    entry.lastAccessed = now;
    entry.hits++;
    this.stats.hits++;
    
    if (this.debug && entry.hits % 10 === 0) {
      console.log(`[CacheManager] Hot key: ${key} (${entry.hits} hits)`);
    }

    return entry.value;
  }

  /**
   * Delete a key from the cache
   * @param {string} key - Cache key to delete
   * @returns {boolean} True if the key was deleted
   */
  delete(key) {
    const result = this.cache.delete(key);
    if (result && this.debug) {
      console.log(`[CacheManager] Deleted: ${key}`);
    }
    return result;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param {string} key - Cache key to check
   * @returns {boolean} True if the key exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    const now = Date.now();
    return entry && entry.expiry >= now;
  }

  /**
   * Clear all items from the cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    if (this.debug && size > 0) {
      console.log(`[CacheManager] Cleared ${size} items from cache`);
    }
  }

  /**
   * Remove expired entries from the cache
   * @returns {number} Number of entries removed
   */
  cleanup() {
    const now = Date.now();
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(key);
        count++;
        this.stats.expirations++;
      }
    }

    if (this.debug && count > 0) {
      console.log(`[CacheManager] Cleanup: removed ${count} expired items`);
    }

    return count;
  }

  /**
   * Evict the least recently used item from the cache
   * @returns {boolean} True if an item was evicted
   */
  evictLRU() {
    if (this.cache.size === 0) {
      return false;
    }

    let oldestKey = null;
    let oldestTime = Infinity;

    // Find the least recently used entry
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      
      if (this.debug) {
        console.log(`[CacheManager] Evicted LRU item: ${oldestKey}`);
      }
      
      return true;
    }

    return false;
  }

  /**
   * Get current cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRatio: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Dispose of the cache manager and clear any intervals
   */
  dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Create a singleton instance for application-wide use
const globalCache = new CacheManager();

/**
 * Get or create a value in the cache using a getter function
 * 
 * @param {string} key - Cache key
 * @param {Function} getter - Function to get the value if not cached
 * @param {number} [ttl] - Time to live in ms
 * @returns {Promise<*>} The cached or newly fetched value
 */
export const getOrCreate = async (key, getter, ttl) => {
  // Try to get from cache first
  const cachedValue = globalCache.get(key);
  if (cachedValue !== null) {
    return cachedValue;
  }
  
  // Not in cache, fetch fresh value
  const value = await getter();
  globalCache.set(key, value, ttl);
  return value;
};

/**
 * Set a value in the global cache
 * 
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} [ttl] - Time to live in ms
 * @returns {*} The cached value
 */
export const set = (key, value, ttl) => globalCache.set(key, value, ttl);

/**
 * Get a value from the global cache
 * 
 * @param {string} key - Cache key
 * @returns {*|null} Cached value or null
 */
export const get = (key) => globalCache.get(key);

/**
 * Clear the global cache
 */
export const clear = () => globalCache.clear();

/**
 * Check if a key exists in the global cache
 * 
 * @param {string} key - Cache key
 * @returns {boolean} Whether the key exists and is valid
 */
export const has = (key) => globalCache.has(key);

/**
 * Get cache statistics
 * 
 * @returns {Object} Cache statistics
 */
export const getStats = () => globalCache.getStats();

export default {
  CacheManager,
  getOrCreate,
  set,
  get,
  clear,
  has,
  getStats,
  globalCache
}; 