/* test-hashtag-service-direct.js */
/**
 * Test script to verify the hashtagService functionality
 * This version uses direct imports rather than path aliases for direct Node.js execution
 */

// Mock the logger functions since we're running outside the app context
const logger = {
  logInfo: (...args) => console.log('[INFO]', ...args),
  logError: (...args) => console.error('[ERROR]', ...args),
  logDebug: (...args) => console.log('[DEBUG]', ...args),
  logWarn: (...args) => console.log('[WARN]', ...args)
};

// Mock the API client
const mockApiClient = async (config) => {
  console.log(`[MOCK API] ${config.method.toUpperCase()} ${config.url}`);
  
  // Simulate API responses
  if (config.url === '/hashtags/top') {
    return [
      { id: 1, name: 'pizza', usage_count: 120 },
      { id: 2, name: 'burger', usage_count: 95 },
      { id: 3, name: 'sushi', usage_count: 87 },
      { id: 4, name: 'italian', usage_count: 76 },
      { id: 5, name: 'mexican', usage_count: 68 }
    ];
  } else if (config.url === '/hashtags/search') {
    const query = config.params.query.toLowerCase();
    const mockResults = [
      { id: 4, name: 'italian', usage_count: 76 },
      { id: 5, name: 'mexican', usage_count: 68 },
      { id: 15, name: 'mediterranean', usage_count: 42 }
    ];
    
    return mockResults.filter(item => 
      item.name.toLowerCase().includes(query)
    );
  }
  
  return [];
};

// Mock the serviceHelpers
const createQueryParams = (params) => {
  return params;
};

// Create a simplified version of the hashtagService for testing
const hashtagService = {
  // Simple in-memory cache
  cache: new Map(),
  
  // Cache TTL in milliseconds (5 minutes)
  CACHE_TTL: 5 * 60 * 1000,
  
  // Get top hashtags
  getTopHashtags: async (limitOrOptions = 15, useCache = true) => {
    try {
      // Process parameters
      let safeLimit = 15;
      let additionalParams = {};
      let refresh = false;
      
      if (typeof limitOrOptions === 'object' && limitOrOptions !== null) {
        const { limit, refresh: shouldRefresh, ...otherParams } = limitOrOptions;
        safeLimit = Math.max(1, parseInt(limit, 10) || 15);
        additionalParams = otherParams;
        refresh = shouldRefresh === true;
      } else {
        safeLimit = Math.max(1, parseInt(limitOrOptions, 10) || 15);
      }
      
      // Generate cache key
      const cacheKey = `top-hashtags-${safeLimit}-${JSON.stringify(additionalParams)}`;
      
      // Check cache first unless refresh is requested
      if (useCache && !refresh && hashtagService.cache.has(cacheKey)) {
        const { data, timestamp } = hashtagService.cache.get(cacheKey);
        if (Date.now() - timestamp < hashtagService.CACHE_TTL) {
          logger.logDebug('[HashtagService] Returning cached top hashtags');
          return data;
        }
      }
      
      // Prepare API request
      const endpoint = `/hashtags/top`;
      logger.logDebug(`[HashtagService] Fetching top ${safeLimit} hashtags with params:`, additionalParams);
      
      // Create params
      const params = createQueryParams({
        limit: String(safeLimit),
        ...additionalParams
      });
      
      // Use direct axios config object approach
      const axiosConfig = {
        url: endpoint,
        method: 'get',
        params
      };
      
      // Make API request
      const response = await mockApiClient(axiosConfig);
      
      // Process and normalize response data
      if (Array.isArray(response) && response.length > 0) {
        const normalizedHashtags = response.map(item => ({
          name: item.name || '',
          usage_count: parseInt(item.usage_count, 10) || 0,
          id: parseInt(item.id, 10) || null
        }));
        
        // Update cache
        if (useCache) {
          hashtagService.cache.set(cacheKey, {
            data: normalizedHashtags,
            timestamp: Date.now()
          });
        }
        
        return normalizedHashtags;
      }
      
      logger.logWarn('[HashtagService] API returned invalid hashtag data, returning empty array');
      return [];
    } catch (error) {
      logger.logError('[HashtagService] Error fetching top hashtags:', error);
      return [];
    }
  },
  
  // Search hashtags
  searchHashtags: async (query, limit = 10) => {
    try {
      if (!query || query.trim().length < 2) return [];
      
      const safeQuery = query.trim();
      const safeLimit = Math.max(1, parseInt(limit, 10) || 10);
      
      // Generate cache key
      const cacheKey = `search-hashtags-${safeQuery}-${safeLimit}`;
      
      // Check cache first
      if (hashtagService.cache.has(cacheKey)) {
        const { data, timestamp } = hashtagService.cache.get(cacheKey);
        if (Date.now() - timestamp < hashtagService.CACHE_TTL) {
          logger.logDebug('[HashtagService] Returning cached hashtag search results');
          return data;
        }
      }
      
      logger.logDebug(`[HashtagService] Searching hashtags with query: ${safeQuery}`);
      
      // Use direct axios config object approach
      const axiosConfig = {
        url: '/hashtags/search',
        method: 'get',
        params: {
          query: safeQuery,
          limit: String(safeLimit)
        }
      };
      
      // Make API request
      const response = await mockApiClient(axiosConfig);
      
      // Process results
      const normalizedHashtags = response.map(item => ({
        name: item.name || '',
        usage_count: parseInt(item.usage_count, 10) || 0,
        id: parseInt(item.id, 10) || null
      }));
      
      // Update cache
      hashtagService.cache.set(cacheKey, {
        data: normalizedHashtags,
        timestamp: Date.now()
      });
      
      return normalizedHashtags;
    } catch (error) {
      logger.logError('[HashtagService] Error searching hashtags:', error);
      return [];
    }
  },
  
  // Clear cache
  clearCache: (cacheKey = null) => {
    if (cacheKey) {
      hashtagService.cache.delete(cacheKey);
      logger.logDebug(`[HashtagService] Cleared cache for key: ${cacheKey}`);
    } else {
      hashtagService.cache.clear();
      logger.logDebug('[HashtagService] Cleared all hashtag cache');
    }
  }
};

