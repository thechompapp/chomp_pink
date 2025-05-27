/**
 * Bulk Add Semicolon Format E2E Test
 * 
 * Tests the bulk add feature with semicolon-delimited input format.
 * Follows the project's E2E testing patterns and uses the robust API client.
 */
import { 
  login, 
  register,
  createList,
  bulkAddItemsToList,
  getListById,
  createRestaurant,
  cleanupTestData
} from '../../setup/robust-api-client.js';
import { generateTestUser } from '../../setup/test-users.js';
import { initializeDatabase } from '../../setup/db-init.js';
import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';

// Test timeout (30 seconds)
const TEST_TIMEOUT = 30000;
describe('Bulk Add Semicolon Format E2E Tests', function() {
  this.timeout(30000); // Set timeout to 30 seconds for API calls
  
  let testUser;
  let authToken;
  let testList;
  let testRestaurants = [];
  
  before(async function() {
    try {
      // Initialize test database if needed
      await initializeDatabase();
      
      // Create and register a test user
      testUser = generateTestUser();
      console.log(`Creating test user: ${testUser.email}`);
      
      // Register the test user
      await register(testUser);
      
      // Login with the test user
      const loginResponse = await login({
        email: testUser.email,
        password: testUser.password
      });
      
      authToken = loginResponse.data.token;
      console.log('User logged in successfully');
      
      // Create a test list for bulk add operations
      const listData = {
        name: 'Semicolon Format Test List',
        description: 'A list for testing the semicolon-delimited format in bulk add'
      };
      
      const listResponse = await createList(listData);
      testList = listResponse.data;
      console.log(`Created test list with ID: ${testList.id}`);
      
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  after(async function() {
    try {
      // Clean up test data
      await cleanupTestData();
      console.log('Test data cleaned up successfully');
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });
  
  it('should process semicolon-delimited input format', async function() {
    // Sample input in the semicolon-delimited format
    const sampleInput = [
      'Maison Passerelle; restaurant; New York; French-Diaspora Fusion',
      'Bar Bianchi; restaurant; New York; Milanese',
      'JR & Son; restaurant; New York; Italian-American',
      'Papa d\'Amour; restaurant; New York; French-Asian Bakery',
      'Figure Eight; restaurant; New York; Chinese-American'
    ];
    
    try {
      // Create test restaurants using the E2E testing endpoints
      for (const line of sampleInput) {
        const [name, type, location, cuisine] = line.split(';').map(part => part.trim());
        
        const restaurantData = {
          name,
          description: `${cuisine} ${type} in ${location}`,
          address: `${Math.floor(Math.random() * 1000)} Test St, ${location}`,
          cuisine,
          price_range: '$$',
          neighborhood_id: Math.floor(Math.random() * 5) + 1
        };
        
        const response = await createRestaurant(restaurantData);
        expect(response).to.have.property('success', true);
        expect(response.data).to.have.property('id');
        
        testRestaurants.push({
          ...response.data,
          tags: [cuisine]
        });
        
        console.log(`Created test restaurant: ${response.data.name} (ID: ${response.data.id})`);
      }
      
      // Verify restaurants were created successfully
      expect(testRestaurants.length).to.equal(sampleInput.length);
      
      // Prepare bulk add items
      const listItems = testRestaurants.map(restaurant => ({
        restaurant_id: restaurant.id,
        notes: `Added via semicolon format test: ${restaurant.tags.join(', ')}`
      }));
      
      // Perform bulk add
      const bulkAddResponse = await bulkAddItemsToList(testList.id, listItems);
      
      // Verify bulk add response
      expect(bulkAddResponse).to.have.property('success', true);
      expect(bulkAddResponse.data).to.have.property('added', listItems.length);
      
      console.log(`Added ${bulkAddResponse.data.added} items to the list`);
      
      // Verify the items were added by getting list details
      const listDetailsResponse = await getListById(testList.id);
      
      // Verify list details
      expect(listDetailsResponse).to.have.property('success', true);
      expect(listDetailsResponse.data).to.have.property('items').that.is.an('array');
      
      // Verify each restaurant is in the list
      for (const restaurant of testRestaurants) {
        const foundItem = listDetailsResponse.data.items.find(item => 
          item.restaurant_id === restaurant.id
        );
        
        expect(foundItem).to.exist;
        expect(foundItem.notes).to.include('Added via semicolon format test');
      }
      
      console.log('Successfully verified all items in the list');
      
    } catch (error) {
      console.error('Error in test:', error);
      throw error;
    }
  });
});
