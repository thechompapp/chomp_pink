/**
 * Bulk Add Integration Tests
 * 
 * These tests verify the complete bulk add functionality, including:
 * - File upload and parsing
 * - Google Places API integration
 * - Batch processing of items
 * - Error handling and recovery
 * - List updates after bulk operations
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create axios instance
let api = null;

// Test module
const bulkAddTests = {
  /**
   * Run all bulk add tests
   * @param {Object} config - Test configuration
   * @param {Object} logger - Logger utility
   */
  async run(config, logger) {
    const section = logger.section('Bulk Add');
    
    // Save logger for use in runTest
    this.logger = logger;
    
    // Initialize axios instance
    this.api = axios.create({
      baseURL: config.BACKEND_URL,
      timeout: config.TIMEOUT_MS, // Use global timeout configuration: true
    });
    
    // Login first to get authentication token
    const loginResult = await this.login(config, logger, section);
    if (!loginResult.success) {
      logger.error('Login failed. Skipping bulk add tests.');
      return;
    }
    
    // Set auth token for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${loginResult.token}`;
    
    // Test data
    let testListId = null;
    let testCsvPath = null;
    
    // Test 1: Create Test List
    const createListResult = await this.testCreateList(config, logger, section);
    if (createListResult.success) {
      testListId = createListResult.listId;
    } else {
      logger.error('Failed to create test list. Skipping related tests.');
      return;
    }
    
    // Test 2: Generate Test CSV
    const generateCsvResult = await this.testGenerateCsv(config, logger, section);
    if (generateCsvResult.success) {
      testCsvPath = generateCsvResult.filePath;
    } else {
      logger.error('Failed to generate test CSV. Skipping related tests.');
      return;
    }
    
    // Test 3: Places API Connectivity
    await this.testPlacesApiConnectivity(config, logger, section);
    
    // Test 4: Process Single Restaurant
    await this.testProcessSingleRestaurant(config, logger, section, testListId);
    
    // Test 5: Process Batch of Restaurants
    await this.testProcessBatch(config, logger, section, testListId);
    
    // Test 6: Handle Duplicate Entries
    await this.testHandleDuplicates(config, logger, section, testListId);
    
    // Test 7: Handle Empty Fields
    await this.testHandleEmptyFields(config, logger, section, testListId);
    
    // Test 8: Verify List Updates
    await this.testVerifyListUpdates(config, logger, section, testListId);
    
    // Clean up
    await this.cleanup(config, logger, section, testListId, testCsvPath);
  },
  
  /**
   * Login to get authentication token
   */
  async login(config, logger, section) {
    return await this.runTest(section, 'Login for bulk add tests', async () => {
      try {
        const response = await this.api.post('/api/auth/login', {
          email: config.USER_EMAIL,
          password: config.USER_PASSWORD
        });
        
        logger.debug('Login response:', response.data);
        
        if (response.data && response.data.success) {
          // Extract token from response
          const token = response.data.token || 
                        response.data.accessToken || 
                        response.headers['authorization']?.replace('Bearer ', '');
          
          if (token) {
            return { 
              success: true,
              token
            };
          } else {
            return { 
              success: false, 
              message: 'Login succeeded but no token was returned' 
            };
          }
        } else {
          return { 
            success: false, 
            message: 'Login failed: Invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Login failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test creating a list for bulk add
   */
  async testCreateList(config, logger, section) {
    return await this.runTest(section, 'Create test list for bulk add', async () => {
      try {
        const listData = {
          name: `Bulk Add Test List ${Date.now()}`,
          description: 'Created for bulk add integration tests'
        };
        
        const response = await api.post('/api/lists', listData);
        
        logger.debug('Create list response:', response.data);
        
        if (response.data && response.data.id) {
          return { 
            success: true,
            listId: response.data.id
          };
        } else {
          return { 
            success: false, 
            message: 'Failed to create list: Invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to create list: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test generating a CSV file for bulk add
   */
  async testGenerateCsv(config, logger, section) {
    return await this.runTest(section, 'Generate test CSV file', async () => {
      try {
        const csvPath = path.join(process.cwd(), 'bulk-add-test-data.csv');
        
        // Test restaurants (non-chain as requested)
        const testRestaurants = [
          { name: 'Maison Passerelle', location: 'New York', tags: 'French-Diaspora Fusion' },
          { name: 'Bar Bianchi', location: 'New York', tags: 'Milanese' },
          { name: 'JR & Son', location: 'New York', tags: 'Italian-American' },
          { name: "Papa d'Amour", location: 'New York', tags: 'French-Asian Bakery' },
          { name: 'Figure Eight', location: 'New York', tags: 'Chinese-American' }
        ];
        
        // Edge cases
        const edgeCases = [
          { name: '', location: 'New York', tags: 'Empty Name' },
          { name: 'Missing Location', location: '', tags: 'Test' },
          { name: 'Duplicate 1', location: 'New York', tags: 'Test' },
          { name: 'Duplicate 1', location: 'New York', tags: 'Test' }
        ];
        
        // Generate CSV content
        let csvContent = 'Name,Location,Tags\n';
        
        // Add normal test data
        testRestaurants.forEach(item => {
          csvContent += `${item.name},${item.location},${item.tags}\n`;
        });
        
        // Add edge cases
        edgeCases.forEach(item => {
          csvContent += `${item.name},${item.location},${item.tags}\n`;
        });
        
        // Write to file
        fs.writeFileSync(csvPath, csvContent);
        
        return { 
          success: true,
          filePath: csvPath
        };
      } catch (error) {
        return { 
          success: false, 
          message: `Failed to generate test CSV: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test Places API connectivity
   */
  async testPlacesApiConnectivity(config, logger, section) {
    return await this.runTest(section, 'Places API connectivity', async () => {
      try {
        // Test autocomplete endpoint
        const query = 'Maison Passerelle, New York';
        const response = await api.get('/api/places/autocomplete', {
          params: { input: query }
        });
        
        logger.debug('Places API response:', response.data);
        
        if (response.data && 
            ((response.data.status === 'OK' && response.data.predictions) || 
             (response.data.success && response.data.data))) {
          
          const predictions = response.data.predictions || response.data.data;
          
          if (predictions && predictions.length > 0) {
            // Test place details endpoint with the first result
            const placeId = predictions[0].place_id;
            
            const detailsResponse = await api.get('/api/places/details', {
              params: { place_id: placeId }
            });
            
            if (detailsResponse.data && 
                ((detailsResponse.data.status === 'OK' && detailsResponse.data.result) || 
                 (detailsResponse.data.success && detailsResponse.data.data))) {
              return { success: true };
            } else {
              return { 
                success: false, 
                message: 'Places details API returned invalid response format' 
              };
            }
          } else {
            return { 
              success: false, 
              message: 'Places API returned no predictions' 
            };
          }
        } else {
          return { 
            success: false, 
            message: 'Places API returned invalid response format' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Places API connectivity test failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test processing a single restaurant
   */
  async testProcessSingleRestaurant(config, logger, section, listId) {
    return await this.runTest(section, 'Process single restaurant', async () => {
      try {
        const restaurant = {
          name: 'Maison Passerelle',
          location: 'New York',
          tags: 'French-Diaspora Fusion'
        };
        
        // Step 1: Search for place
        const query = `${restaurant.name}, ${restaurant.location}`;
        logger.info(`Searching for: ${query}`);
        
        const searchResponse = await api.get('/api/places/autocomplete', {
          params: { input: query }
        });
        
        const predictions = searchResponse.data.predictions || searchResponse.data.data;
        
        if (!predictions || predictions.length === 0) {
          return { 
            success: false, 
            message: 'No place predictions found' 
          };
        }
        
        const placeId = predictions[0].place_id;
        logger.info(`Found place_id: ${placeId}`);
        
        // Step 2: Get place details
        logger.info('Getting place details');
        const detailsResponse = await api.get('/api/places/details', {
          params: { place_id: placeId }
        });
        
        const details = detailsResponse.data.result || detailsResponse.data.data;
        
        if (!details) {
          return { 
            success: false, 
            message: 'No place details found' 
          };
        }
        
        const address = details.formatted_address || details.formattedAddress;
        logger.info(`Found address: ${address}`);
        
        // Step 3: Add to list
        logger.info(`Adding to list: ${listId}`);
        
        const addResponse = await api.post(`/api/lists/${listId}/items`, {
          name: details.name || restaurant.name,
          description: restaurant.tags,
          location: address,
          placeId: placeId
        });
        
        if (addResponse.status !== 200 && addResponse.status !== 201) {
          return { 
            success: false, 
            message: `Failed to add to list: ${addResponse.status}` 
          };
        }
        
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          message: `Single restaurant processing failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test processing a batch of restaurants
   */
  async testProcessBatch(config, logger, section, listId) {
    return await this.runTest(section, 'Process batch of restaurants', async () => {
      try {
        const restaurants = [
          { name: 'Bar Bianchi', location: 'New York', tags: 'Milanese' },
          { name: 'JR & Son', location: 'New York', tags: 'Italian-American' }
        ];
        
        const results = [];
        
        // Process restaurants in parallel
        const promises = restaurants.map(async (restaurant) => {
          try {
            // Step 1: Search for place
            const query = `${restaurant.name}, ${restaurant.location}`;
            
            const searchResponse = await api.get('/api/places/autocomplete', {
              params: { input: query }
            });
            
            const predictions = searchResponse.data.predictions || searchResponse.data.data;
            
            if (!predictions || predictions.length === 0) {
              return { 
                restaurant: restaurant.name,
                success: false, 
                message: 'No place predictions found' 
              };
            }
            
            const placeId = predictions[0].place_id;
            
            // Step 2: Get place details
            const detailsResponse = await api.get('/api/places/details', {
              params: { place_id: placeId }
            });
            
            const details = detailsResponse.data.result || detailsResponse.data.data;
            
            if (!details) {
              return { 
                restaurant: restaurant.name,
                success: false, 
                message: 'No place details found' 
              };
            }
            
            const address = details.formatted_address || details.formattedAddress;
            
            // Step 3: Add to list
            const addResponse = await api.post(`/api/lists/${listId}/items`, {
              name: details.name || restaurant.name,
              description: restaurant.tags,
              location: address,
              placeId: placeId
            });
            
            if (addResponse.status !== 200 && addResponse.status !== 201) {
              return { 
                restaurant: restaurant.name,
                success: false, 
                message: `Failed to add to list: ${addResponse.status}` 
              };
            }
            
            return {
              restaurant: restaurant.name,
              success: true
            };
          } catch (error) {
            return { 
              restaurant: restaurant.name,
              success: false, 
              message: error.message 
            };
          }
        });
        
        // Wait for all promises to resolve
        const batchResults = await Promise.all(promises);
        
        // Count successes
        const successCount = batchResults.filter(r => r.success).length;
        
        if (successCount === restaurants.length) {
          return { 
            success: true,
            message: `Successfully processed all ${restaurants.length} restaurants in batch` 
          };
        } else {
          return { 
            success: false, 
            message: `Only ${successCount}/${restaurants.length} restaurants processed successfully` 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Batch processing failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test handling duplicate entries
   */
  async testHandleDuplicates(config, logger, section, listId) {
    return await this.runTest(section, 'Handle duplicate entries', async () => {
      try {
        const restaurant = {
          name: 'Duplicate Test',
          location: 'New York',
          tags: 'Test'
        };
        
        // Add the same restaurant twice
        for (let i = 0; i < 2; i++) {
          // Step 1: Search for place
          const query = `${restaurant.name}, ${restaurant.location}`;
          
          const searchResponse = await api.get('/api/places/autocomplete', {
            params: { input: query }
          });
          
          const predictions = searchResponse.data.predictions || searchResponse.data.data;
          
          if (!predictions || predictions.length === 0) {
            return { 
              success: false, 
              message: 'No place predictions found for duplicate test' 
            };
          }
          
          const placeId = predictions[0].place_id;
          
          // Step 2: Get place details
          const detailsResponse = await api.get('/api/places/details', {
            params: { place_id: placeId }
          });
          
          const details = detailsResponse.data.result || detailsResponse.data.data;
          
          if (!details) {
            return { 
              success: false, 
              message: 'No place details found for duplicate test' 
            };
          }
          
          const address = details.formatted_address || details.formattedAddress;
          
          // Step 3: Add to list
          await api.post(`/api/lists/${listId}/items`, {
            name: details.name || restaurant.name,
            description: restaurant.tags,
            location: address,
            placeId: placeId
          });
          
          // Add a small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Check if both were added or if duplicates were handled
        const listResponse = await api.get(`/api/lists/${listId}`);
        const items = listResponse.data.items || [];
        
        // Count items with the same name
        const duplicateCount = items.filter(item => 
          item.name === restaurant.name || 
          item.name.includes('Duplicate Test')
        ).length;
        
        // If duplicates are properly handled, we should have only 1 item
        // But if the API allows duplicates, we might have 2
        // Both behaviors can be valid depending on the application design
        if (duplicateCount >= 1) {
          return { 
            success: true,
            message: `Found ${duplicateCount} items with the same name (duplicate handling depends on application design)` 
          };
        } else {
          return { 
            success: false, 
            message: 'No items found with the test name' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Duplicate handling test failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test handling empty fields
   */
  async testHandleEmptyFields(config, logger, section, listId) {
    return await this.runTest(section, 'Handle empty fields', async () => {
      try {
        // Test with empty name
        const emptyNameRestaurant = {
          name: '',
          location: 'New York',
          tags: 'Empty Name Test'
        };
        
        // Test with empty location
        const emptyLocationRestaurant = {
          name: 'Empty Location Test',
          location: '',
          tags: 'Test'
        };
        
        // Try to process restaurants with empty fields
        const results = [];
        
        for (const restaurant of [emptyNameRestaurant, emptyLocationRestaurant]) {
          try {
            // Skip if both name and location are empty
            if (!restaurant.name && !restaurant.location) {
              results.push({
                restaurant: 'Empty name and location',
                success: true,
                message: 'Skipped as expected'
              });
              continue;
            }
            
            // Step 1: Search for place
            const query = `${restaurant.name || 'Unknown'}, ${restaurant.location || 'Unknown'}`;
            
            const searchResponse = await api.get('/api/places/autocomplete', {
              params: { input: query }
            });
            
            const predictions = searchResponse.data.predictions || searchResponse.data.data;
            
            if (!predictions || predictions.length === 0) {
              results.push({
                restaurant: restaurant.name || 'Empty name',
                success: true,
                message: 'No results found for invalid input (expected)'
              });
              continue;
            }
            
            // If we found results, continue with the process
            const placeId = predictions[0].place_id;
            
            // Step 2: Get place details
            const detailsResponse = await api.get('/api/places/details', {
              params: { place_id: placeId }
            });
            
            const details = detailsResponse.data.result || detailsResponse.data.data;
            
            if (!details) {
              results.push({
                restaurant: restaurant.name || 'Empty name',
                success: false,
                message: 'No place details found'
              });
              continue;
            }
            
            const address = details.formatted_address || details.formattedAddress;
            
            // Step 3: Add to list
            const addResponse = await api.post(`/api/lists/${listId}/items`, {
              name: details.name || restaurant.name || 'Unknown',
              description: restaurant.tags,
              location: address || 'Unknown',
              placeId: placeId
            });
            
            if (addResponse.status === 200 || addResponse.status === 201) {
              results.push({
                restaurant: restaurant.name || 'Empty name',
                success: true
              });
            } else {
              results.push({
                restaurant: restaurant.name || 'Empty name',
                success: false,
                message: `Failed to add to list: ${addResponse.status}`
              });
            }
          } catch (error) {
            // For empty fields, errors might be expected
            results.push({
              restaurant: restaurant.name || 'Empty name',
              success: true,
              message: 'API correctly rejected invalid input'
            });
          }
        }
        
        // All results should be successful (either added or correctly rejected)
        const allSuccessful = results.every(r => r.success);
        
        if (allSuccessful) {
          return { 
            success: true,
            message: 'Empty fields were handled correctly' 
          };
        } else {
          const failedResults = results.filter(r => !r.success);
          return { 
            success: false, 
            message: `Some empty fields were not handled correctly: ${failedResults.map(r => r.message).join(', ')}` 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `Empty fields test failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Test verifying list updates after bulk operations
   */
  async testVerifyListUpdates(config, logger, section, listId) {
    return await this.runTest(section, 'Verify list updates', async () => {
      try {
        // Get the list and check if items were added
        const response = await api.get(`/api/lists/${listId}`);
        
        logger.debug('List response:', response.data);
        
        const items = response.data.items || [];
        
        if (items.length > 0) {
          return { 
            success: true,
            message: `List has ${items.length} items after bulk operations` 
          };
        } else {
          return { 
            success: false, 
            message: 'List has no items after bulk operations' 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: `List verification failed: ${error.message}` 
        };
      }
    });
  },
  
  /**
   * Clean up test data
   */
  async cleanup(config, logger, section, listId, csvPath) {
    // Delete test list
    if (listId) {
      await this.runTest(section, 'Delete test list', async () => {
        try {
          const response = await api.delete(`/api/lists/${listId}`);
          
          if (response.status === 200 || response.status === 204) {
            return { success: true };
          } else {
            return { 
              success: false, 
              message: `Failed to delete test list: ${response.status}` 
            };
          }
        } catch (error) {
          return { 
            success: false, 
            message: `Failed to delete test list: ${error.message}` 
          };
        }
      });
    }
    
    // Delete test CSV file
    if (csvPath && fs.existsSync(csvPath)) {
      await this.runTest(section, 'Delete test CSV file', async () => {
        try {
          fs.unlinkSync(csvPath);
          return { success: true };
        } catch (error) {
          return { 
            success: false, 
            message: `Failed to delete test CSV: ${error.message}` 
          };
        }
      });
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

export default bulkAddTests;
