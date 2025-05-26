/**
 * Cache utility for HTTP requests and responses
 */

/**
 * Get a cached value
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {*} Cached value or null if expired/not found
 */
export const getCachedValue = (key, ttl) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const { value, timestamp } = JSON.parse(item);
    const now = Date.now();

    // Check if the item is expired
    if (now - timestamp > ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return value;
  } catch (error) {
    console.error('[Cache] Error reading from cache:', error);
    return null;
  }
};

/**
 * Set a cached value
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 */
export const setCachedValue = (key, value) => {
  try {
    const item = {
      value,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('[Cache] Error writing to cache:', error);
  }
};

/**
 * Remove a cached value
 * @param {string} key - Cache key to remove
 */
export const removeCachedValue = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[Cache] Error removing from cache:', error);
  }
};
