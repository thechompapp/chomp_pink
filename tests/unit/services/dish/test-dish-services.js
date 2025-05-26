/**
 * Standalone test script for dish services
 * 
 * This script manually tests the dish services without relying on the test framework
 */
import { dishCrudService } from '../../../../src/services/dish/DishCrudService.js';
import { dishSearchService } from '../../../../src/services/dish/DishSearchService.js';
import { dishService } from '../../../../src/services/dish/index.js';

// Mock API client
const mockApiClient = (responseData) => {
  return Promise.resolve({ data: responseData });
};

// Override the actual API client with our mock
global.apiClient = mockApiClient;

// Test function
async function runTests() {
  console.log('🧪 Testing Dish Services...');
  
  try {
    // Test DishCrudService
    console.log('\n📋 Testing DishCrudService...');
    
    // Mock a dish response
    const mockDish = {
      id: '123',
      name: 'Test Dish',
      description: 'A delicious test dish',
      price: 12.99,
      restaurantId: '456'
    };
    
    // Test getDishDetails
    console.log('  - Testing getDishDetails...');
    const dishDetailsResult = await dishCrudService.getDishDetails('123');
    console.log(`    Result: ${dishDetailsResult.success ? '✅ Success' : '❌ Failed'}`);
    
    // Test DishSearchService
    console.log('\n🔍 Testing DishSearchService...');
    
    // Test searchDishes
    console.log('  - Testing searchDishes...');
    const searchResult = await dishSearchService.searchDishes({ query: 'pasta' });
    console.log(`    Result: ${searchResult.success ? '✅ Success' : '❌ Failed'}`);
    
    // Test unified dishService
    console.log('\n🔄 Testing unified dishService...');
    
    // Test backward compatibility
    console.log('  - Testing backward compatibility...');
    const unifiedResult = await dishService.getDishDetails('123');
    console.log(`    Result: ${unifiedResult.success ? '✅ Success' : '❌ Failed'}`);
    
    console.log('\n✅ All tests completed!');
    console.log('Note: These are mock tests to verify the structure and delegation patterns.');
    console.log('For actual functionality testing, use the test framework with proper mocks.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the tests
runTests();
