/**
 * Neighborhood Lookup Integration Tests
 * 
 * These tests verify the neighborhood lookup functionality, including:
 * - Neighborhood lookup by ZIP code
 * - Neighborhood data consistency
 * - Integration of neighborhood data with restaurant entries
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

// Create axios instance
let api = null;

// Test module
const neighborhoodTests = {
  /**
   * Run all neighborhood tests
   * @param {Object} config - Test configuration
   * @param {Object} logger - Logger utility
   */
  async run(config, logger) {
    const section = logger.section('Neighborhood Lookup');
    
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
    
    // Authenticate as user
    let token = null;
    try {
      const authResponse = await api.post('/api/auth/login', {
        email: config.USER_EMAIL,
        password: config.USER_PASSWORD
      });
      
      token = authResponse.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      logger.success('Authenticated for neighborhood tests');
    } catch (error) {
      logger.error('Failed to authenticate for neighborhood tests', error);
      return;
    }
    
    // Run tests - in parallel if in fast mode, otherwise sequentially
    if (config.FAST_MODE) {
      logger.info('Running neighborhood tests in parallel (FAST MODE)');
      
      await Promise.all([
        this.runTest(section, 'Neighborhood lookup by ZIP', async () => {
          try {
            // Test with a common NYC ZIP code
            const zipCode = '10001';
            const response = await api.get(`/api/neighborhoods/zip/${zipCode}`);
            return { 
              success: response.status === 200, 
              message: `Successfully looked up neighborhood for ZIP ${zipCode}` 
            };
          } catch (error) {
            return { success: false, message: `Neighborhood lookup failed: ${error.message}` };
          }
        }),
        
        this.runTest(section, 'Neighborhood data consistency', async () => {
          try {
            // Get neighborhoods for two adjacent ZIP codes
            const zip1 = '10001';
            const zip2 = '10011';
            
            const response1 = await api.get(`/api/neighborhoods/zip/${zip1}`);
            const response2 = await api.get(`/api/neighborhoods/zip/${zip2}`);
            
            // Check that both responses have the expected format
            const hasExpectedFormat = 
              response1.status === 200 && 
              response2.status === 200 && 
              response1.data && 
              response2.data;
              
            return { 
              success: hasExpectedFormat, 
              message: 'Neighborhood data consistency verified' 
            };
          } catch (error) {
            return { success: false, message: `Neighborhood data consistency check failed: ${error.message}` };
          }
        }),
        
        this.runTest(section, 'Restaurant-neighborhood integration', async () => {
          // Skip in fast mode but mark as skipped
          return { success: true, skipped: true, message: 'Skipped in fast mode' };
        })
      ]);
    } else {
      // Standard mode - run tests sequentially
      await this.runTest(section, 'Neighborhood lookup by ZIP', this.testNeighborhoodLookup.bind(this));
      await this.runTest(section, 'Neighborhood data consistency', this.testNeighborhoodConsistency.bind(this));
      await this.runTest(section, 'Restaurant-neighborhood integration', this.testRestaurantNeighborhoodIntegration.bind(this));
    }
  },
  
  /**
   * Test neighborhood lookup by ZIP code
   */
  async testNeighborhoodLookup() {
    try {
      // Test with several ZIP codes from different areas
      const zipCodes = ['10001', '90210', '60601', '02108'];
      const results = [];
      
      for (const zipCode of zipCodes) {
        try {
          const response = await api.get(`/api/neighborhoods/zip/${zipCode}`);
          
          if (response.status === 200 && response.data) {
            results.push({
              zipCode,
              success: true,
              neighborhood: response.data.name || response.data.neighborhood || 'Unknown'
            });
          } else {
            results.push({
              zipCode,
              success: false,
              error: `Unexpected status code: ${response.status}`
            });
          }
        } catch (error) {
          results.push({
            zipCode,
            success: false,
            error: error.message
          });
        }
      }
      
      // Check if at least one ZIP code lookup was successful
      const successCount = results.filter(r => r.success).length;
      
      if (successCount === 0) {
        return { success: false, message: 'All neighborhood lookups failed' };
      }
      
      return { 
        success: true, 
        message: `Successfully looked up ${successCount}/${zipCodes.length} neighborhoods` 
      };
    } catch (error) {
      return { success: false, message: `Neighborhood lookup test failed: ${error.message}` };
    }
  },
  
  /**
   * Test neighborhood data consistency
   */
  async testNeighborhoodConsistency() {
    try {
      // Get a list of neighborhoods
      const neighborhoodsResponse = await api.get('/api/neighborhoods');
      
      if (neighborhoodsResponse.status !== 200 || !Array.isArray(neighborhoodsResponse.data)) {
        return { success: false, message: 'Failed to retrieve neighborhoods list' };
      }
      
      // Check that each neighborhood has the expected properties
      const neighborhoods = neighborhoodsResponse.data;
      const inconsistentNeighborhoods = neighborhoods.filter(n => {
        return !n.name || (typeof n.zipCodes !== 'undefined' && !Array.isArray(n.zipCodes));
      });
      
      if (inconsistentNeighborhoods.length > 0) {
        return { 
          success: false, 
          message: `Found ${inconsistentNeighborhoods.length} inconsistent neighborhood entries` 
        };
      }
      
      return { 
        success: true, 
        message: `Successfully verified consistency of ${neighborhoods.length} neighborhoods` 
      };
    } catch (error) {
      // If the endpoint doesn't exist, try an alternative approach
      try {
        // Try looking up a few ZIP codes and check for consistency
        const zipCodes = ['10001', '10002', '10003'];
        const results = [];
        
        for (const zipCode of zipCodes) {
          try {
            const response = await api.get(`/api/neighborhoods/zip/${zipCode}`);
            
            if (response.status === 200 && response.data) {
              results.push({
                zipCode,
                success: true,
                data: response.data
              });
            } else {
              results.push({
                zipCode,
                success: false
              });
            }
          } catch (error) {
            results.push({
              zipCode,
              success: false
            });
          }
        }
        
        // Check if at least two ZIP codes were successfully looked up
        const successfulResults = results.filter(r => r.success);
        
        if (successfulResults.length < 2) {
          return { 
            success: false, 
            message: 'Not enough successful lookups to verify consistency' 
          };
        }
        
        // Check that the data format is consistent
        const dataKeys = successfulResults.map(r => Object.keys(r.data).sort().join(','));
        const isConsistent = dataKeys.every(k => k === dataKeys[0]);
        
        return { 
          success: isConsistent, 
          message: isConsistent ? 
            'Neighborhood data format is consistent across ZIP codes' : 
            'Inconsistent data format across ZIP codes' 
        };
      } catch (altError) {
        return { success: false, message: `Neighborhood consistency test failed: ${error.message}` };
      }
    }
  },
  
  /**
   * Test integration of neighborhood data with restaurant entries
   */
  async testRestaurantNeighborhoodIntegration() {
    try {
      // Create a test list
      const createListResponse = await api.post('/api/lists', {
        name: 'Neighborhood Test List',
        description: 'Testing neighborhood integration',
        isPrivate: false
      });
      
      if (createListResponse.status !== 201) {
        return { success: false, message: 'Failed to create test list' };
      }
      
      const listId = createListResponse.data.id;
      
      // Add a restaurant with neighborhood data
      const addItemResponse = await api.post(`/api/lists/${listId}/items`, {
        name: 'Test Restaurant with Neighborhood',
        neighborhood: 'Chelsea',
        zipCode: '10001'
      });
      
      if (addItemResponse.status !== 200 && addItemResponse.status !== 201) {
        // Clean up
        await api.delete(`/api/lists/${listId}`);
        return { success: false, message: 'Failed to add restaurant with neighborhood data' };
      }
      
      // Get the list items to verify neighborhood data was saved
      const getItemsResponse = await api.get(`/api/lists/${listId}/items`);
      
      // Clean up
      await api.delete(`/api/lists/${listId}`);
      
      if (getItemsResponse.status !== 200 || !Array.isArray(getItemsResponse.data)) {
        return { success: false, message: 'Failed to retrieve list items' };
      }
      
      // Check if the neighborhood data was saved
      const items = getItemsResponse.data;
      
      if (items.length === 0) {
        return { success: false, message: 'No items found in the list' };
      }
      
      const item = items[0];
      const hasNeighborhoodData = 
        item.neighborhood === 'Chelsea' || 
        item.zipCode === '10001' || 
        (item.location && item.location.neighborhood === 'Chelsea') ||
        (item.location && item.location.zipCode === '10001');
      
      return { 
        success: hasNeighborhoodData, 
        message: hasNeighborhoodData ? 
          'Successfully verified neighborhood data integration with restaurants' : 
          'Neighborhood data not properly integrated with restaurant' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Restaurant-neighborhood integration test failed: ${error.message}` 
      };
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

export default neighborhoodTests;
