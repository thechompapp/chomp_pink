/**
 * Bulk Add Refactored E2E Test
 * 
 * Tests the refactored bulk add feature end-to-end.
 * Uses the E2E testing endpoints as specified in the application.
 */
import { 
  login, 
  register,
  createList,
  bulkAddItemsToList,
  getListById,
  createRestaurant
} from '../../setup/robust-api-client.js';
import { generateTestUser } from '../../setup/test-users.js';
import { initializeDatabase } from '../../setup/db-init.js';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';

describe('Refactored Bulk Add Feature E2E Tests', function() {
  this.timeout(30000); // Set timeout to 30 seconds for API calls
  
  let testUser;
  let authToken;
  let testList;
  
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
      
      // Create a test list for bulk add operations
      const listData = {
        name: 'Bulk Add Test List',
        description: 'A list for testing the refactored bulk add functionality'
      };
      
      const listResponse = await createList(listData);
      
      expect(listResponse).to.be.an('object');
      expect(listResponse.success).to.be.true;
      expect(listResponse.data).to.be.an('object');
      expect(listResponse.data.id).to.be.a('number');
      
      testList = listResponse.data;
      console.log(`Created test list with ID: ${testList.id}`);
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  /**
   * Test Case: Bulk Add Restaurants
   * Tests the bulk addition of multiple restaurants using the E2E testing endpoints
   */
  it('should bulk add multiple restaurants', async function() {
    try {
      // Prepare bulk items data with the provided sample restaurants
      const bulkItems = [
        {
          name: 'Maison Passerelle',
          description: 'French-Diaspora Fusion restaurant in New York',
          address: '123 Fusion Ave, New York, NY 10001',
          cuisine: 'French-Diaspora Fusion',
          price_range: '$$$',
          neighborhood_id: 1
        },
        {
          name: 'Bar Bianchi',
          description: 'Authentic Milanese cuisine in New York',
          address: '456 Milan St, New York, NY 10002',
          cuisine: 'Milanese',
          price_range: '$$',
          neighborhood_id: 2
        },
        {
          name: 'JR & Son',
          description: 'Classic Italian-American restaurant in New York',
          address: '789 Little Italy Blvd, New York, NY 10003',
          cuisine: 'Italian-American',
          price_range: '$$',
          neighborhood_id: 3
        },
        {
          name: 'Papa d\'Amour',
          description: 'Innovative French-Asian Bakery in New York',
          address: '101 Pastry Lane, New York, NY 10004',
          cuisine: 'French-Asian Bakery',
          price_range: '$$',
          neighborhood_id: 4
        },
        {
          name: 'Figure Eight',
          description: 'Modern Chinese-American cuisine in New York',
          address: '888 Lucky St, New York, NY 10005',
          cuisine: 'Chinese-American',
          price_range: '$$',
          neighborhood_id: 5
        }
      ];
      
      // Add restaurants using the E2E testing endpoint
      const restaurants = [];
      
      for (const item of bulkItems) {
        const response = await createRestaurant(item);
        expect(response).to.be.an('object');
        expect(response.success).to.be.true;
        expect(response.data).to.be.an('object');
        expect(response.data.id).to.be.a('number');
        
        restaurants.push(response.data);
        console.log(`Created test restaurant: ${response.data.name} with ID: ${response.data.id}`);
      }
      
      // Verify restaurants were created successfully
      expect(restaurants.length).to.equal(bulkItems.length);
      
      // Now bulk add these restaurants to the test list
      const listItems = restaurants.map(restaurant => ({
        restaurant_id: restaurant.id,
        notes: `Added via bulk add E2E test for ${restaurant.name}`
      }));
      
      const bulkAddResponse = await bulkAddItemsToList(testList.id, listItems);
      
      expect(bulkAddResponse).to.be.an('object');
      expect(bulkAddResponse.success).to.be.true;
      expect(bulkAddResponse.data).to.be.an('object');
      expect(bulkAddResponse.data.added).to.be.a('number');
      expect(bulkAddResponse.data.added).to.equal(listItems.length);
      
      console.log(`Added ${bulkAddResponse.data.added} items to the list`);
      
      // Verify the items were added by getting list details
      const listDetailsResponse = await getListById(testList.id);
      
      expect(listDetailsResponse).to.be.an('object');
      expect(listDetailsResponse.success).to.be.true;
      expect(listDetailsResponse.data).to.be.an('object');
      expect(listDetailsResponse.data.items).to.be.an('array');
      expect(listDetailsResponse.data.items.length).to.equal(listItems.length);
      
      // Verify each restaurant is in the list
      for (const restaurant of restaurants) {
        const foundItem = listDetailsResponse.data.items.find(item => 
          item.restaurant_id === restaurant.id
        );
        
        expect(foundItem).to.exist;
        expect(foundItem.notes).to.include(`Added via bulk add E2E test for ${restaurant.name}`);
      }
      
      console.log(`Successfully verified all ${listItems.length} items in the list`);
    } catch (error) {
      console.error('Error in bulk add test:', error);
      throw error;
    }
  });
  
  /**
   * Test Case: Bulk Add with Error Handling
   * Tests the error handling capabilities of the bulk add feature
   */
  it('should handle errors during bulk add operations', async function() {
    try {
      // Prepare bulk items data with some valid and invalid items based on the sample data
      const bulkItems = [
        {
          name: 'Maison Passerelle Test',
          description: 'French-Diaspora Fusion restaurant in New York',
          address: '123 Fusion Ave, New York, NY 10001',
          cuisine: 'French-Diaspora Fusion',
          price_range: '$$$',
          neighborhood_id: 1
        },
        {
          // Missing required fields
          name: 'Invalid Restaurant Entry',
          // No address, cuisine, etc.
        }
      ];
      
      // Add restaurants using the E2E testing endpoint
      const restaurants = [];
      let validCount = 0;
      let errorCount = 0;
      
      for (const item of bulkItems) {
        try {
          const response = await createRestaurant(item);
          
          if (response.success) {
            restaurants.push(response.data);
            validCount++;
            console.log(`Created test restaurant: ${response.data.name} with ID: ${response.data.id}`);
          }
        } catch (error) {
          errorCount++;
          console.log(`Expected error for invalid restaurant: ${error.message}`);
        }
      }
      
      // Verify error handling worked as expected
      expect(validCount).to.equal(1); // Only one valid restaurant
      expect(errorCount).to.equal(1); // One error for the invalid restaurant
      
      // Now bulk add the valid restaurants to the test list
      if (restaurants.length > 0) {
        const listItems = restaurants.map(restaurant => ({
          restaurant_id: restaurant.id,
          notes: `Added via error handling E2E test for ${restaurant.name}`
        }));
        
        const bulkAddResponse = await bulkAddItemsToList(testList.id, listItems);
        
        expect(bulkAddResponse).to.be.an('object');
        expect(bulkAddResponse.success).to.be.true;
        expect(bulkAddResponse.data).to.be.an('object');
        expect(bulkAddResponse.data.added).to.be.a('number');
        expect(bulkAddResponse.data.added).to.equal(listItems.length);
        
        console.log(`Added ${bulkAddResponse.data.added} valid items to the list`);
      }
    } catch (error) {
      console.error('Error in error handling test:', error);
      throw error;
    }
  });
});
