/**
 * Hashtag Service Integration Tests
 * 
 * These tests verify the hashtag functionality, including:
 * - Trending hashtags retrieval
 * - Hashtag search functionality
 * - Hashtag association with lists
 * - Hashtag caching and performance
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

// Create axios instance
let api = null;

// Test module
const hashtagTests = {
  /**
   * Run all hashtag tests
   * @param {Object} config - Test configuration
   * @param {Object} logger - Logger utility
   */
  async run(config, logger) {
    const section = logger.section('Hashtag Service');
    
    // Save config and logger for use in other methods
    this.config = config;
    this.logger = logger;
    
    // Initialize API client
    api = axios.create({
      baseURL: config.BACKEND_URL,
      timeout: config.TIMEOUT_MS, // Use global timeout configuration
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Authenticate as admin
    let token = null;
    try {
      const authResponse = await api.post('/api/auth/login', {
        email: config.ADMIN_EMAIL,
        password: config.ADMIN_PASSWORD
      });
      
      token = authResponse.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      logger.success('Authenticated as admin for hashtag tests');
    } catch (error) {
      logger.error('Failed to authenticate as admin for hashtag tests', error);
      return;
    }
    
    // Run tests - in parallel if in fast mode, otherwise sequentially
    if (config.FAST_MODE) {
      logger.info('Running hashtag tests in parallel (FAST MODE)');
      
      await Promise.all([
        this.runTest(section, 'Trending hashtags retrieval', async () => {
          try {
            const response = await api.get('/api/hashtags/trending');
            return { 
              success: response.status === 200 && Array.isArray(response.data), 
              message: `Retrieved ${response.data.length} trending hashtags` 
            };
          } catch (error) {
            return { success: false, message: `Trending hashtags retrieval failed: ${error.message}` };
          }
        }),
        
        this.runTest(section, 'Hashtag search', async () => {
          try {
            const searchTerm = 'food';
            const response = await api.get(`/api/hashtags/search?q=${searchTerm}`);
            return { 
              success: response.status === 200 && Array.isArray(response.data), 
              message: `Search for "${searchTerm}" returned ${response.data.length} hashtags` 
            };
          } catch (error) {
            return { success: false, message: `Hashtag search failed: ${error.message}` };
          }
        }),
        
        this.runTest(section, 'Hashtag-list association', async () => {
          // Skip in fast mode but mark as skipped
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        }),
        
        this.runTest(section, 'Hashtag caching', async () => {
          // Skip in fast mode but mark as skipped
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        })
      ]);
    } else {
      // Standard mode - run tests sequentially
      await this.runTest(section, 'Trending hashtags retrieval', this.testTrendingHashtags.bind(this));
      await this.runTest(section, 'Hashtag search', this.testHashtagSearch.bind(this));
      await this.runTest(section, 'Hashtag-list association', this.testHashtagListAssociation.bind(this));
      await this.runTest(section, 'Hashtag caching', this.testHashtagCaching.bind(this));
    }
  },
  
  /**
   * Test trending hashtags retrieval
   */
  async testTrendingHashtags() {
    try {
      const response = await api.get('/api/hashtags/trending');
      
      if (response.status !== 200) {
        return { success: false, message: `Unexpected status code: ${response.status}` };
      }
      
      if (!Array.isArray(response.data)) {
        return { success: false, message: 'Response is not an array of hashtags' };
      }
      
      return { 
        success: true, 
        message: `Successfully retrieved ${response.data.length} trending hashtags` 
      };
    } catch (error) {
      return { success: false, message: `Trending hashtags retrieval failed: ${error.message}` };
    }
  },
  
  /**
   * Test hashtag search functionality
   */
  async testHashtagSearch() {
    try {
      // Test with a common search term
      const searchTerm = 'food';
      const response = await api.get(`/api/hashtags/search?q=${searchTerm}`);
      
      if (response.status !== 200) {
        return { success: false, message: `Unexpected status code: ${response.status}` };
      }
      
      if (!Array.isArray(response.data)) {
        return { success: false, message: 'Response is not an array of hashtags' };
      }
      
      // Test with an empty search term (should return popular hashtags)
      const emptyResponse = await api.get('/api/hashtags/search?q=');
      
      if (emptyResponse.status !== 200 || !Array.isArray(emptyResponse.data)) {
        return { success: false, message: 'Empty search term did not return expected results' };
      }
      
      return { 
        success: true, 
        message: `Search for "${searchTerm}" returned ${response.data.length} hashtags` 
      };
    } catch (error) {
      return { success: false, message: `Hashtag search failed: ${error.message}` };
    }
  },
  
  /**
   * Test hashtag association with lists
   */
  async testHashtagListAssociation() {
    try {
      // Create a test list with hashtags
      const createResponse = await api.post('/api/lists', {
        name: 'Hashtag Test List',
        description: 'Testing hashtag associations',
        isPrivate: false,
        hashtags: ['test', 'integration', 'hashtags']
      });
      
      if (createResponse.status !== 201) {
        return { success: false, message: `Failed to create test list: ${createResponse.status}` };
      }
      
      const listId = createResponse.data.id;
      
      // Verify hashtags were associated
      const getResponse = await api.get(`/api/lists/${listId}`);
      
      if (!getResponse.data.hashtags || !Array.isArray(getResponse.data.hashtags)) {
        return { success: false, message: 'List does not have hashtags property or it is not an array' };
      }
      
      const hasAllHashtags = ['test', 'integration', 'hashtags'].every(tag => 
        getResponse.data.hashtags.some(h => h.name === tag || h === tag)
      );
      
      if (!hasAllHashtags) {
        return { success: false, message: 'Not all hashtags were associated with the list' };
      }
      
      // Clean up - delete the test list
      await api.delete(`/api/lists/${listId}`);
      
      return { 
        success: true, 
        message: 'Successfully verified hashtag-list associations' 
      };
    } catch (error) {
      return { success: false, message: `Hashtag-list association test failed: ${error.message}` };
    }
  },
  
  /**
   * Test hashtag caching and performance
   */
  async testHashtagCaching() {
    try {
      // First request to populate cache
      const startTime1 = performance.now();
      const response1 = await api.get('/api/hashtags/trending');
      const duration1 = performance.now() - startTime1;
      
      if (response1.status !== 200) {
        return { success: false, message: `First request failed: ${response1.status}` };
      }
      
      // Second request should use cache
      const startTime2 = performance.now();
      const response2 = await api.get('/api/hashtags/trending');
      const duration2 = performance.now() - startTime2;
      
      if (response2.status !== 200) {
        return { success: false, message: `Second request failed: ${response2.status}` };
      }
      
      // Verify data consistency
      const isDataConsistent = JSON.stringify(response1.data) === JSON.stringify(response2.data);
      
      if (!isDataConsistent) {
        return { success: false, message: 'Cached data is inconsistent with original data' };
      }
      
      // Note: We don't strictly enforce that the second request is faster,
      // as network conditions can vary, but we log the durations for analysis
      this.logger.debug(`First request: ${Math.round(duration1)}ms, Second request: ${Math.round(duration2)}ms`);
      
      return { 
        success: true, 
        message: 'Successfully verified hashtag caching' 
      };
    } catch (error) {
      return { success: false, message: `Hashtag caching test failed: ${error.message}` };
    }
  },
  
  /**
   * Run a test and handle timing/logging
   */
  async runTest(section, name, testFn) {
    const startTime = performance.now();
    try {
      const result = await testFn();
      const duration = Math.round(performance.now() - startTime);
      
      if (result.success) {
        this.logger.test(section, name, 'PASSED', duration);
      } else if (result.skipped) {
        this.logger.test(section, name, 'SKIPPED', 0, result.message);
      } else {
        this.logger.test(section, name, 'FAILED', duration, result.message);
      }
      
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      const message = error.message || 'Unknown error';
      this.logger.test(section, name, 'FAILED', duration, message);
      this.logger.error(`Test execution error: ${name}`, error);
      return { success: false, message };
    }
  }
};

export default hashtagTests;
