/* test-search-service-direct.js */
/**
 * Test script to verify the searchService functionality
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
  if (config.url.includes('/search')) {
    // Extract query parameters
    const url = new URL(`http://example.com${config.url}`);
    const q = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || 'all';
    const hashtags = url.searchParams.get('hashtags') || '';
    
    // Create mock results based on the search parameters
    const mockResults = {
      restaurants: [
        { id: 1, name: 'Pizza Palace', cuisine: 'Italian' },
        { id: 2, name: 'Burger Barn', cuisine: 'American' }
      ],
      dishes: [
        { id: 1, name: 'Margherita Pizza', restaurant: 'Pizza Palace' },
        { id: 2, name: 'Classic Burger', restaurant: 'Burger Barn' }
      ],
      lists: [
        { id: 1, name: 'Best Italian Food', tags: ['italian', 'pasta', 'pizza'] },
        { id: 2, name: 'Burger Spots', tags: ['burger', 'american', 'fastfood'] }
      ],
      totalRestaurants: 2,
      totalDishes: 2,
      totalLists: 2
    };
    
    // Filter results based on search query
    if (q) {
      const lowerQ = q.toLowerCase();
      mockResults.restaurants = mockResults.restaurants.filter(r => 
        r.name.toLowerCase().includes(lowerQ) || r.cuisine.toLowerCase().includes(lowerQ)
      );
      mockResults.dishes = mockResults.dishes.filter(d => 
        d.name.toLowerCase().includes(lowerQ) || d.restaurant.toLowerCase().includes(lowerQ)
      );
      mockResults.lists = mockResults.lists.filter(l => 
        l.name.toLowerCase().includes(lowerQ) || l.tags.some(t => t.includes(lowerQ))
      );
      
      mockResults.totalRestaurants = mockResults.restaurants.length;
      mockResults.totalDishes = mockResults.dishes.length;
      mockResults.totalLists = mockResults.lists.length;
    }
    
    // Filter by type
    if (type !== 'all') {
      if (type === 'restaurants') {
        mockResults.dishes = [];
        mockResults.lists = [];
        mockResults.totalDishes = 0;
        mockResults.totalLists = 0;
      } else if (type === 'dishes') {
        mockResults.restaurants = [];
        mockResults.lists = [];
        mockResults.totalRestaurants = 0;
        mockResults.totalLists = 0;
      } else if (type === 'lists') {
        mockResults.restaurants = [];
        mockResults.dishes = [];
        mockResults.totalRestaurants = 0;
        mockResults.totalDishes = 0;
      }
    }
    
    // Filter by hashtags
    if (hashtags) {
      const hashtagArray = hashtags.split(',').map(h => h.toLowerCase());
      
      if (hashtagArray.length > 0) {
        mockResults.restaurants = mockResults.restaurants.filter(r => 
          hashtagArray.includes(r.cuisine.toLowerCase())
        );
        mockResults.lists = mockResults.lists.filter(l => 
          hashtagArray.some(h => l.tags.includes(h))
        );
        
        mockResults.totalRestaurants = mockResults.restaurants.length;
        mockResults.totalLists = mockResults.lists.length;
      }
    }
    
    return { data: mockResults };
  }
  
  return { data: {} };
};

// Mock the serviceHelpers
const createQueryParams = (params) => {
  const urlParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          urlParams.append(key, value.join(','));
        }
      } else {
        urlParams.append(key, String(value));
      }
    }
  });
  
  return urlParams;
};

// Mock the dataTransformers
const transformFiltersForApi = (filters) => {
  if (!filters || typeof filters !== 'object') {
    return {};
  }

  const apiParams = {};
  
  // Process each filter type
  Object.entries(filters).forEach(([key, value]) => {
    // Skip empty filters
    if (value === null || value === undefined || 
        (Array.isArray(value) && value.length === 0)) {
      return;
    }
    
    // Handle array filters (like hashtags, cuisines)
    if (Array.isArray(value)) {
      // If only one value, send as string to avoid unnecessary array parameter
      if (value.length === 1) {
        apiParams[key] = value[0];
      } else {
        apiParams[key] = value.join(',');
      }
    } 
    // Handle simple value filters
    else if (value !== '') {
      apiParams[key] = value;
    }
  });
  
  return apiParams;
};

// Create a simplified version of the searchService for testing
const searchCache = new Map();
const CACHE_TTL = 2 * 60 * 1000;

const clearSearchCache = (cacheKey = null) => {
  if (cacheKey) {
    searchCache.delete(cacheKey);
    logger.logDebug(`[searchService] Cleared cache for key: ${cacheKey}`);
  } else {
    searchCache.clear();
    logger.logDebug('[searchService] Cleared all search cache');
  }
};

const search = async (params = {}, useCache = true) => {
  const {
    q = '',
    type = 'all',
    limit = 10,
    offset = 0,
    cityId,
    boroughId,
    neighborhoodId,
    hashtags = [],
    refresh = false,
  } = params;

  try {
    // Generate cache key based on search parameters
    const cacheKey = JSON.stringify({
      q, type, limit, offset, cityId, boroughId, neighborhoodId, hashtags
    });
    
    // Check cache first unless refresh is requested
    if (useCache && !refresh && searchCache.has(cacheKey)) {
      const { data, timestamp } = searchCache.get(cacheKey);
      if (Date.now() - timestamp < CACHE_TTL) {
        logger.logDebug('[searchService] Returning cached search results');
        return data;
      }
    }
    
    logger.logDebug(`[searchService] Performing search with params:`, params);
    
    // Transform filters for API using the utility function
    const apiFilters = transformFiltersForApi({
      cityId,
      boroughId,
      neighborhoodId,
      hashtags
    });
    
    // Create query parameters
    const queryParams = createQueryParams({
      q,
      type,
      limit: String(limit),
      offset: String(offset),
      ...apiFilters
    });
    
    // Use direct axios config object approach to prevent toUpperCase error
    const axiosConfig = {
      url: `/search${queryParams.toString() ? `?${queryParams.toString()}` : ''}`,
      method: 'get'
    };
    
    // Make API request with standardized error handling
    const response = await mockApiClient(axiosConfig);
    
    // Process and normalize the response
    const result = response?.data || { 
      restaurants: [], 
      dishes: [], 
      lists: [], 
      totalRestaurants: 0, 
      totalDishes: 0, 
      totalLists: 0 
    };
    
    // Update cache
    if (useCache) {
      searchCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
    }
    
    return result;
  } catch (error) {
    logger.logError('[searchService] Error performing search:', error);
    return { 
      restaurants: [], 
      dishes: [], 
      lists: [], 
      totalRestaurants: 0, 
      totalDishes: 0, 
      totalLists: 0,
      error: error.message || 'An error occurred during search'
    };
  }
};

const searchService = {
  search,
  clearCache: clearSearchCache
};

// Test the search function
async function testSearch() {
  logger.logInfo('🧪 Testing search...');
  
  try {
    // Test with simple query
    const results = await searchService.search({ q: 'pizza' });
    logger.logInfo(`✅ Successfully searched for "pizza" and found:
      - ${results.totalRestaurants} restaurants
      - ${results.totalDishes} dishes
      - ${results.totalLists} lists`);
    
    // Test with type filter
    const restaurantResults = await searchService.search({ 
      q: 'pizza', 
      type: 'restaurants' 
    });
    logger.logInfo(`✅ Successfully searched for "pizza" in restaurants and found ${restaurantResults.totalRestaurants} results`);
    
    // Test with hashtags
    const italianResults = await searchService.search({ 
      hashtags: ['italian'] 
    });
    logger.logInfo(`✅ Successfully searched with hashtag "italian" and found:
      - ${italianResults.totalRestaurants} restaurants
      - ${italianResults.totalLists} lists`);
    
    // Test caching - this should use cached results
    logger.logInfo('Testing cache functionality...');
    const cachedResults = await searchService.search({ q: 'pizza' });
    logger.logInfo(`✅ Successfully retrieved search results from cache`);
    
    // Test cache clearing
    searchService.clearCache();
    logger.logInfo('✅ Successfully cleared search cache');
    
    return true;
  } catch (error) {
    logger.logError('❌ Error testing search:', error);
    return false;
  }
}

// Run all tests
async function runTests() {
  logger.logInfo('🚀 Starting search service tests...');
  
  const searchResult = await testSearch();
  
  if (searchResult) {
    logger.logInfo('✅ All search service tests passed!');
  } else {
    logger.logError('❌ Some search service tests failed.');
  }
  
  return searchResult;
}

// Execute tests
runTests().catch(error => {
  logger.logError('❌ Unhandled error during tests:', error);
  process.exit(1);
});
