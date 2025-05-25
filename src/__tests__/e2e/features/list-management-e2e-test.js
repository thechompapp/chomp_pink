/**
 * List Management E2E Test Suite
 * 
 * This test suite covers the list management-related test cases specified in TSINSTRUCTION.md:
 * - Test Case 2.1: Create a New List
 * - Test Case 2.2: View List Details
 * - Test Case 2.3: Add Items (Dishes/Restaurants) to a List
 * - Test Case 2.4: Update List Details
 * - Test Case 2.5: Remove Item from List
 * - Test Case 2.6: Delete a List
 */

import { 
  login, 
  register,
  createList,
  getLists,
  getListById,
  updateList,
  deleteList,
  addItemToList,
  removeItemFromList,
  createRestaurant,
  createDish
} from '../setup/robust-api-client.js';
import { generateTestUser } from '../setup/test-users.js';
import { initializeDatabase } from '../setup/db-init.js';
import { describe, it, before, beforeEach, after } from 'mocha';
import { expect } from 'chai';

describe('List Management E2E Tests', function() {
  this.timeout(15000); // Set timeout to 15 seconds
  
  let testUser;
  let authToken;
  let createdLists = [];
  let createdRestaurants = [];
  let createdDishes = [];
  
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
      
      // Create a test restaurant
      const restaurantData = {
        name: 'Test Restaurant for Lists',
        description: 'A restaurant for testing list functionality',
        address: '123 Test St, Test City, TC 12345',
        cuisine: 'Test Cuisine',
        price_range: '$$'
      };
      
      const restaurantResponse = await createRestaurant(restaurantData);
      createdRestaurants.push(restaurantResponse.data);
      
      // Create a test dish
      const dishData = {
        name: 'Test Dish for Lists',
        description: 'A dish for testing list functionality',
        price: 12.99,
        category: 'Test Category',
        restaurant_id: restaurantResponse.data.id
      };
      
      const dishResponse = await createDish(dishData);
      createdDishes.push(dishResponse.data);
      
      console.log('Created test restaurant and dish for list tests');
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  after(async function() {
    // Clean up created lists
    console.log('Cleaning up test data...');
    
    for (const list of createdLists) {
      try {
        await deleteList(list.id);
        console.log(`Deleted list: ${list.name}`);
      } catch (error) {
        console.warn(`Failed to delete list ${list.id}: ${error.message}`);
      }
    }
  });
  
  /**
   * Test Case 2.1: Create a New List
   */
  it('should create a new list', async function() {
    try {
      const listData = {
        name: 'My Test Wishlist',
        description: 'A list created for E2E testing'
      };
      
      const response = await createList(listData);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.id).to.be.a('number');
      expect(response.data.name).to.equal(listData.name);
      expect(response.data.description).to.equal(listData.description);
      
      // Store the created list for later tests
      createdLists.push(response.data);
      
      console.log(`Created list: ${response.data.name} with ID: ${response.data.id}`);
    } catch (error) {
      console.error('Error creating list:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 2.2: View List Details
   */
  it('should view list details', async function() {
    try {
      // Ensure we have a list to view
      if (createdLists.length === 0) {
        const listData = {
          name: 'List for Viewing',
          description: 'A list created for viewing details'
        };
        
        const createResponse = await createList(listData);
        createdLists.push(createResponse.data);
      }
      
      const listId = createdLists[0].id;
      const response = await getListById(listId);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.id).to.equal(listId);
      expect(response.data.name).to.equal(createdLists[0].name);
      
      console.log(`Retrieved list details for: ${response.data.name}`);
    } catch (error) {
      console.error('Error viewing list details:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 2.3: Add Items (Dishes/Restaurants) to a List
   */
  it('should add items to a list', async function() {
    try {
      // Ensure we have a list to add items to
      if (createdLists.length === 0) {
        const listData = {
          name: 'List for Adding Items',
          description: 'A list created for adding items'
        };
        
        const createResponse = await createList(listData);
        createdLists.push(createResponse.data);
      }
      
      const listId = createdLists[0].id;
      
      // Add a restaurant to the list
      const restaurantItemData = {
        itemId: createdRestaurants[0].id,
        itemType: 'restaurant',
        notes: 'Great place to try!'
      };
      
      const restaurantAddResponse = await addItemToList(listId, restaurantItemData);
      
      expect(restaurantAddResponse).to.be.an('object');
      expect(restaurantAddResponse.success).to.be.true;
      
      // Add a dish to the list
      const dishItemData = {
        itemId: createdDishes[0].id,
        itemType: 'dish',
        notes: 'Must try this dish!'
      };
      
      const dishAddResponse = await addItemToList(listId, dishItemData);
      
      expect(dishAddResponse).to.be.an('object');
      expect(dishAddResponse.success).to.be.true;
      
      // Verify items were added by getting list details
      const listResponse = await getListById(listId);
      
      expect(listResponse.data.items).to.be.an('array');
      expect(listResponse.data.items.length).to.be.at.least(2);
      
      const hasRestaurant = listResponse.data.items.some(item => 
        item.itemType === 'restaurant' && item.itemId === createdRestaurants[0].id
      );
      
      const hasDish = listResponse.data.items.some(item => 
        item.itemType === 'dish' && item.itemId === createdDishes[0].id
      );
      
      expect(hasRestaurant).to.be.true;
      expect(hasDish).to.be.true;
      
      console.log(`Added restaurant and dish to list: ${listResponse.data.name}`);
    } catch (error) {
      console.error('Error adding items to list:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 2.4: Update List Details
   */
  it('should update list details', async function() {
    try {
      // Ensure we have a list to update
      if (createdLists.length === 0) {
        const listData = {
          name: 'List for Updating',
          description: 'A list created for updating'
        };
        
        const createResponse = await createList(listData);
        createdLists.push(createResponse.data);
      }
      
      const listId = createdLists[0].id;
      const updateData = {
        name: `Updated List Name ${Date.now()}`,
        description: 'This description has been updated'
      };
      
      const response = await updateList(listId, updateData);
      
      expect(response).to.be.an('object');
      expect(response.success).to.be.true;
      expect(response.data).to.be.an('object');
      expect(response.data.id).to.equal(listId);
      expect(response.data.name).to.equal(updateData.name);
      expect(response.data.description).to.equal(updateData.description);
      
      // Update our stored list
      createdLists[0] = response.data;
      
      console.log(`Updated list name to: ${response.data.name}`);
    } catch (error) {
      console.error('Error updating list:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 2.5: Remove Item from List
   */
  it('should remove an item from a list', async function() {
    try {
      // Get the list with items
      const listId = createdLists[0].id;
      const listResponse = await getListById(listId);
      
      // Ensure the list has items
      if (!listResponse.data.items || listResponse.data.items.length === 0) {
        // Add a restaurant to the list if no items exist
        const restaurantItemData = {
          itemId: createdRestaurants[0].id,
          itemType: 'restaurant',
          notes: 'Item to be removed'
        };
        
        await addItemToList(listId, restaurantItemData);
        
        // Get the updated list
        const updatedListResponse = await getListById(listId);
        expect(updatedListResponse.data.items.length).to.be.at.least(1);
        
        // Use the first item
        const itemToRemove = updatedListResponse.data.items[0];
        const itemId = itemToRemove.id;
        
        // Remove the item
        const removeResponse = await removeItemFromList(listId, itemId);
        
        expect(removeResponse).to.be.an('object');
        expect(removeResponse.success).to.be.true;
        
        // Verify the item was removed
        const finalListResponse = await getListById(listId);
        const itemStillExists = finalListResponse.data.items.some(item => item.id === itemId);
        
        expect(itemStillExists).to.be.false;
        
        console.log(`Removed item from list: ${finalListResponse.data.name}`);
      } else {
        // Use the first item in the list
        const itemToRemove = listResponse.data.items[0];
        const itemId = itemToRemove.id;
        
        // Remove the item
        const removeResponse = await removeItemFromList(listId, itemId);
        
        expect(removeResponse).to.be.an('object');
        expect(removeResponse.success).to.be.true;
        
        // Verify the item was removed
        const updatedListResponse = await getListById(listId);
        const itemStillExists = updatedListResponse.data.items.some(item => item.id === itemId);
        
        expect(itemStillExists).to.be.false;
        
        console.log(`Removed item from list: ${updatedListResponse.data.name}`);
      }
    } catch (error) {
      console.error('Error removing item from list:', error);
      throw error;
    }
  });
  
  /**
   * Test Case 2.6: Delete a List
   */
  it('should delete a list', async function() {
    try {
      // Create a new list specifically for deletion
      const listData = {
        name: 'List to Delete',
        description: 'This list will be deleted'
      };
      
      const createResponse = await createList(listData);
      const listId = createResponse.data.id;
      
      // Delete the list
      const deleteResponse = await deleteList(listId);
      
      expect(deleteResponse).to.be.an('object');
      expect(deleteResponse.success).to.be.true;
      
      // Verify the list was deleted
      try {
        await getListById(listId);
        // If we reach here, the test failed
        throw new Error('Expected list to be deleted, but it still exists');
      } catch (error) {
        // This is expected - verify it's the right error
        expect(error.response).to.exist;
        expect(error.response.status).to.equal(404); // Not Found
        expect(error.response.data.success).to.be.false;
        
        console.log('Successfully verified list deletion');
      }
    } catch (error) {
      if (error.message && error.message.includes('Expected list to be deleted')) {
        throw error; // Rethrow our assertion error
      }
      console.error('Error in list deletion test:', error);
      throw error;
    }
  });
});
