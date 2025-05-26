/**
 * Bulk Add Operations E2E Test Suite
 * 
 * This test suite covers the bulk add operations-related test case specified in TSINSTRUCTION.md:
 * - Test Case 6.1: Bulk Add Multiple Dishes to a New List
 */

import { 
  login, 
  register,
  createList,
  bulkAddItemsToList,
  getListById,
  createRestaurant
} from '../setup/robust-api-client.js';
import { generateTestUser } from '../setup/test-users.js';
import { initializeDatabase } from '../setup/db-init.js';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

describe('Bulk Add Operations E2E Tests', function() {
  this.timeout(20000); // Set timeout to 20 seconds
  
  let testUser;
  let authToken;
  let testRestaurants = [];
  
  before(async function() {
    // Initialize the database
    console.log('Initializing database...');
    await initializeDatabase();
    
    // Create and register a test user
    testUser = generateTestUser();
    console.log(`Creating test user: ${testUser.email}`);
    
    try {
      // Register the test user
      await register(testUser);
      
      // Login with the test user
      const loginResponse = await login({
        email: testUser.email,
        password: testUser.password
      });
      
      console.log('User logged in successfully');
      authToken = loginResponse.data.token;
      
      // Create test restaurants
      const restaurantData = [
        {
          name: 'Italian Restaurant for Bulk Test',
          description: 'Italian cuisine for bulk testing',
          address: '123 Bulk St, Test City, TC 12345',
          cuisine: 'Italian',
          price_range: '$$'
        },
        {
          name: 'Mexican Restaurant for Bulk Test',
          description: 'Mexican cuisine for bulk testing',
          address: '456 Bulk St, Test City, TC 12345',
          cuisine: 'Mexican',
          price_range: '$'
        },
        {
          name: 'Japanese Restaurant for Bulk Test',
          description: 'Japanese cuisine for bulk testing',
          address: '789 Bulk St, Test City, TC 12345',
          cuisine: 'Japanese',
          price_range: '$$$'
        }
      ];
      
      for (const restaurant of restaurantData) {
        const response = await createRestaurant(restaurant);
        testRestaurants.push(response.data);
        console.log(`Created test restaurant: ${response.data.name}`);
      }
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 6.1: Bulk Add Multiple Dishes to a New List
   */
  it('should bulk add multiple dishes to a new list', async function() {
    try {
      // Create a new list
      const listData = {
        name: 'Bulk Add Test List',
        description: 'A list for testing bulk add functionality'
      };
      
      const listResponse = await createList(listData);
      
      expect(listResponse).to.be.an('object');
      expect(listResponse.success).to.be.true;
      expect(listResponse.data).to.be.an('object');
      expect(listResponse.data.id).to.be.a('number');
      
      const listId = listResponse.data.id;
      console.log(`Created list with ID: ${listId}`);
      
      // Prepare bulk items data
      const bulkItems = [
        {
          name: 'Pasta Carbonara',
          description: 'Classic Italian pasta dish',
          price: 14.99,
          category: 'Pasta',
          restaurant_id: testRestaurants[0].id,
          notes: 'Must try this!'
        },
        {
          name: 'Tacos al Pastor',
          description: 'Traditional Mexican tacos',
          price: 9.99,
          category: 'Tacos',
          restaurant_id: testRestaurants[1].id,
          notes: 'Highly recommended'
        },
        {
          name: 'Sushi Platter',
          description: 'Assorted fresh sushi',
          price: 24.99,
          category: 'Sushi',
          restaurant_id: testRestaurants[2].id,
          notes: 'Great for sharing'
        },
        {
          name: 'Tiramisu',
          description: 'Italian coffee-flavored dessert',
          price: 8.99,
          category: 'Dessert',
          restaurant_id: testRestaurants[0].id,
          notes: 'Perfect ending to a meal'
        },
        {
          name: 'Miso Soup',
          description: 'Traditional Japanese soup',
          price: 4.99,
          category: 'Soup',
          restaurant_id: testRestaurants[2].id,
          notes: 'Good starter'
        }
      ];
      
      // Bulk add items to the list
      const bulkAddResponse = await bulkAddItemsToList(listId, bulkItems);
      
      expect(bulkAddResponse).to.be.an('object');
      expect(bulkAddResponse.success).to.be.true;
      expect(bulkAddResponse.data).to.be.an('object');
      expect(bulkAddResponse.data.added).to.be.a('number');
      expect(bulkAddResponse.data.added).to.equal(bulkItems.length);
      
      console.log(`Added ${bulkAddResponse.data.added} items to the list`);
      
      // Verify the items were added by getting list details
      const listDetailsResponse = await getListById(listId);
      
      expect(listDetailsResponse).to.be.an('object');
      expect(listDetailsResponse.success).to.be.true;
      expect(listDetailsResponse.data).to.be.an('object');
      expect(listDetailsResponse.data.items).to.be.an('array');
      expect(listDetailsResponse.data.items.length).to.equal(bulkItems.length);
      
      // Verify each item in the list
      for (const bulkItem of bulkItems) {
        const foundItem = listDetailsResponse.data.items.find(item => 
          item.name === bulkItem.name && 
          parseFloat(item.price) === bulkItem.price
        );
        
        expect(foundItem).to.exist;
        expect(foundItem.notes).to.equal(bulkItem.notes);
      }
      
      console.log(`Successfully verified all ${bulkItems.length} items in the list`);
    } catch (error) {
      console.error('Error in bulk add test:', error);
      throw error;
    }
  });
});
