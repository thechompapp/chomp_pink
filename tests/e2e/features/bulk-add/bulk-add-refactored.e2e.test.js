/**
 * Bulk Add Refactored E2E Test
 * 
 * Tests the refactored bulk add feature end-to-end with semicolon-delimited format.
 * Uses the E2E testing endpoints as specified in the application.
 */
import { 
  login, 
  register,
  createList,
  bulkAddItemsToList,
  getListById,
  createRestaurant,
  searchPlaces
} from '../../../setup/robust-api-client.js';
import { generateTestUser } from '../../../setup/test-utils.js';
import { expect } from 'chai';

describe('Refactored Bulk Add Feature E2E Tests', function() {
  this.timeout(30000); // Set timeout to 30 seconds for API calls
  
  let testUser;
  let authToken;
  let testList;
  
  before(async function() {
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
   * Test Case: Process Semicolon-Delimited Input Format
   * Tests the bulk add feature with the semicolon-delimited format
   */
  it('should process semicolon-delimited input format', async function() {
    // Sample input in the semicolon-delimited format
    const sampleInput = [
      'Maison Passerelle; restaurant; New York; French-Diaspora Fusion',
      'Bar Bianchi; restaurant; New York; Milanese',
      'JR & Son; restaurant; New York; Italian-American',
      'Papa d\'Amour; restaurant; New York; French-Asian Bakery',
      'Figure Eight; restaurant; New York; Chinese-American'
    ];
    
    // Mock the parsing process that would happen in the UI
    const parsedItems = sampleInput.map((line, index) => {
      const parts = line.split(';').map(part => part.trim());
      return {
        name: parts[0],
        type: parts[1] || 'restaurant',
        city: parts[2] || 'New York',
        tags: parts.length > 3 ? [parts[3]] : [],
        _lineNumber: index + 1
      };
    });
    
    // For each parsed item, simulate the place resolution process
    const resolvedItems = [];
    
    for (const item of parsedItems) {
      // In a real scenario, this would use the Google Places API
      // For E2E testing, we'll create a restaurant directly
      const restaurantData = {
        name: item.name,
        description: `${item.tags[0] || 'Restaurant'} in ${item.city}`,
        address: `${Math.floor(Math.random() * 1000)} Test St, ${item.city}`,
        cuisine: item.tags[0] || 'Various',
        price_range: '$$',
        neighborhood_id: Math.floor(Math.random() * 5) + 1
      };
      
      try {
        const response = await createRestaurant(restaurantData);
        
        expect(response).to.be.an('object');
        expect(response.success).to.be.true;
        expect(response.data).to.be.an('object');
        expect(response.data.id).to.be.a('number');
        
        resolvedItems.push({
          ...item,
          restaurant_id: response.data.id,
          status: 'success'
        });
        
        console.log(`Created test restaurant: ${response.data.name} with ID: ${response.data.id}`);
      } catch (error) {
        console.error(`Error creating restaurant ${item.name}:`, error);
        resolvedItems.push({
          ...item,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Verify restaurants were created successfully
    const successfulItems = resolvedItems.filter(item => item.status === 'success');
    expect(successfulItems.length).to.be.at.least(1);
    
    // Now bulk add these restaurants to the test list
    const listItems = successfulItems.map(item => ({
      restaurant_id: item.restaurant_id,
      notes: `Added via bulk add E2E test: ${item.tags.join(', ')}`
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
    expect(listDetailsResponse.data.items.length).to.be.at.least(listItems.length);
    
    // Verify each restaurant is in the list
    for (const item of successfulItems) {
      const foundItem = listDetailsResponse.data.items.find(listItem => 
        listItem.restaurant_id === item.restaurant_id
      );
      
      expect(foundItem).to.exist;
      expect(foundItem.notes).to.include('Added via bulk add E2E test');
    }
    
    console.log(`Successfully verified all ${listItems.length} items in the list`);
  });
});