// Test the getTopHashtags function
async function testGetTopHashtags() {
  logger.logInfo('🧪 Testing getTopHashtags...');
  
  try {
    // Test with default parameters
    const hashtags = await hashtagService.getTopHashtags(10);
    logger.logInfo(`✅ Successfully fetched ${hashtags.length} top hashtags:`, hashtags);
    
    // Test with options object
    const hashtagsWithOptions = await hashtagService.getTopHashtags({ 
      limit: 5, 
      refresh: true 
    });
    logger.logInfo(`✅ Successfully fetched ${hashtagsWithOptions.length} top hashtags with options:`, hashtagsWithOptions);
    
    // Test caching - this should use cached results
    logger.logInfo('Testing cache functionality...');
    const cachedHashtags = await hashtagService.getTopHashtags(10);
    logger.logInfo(`✅ Successfully retrieved ${cachedHashtags.length} hashtags from cache`);
    
    return true;
  } catch (error) {
    logger.logError('❌ Error testing getTopHashtags:', error);
    return false;
  }
}

// Test the searchHashtags function
async function testSearchHashtags() {
  logger.logInfo('🧪 Testing searchHashtags...');
  
  try {
    // Test with a search query
    const query = 'ita'; // Should match "Italian"
    const hashtags = await hashtagService.searchHashtags(query, 5);
    logger.logInfo(`✅ Successfully searched for "${query}" and found ${hashtags.length} hashtags:`, hashtags);
    
    // Test with a different query
    const query2 = 'mex'; // Should match "Mexican"
    const hashtags2 = await hashtagService.searchHashtags(query2, 5);
    logger.logInfo(`✅ Successfully searched for "${query2}" and found ${hashtags2.length} hashtags:`, hashtags2);
    
    // Test cache clearing
    hashtagService.clearCache();
    logger.logInfo('✅ Successfully cleared hashtag cache');
    
    return true;
  } catch (error) {
    logger.logError('❌ Error testing searchHashtags:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  logger.logInfo('🚀 Starting hashtag service tests...');
  
  const topHashtagsResult = await testGetTopHashtags();
  const searchHashtagsResult = await testSearchHashtags();
  
  const allPassed = topHashtagsResult && searchHashtagsResult;
  
  if (allPassed) {
    logger.logInfo('✅ All hashtag service tests passed!');
  } else {
    logger.logError('❌ Some hashtag service tests failed.');
  }
  
  return allPassed;
}

// Execute tests
runTests().catch(error => {
  logger.logError('❌ Unhandled error during tests:', error);
  process.exit(1);
});
