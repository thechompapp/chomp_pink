// Test script for bulk add functionality
import { adminService } from './src/services/adminService.js';
import { handleApiResponse } from './src/utils/serviceHelpers.js';
import { logDebug, logError } from './src/utils/logger.js';

// Mock API client for testing
const mockApiClient = {
  post: async (endpoint, data) => {
    console.log(`Mock API call to ${endpoint}`);
    console.log('Payload:', JSON.stringify(data, null, 2));
    
    // Simulate API responses based on the endpoint
    if (endpoint === '/admin/check-existing/restaurants') {
      // Simulate duplicate check response
      if (!data || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return {
          data: {
            success: false,
            message: 'No items provided to check.'
          }
        };
      }
      
      // Simulate finding duplicates for known restaurant names
      const knownRestaurants = ['Claro', 'Fandi Mata', 'Peaches', 'Miss Lily\'s', 'Shukette'];
      const results = data.items.map(item => {
        const isDuplicate = knownRestaurants.includes(item.name);
        return {
          item: item,
          existing: isDuplicate ? {
            id: Math.floor(Math.random() * 1000),
            name: item.name,
            city: null,
            neighborhood: null,
            tags: []
          } : null
        };
      });
      
      return {
        data: {
          success: true,
          message: `Checked ${data.items.length} items for duplicates.`,
          results: results
        }
      };
    } else if (endpoint === '/admin/bulk/restaurants') {
      // Simulate bulk add response
      if (!data || !data.items || !Array.isArray(data.items) || data.items.length === 0) {
        return {
          data: {
            success: false,
            message: 'No items provided for bulk add.'
          }
        };
      }
      
      // Simulate creating new items
      const createdItems = data.items.map(item => ({
        id: Math.floor(Math.random() * 1000),
        name: item.name,
        city: null,
        neighborhood: null,
        tags: []
      }));
      
      return {
        data: {
          success: true,
          message: 'Bulk add for restaurants processed.',
          successCount: createdItems.length,
          failureCount: 0,
          errors: [],
          createdItems: createdItems
        }
      };
    }
    
    return {
      data: {
        success: false,
        message: 'Unknown endpoint'
      }
    };
  }
};

// Replace the real apiClient with our mock for testing
globalThis.apiClient = mockApiClient;

// Test functions
async function testDuplicateDetection() {
  console.log('\n=== Testing Duplicate Detection ===');
  
  // Test with incorrect format (direct array)
  try {
    console.log('\nTest 1: Incorrect format (direct array)');
    const incorrectPayload = [
      {name: 'Claro', type: 'restaurant', city_id: 1, _lineNumber: 1},
      {name: 'Fandi Mata', type: 'restaurant', city_id: 1, _lineNumber: 2}
    ];
    const incorrectResponse = await adminService.checkExistingItems(incorrectPayload);
    console.log('Response:', JSON.stringify(incorrectResponse, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test with correct format (object with items property)
  try {
    console.log('\nTest 2: Correct format (object with items property)');
    const correctPayload = {
      items: [
        {name: 'Claro', type: 'restaurant', city_id: 1, _lineNumber: 1},
        {name: 'Fandi Mata', type: 'restaurant', city_id: 1, _lineNumber: 2},
        {name: 'Test Restaurant', type: 'restaurant', city_id: 1, _lineNumber: 3}
      ]
    };
    const correctResponse = await adminService.checkExistingItems(correctPayload);
    console.log('Response:', JSON.stringify(correctResponse, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test with empty items array
  try {
    console.log('\nTest 3: Empty items array');
    const emptyPayload = {items: []};
    const emptyResponse = await adminService.checkExistingItems(emptyPayload);
    console.log('Response:', JSON.stringify(emptyResponse, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testBulkAdd() {
  console.log('\n=== Testing Bulk Add ===');
  
  // Test with mixed items (duplicates and unique)
  try {
    console.log('\nTest 1: Mixed items (duplicates and unique)');
    const mixedPayload = {
      items: [
        {name: 'Claro', type: 'restaurant', city_id: 1, _lineNumber: 1},
        {name: 'Test Restaurant 1', type: 'restaurant', city_id: 1, _lineNumber: 2},
        {name: 'Test Restaurant 2', type: 'restaurant', city_id: 1, _lineNumber: 3}
      ]
    };
    const mixedResponse = await adminService.bulkAddItems(mixedPayload);
    console.log('Response:', JSON.stringify(mixedResponse, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test with empty items array
  try {
    console.log('\nTest 2: Empty items array');
    const emptyPayload = {items: []};
    const emptyResponse = await adminService.bulkAddItems(emptyPayload);
    console.log('Response:', JSON.stringify(emptyResponse, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');
  
  // Test handleApiResponse with successful response
  try {
    console.log('\nTest 1: handleApiResponse with successful response');
    const successResponse = await handleApiResponse(
      () => Promise.resolve({
        data: {
          success: true,
          message: 'Operation successful',
          data: {result: 'success'}
        }
      }),
      'Test Context'
    );
    console.log('Response:', JSON.stringify(successResponse, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  
  // Test handleApiResponse with error response
  try {
    console.log('\nTest 2: handleApiResponse with error response');
    const errorResponse = await handleApiResponse(
      () => Promise.reject(new Error('Test error')),
      'Test Context'
    );
    console.log('Response:', JSON.stringify(errorResponse, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testDuplicateDetection();
    await testBulkAdd();
    await testErrorHandling();
    
    console.log('\n=== All Tests Completed ===');
  } catch (error) {
    console.error('Test suite error:', error);
  }
}

// Execute tests
runAllTests();
