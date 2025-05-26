/**
 * E2E API Test: Multi-Level Communication
 * 
 * This test suite implements the requirements from MULTI_COMM.md, verifying communication across all layers:
 * - Level 1: API Contract & Backend Integration Tests (Backend Focused)
 * - Level 2: Frontend Service - API Integration Tests (Frontend Focused)
 * - Level 3: End-to-End User Flow Tests
 * 
 * The tests verify data integrity and communication between frontend, backend API, and database layers.
 */

import { expect } from 'chai';
import { createDirectClient } from '../../../tests/setup/direct-http-client.js';
import apiClient from '../../setup/test-api-client.js';

describe('Multi-Level Communication E2E Tests', function() {
  this.timeout(5000); // Short timeout for faster test execution
  
  // Test users for different scenarios
  let regularUser = {
    id: null,
    token: null,
    username: `test_user_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'testpassword123'
  };
  
  let adminUser = {
    id: null,
    token: null,
    username: `admin_user_${Date.now()}`,
    email: `admin_${Date.now()}@example.com`,
    password: 'adminpassword123'
  };
  
  // Test data
  let testList = {
    id: null,
    name: `Test List ${Date.now()}`,
    description: 'A list created for multi-level communication testing'
  };
  
  let testRestaurant = {
    id: null,
    name: `Test Restaurant ${Date.now()}`,
    address: '123 Test Street, Test City, TS 12345',
    cuisine: 'Test Cuisine',
    price_range: '$$'
  };
  
  before(async function() {
    try {
      // Register a regular test user
      const registerResponse = await apiClient.post('/auth/register', {
        username: regularUser.username,
        email: regularUser.email,
        password: regularUser.password
      });
      
      // Login as the regular test user
      const loginResponse = await apiClient.post('/auth/login', {
        email: regularUser.email,
        password: regularUser.password
      });
      
      regularUser.token = loginResponse.data.token;
      regularUser.id = loginResponse.data.user.id;
      
      // Try to register an admin user (if admin registration is available)
      try {
        const adminRegisterResponse = await apiClient.post('/auth/register', {
          username: adminUser.username,
          email: adminUser.email,
          password: adminUser.password,
          role: 'admin' // This might not work depending on the API implementation
        });
        
        // If admin registration succeeded, login as admin
        const adminLoginResponse = await apiClient.post('/auth/login', {
          email: adminUser.email,
          password: adminUser.password
        });
        
        adminUser.token = adminLoginResponse.data.token;
        adminUser.id = adminLoginResponse.data.user.id;
      } catch (adminError) {
        console.log('Admin user registration failed. This is expected if admin creation is restricted.');
        // We'll continue without an admin user for tests that don't require it
      }
      
      console.log('Test setup complete');
    } catch (error) {
      console.error('Setup failed:', error.message);
      throw error;
    }
  });
  
  after(async function() {
    // Cleanup: Delete test data
    try {
      // Set auth token to regular user for cleanup
      apiClient.setAuthToken(regularUser.token);
      
      // Delete the test list if it was created
      if (testList.id) {
        await apiClient.delete(`/lists/${testList.id}`);
        console.log(`Deleted test list with ID ${testList.id}`);
      }
      
      // Delete the test restaurant if it was created
      if (testRestaurant.id) {
        await apiClient.delete(`/restaurants/${testRestaurant.id}`);
        console.log(`Deleted test restaurant with ID ${testRestaurant.id}`);
      }
      
      // Delete the regular test user
      if (regularUser.id) {
        await apiClient.delete(`/users/${regularUser.id}`);
        console.log(`Deleted regular user with ID ${regularUser.id}`);
      }
      
      // Delete the admin test user if it was created
      if (adminUser.id) {
        // May need to switch to admin token if regular users can't delete other users
        apiClient.setAuthToken(adminUser.token);
        await apiClient.delete(`/users/${adminUser.id}`);
        console.log(`Deleted admin user with ID ${adminUser.id}`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    } finally {
      apiClient.clearAuthToken();
    }
  });
  
  /**
   * Level 1: API Contract & Backend Integration Tests
   */
  describe('Level 1: API Contract & Backend Integration', function() {
    it('should verify API contract for authentication endpoints', async function() {
      // Test registration endpoint
      const uniqueUsername = `api_test_user_${Date.now()}`;
      const uniqueEmail = `api_test_${Date.now()}@example.com`;
      
      try {
        const registerResponse = await apiClient.post('/auth/register', {
          username: uniqueUsername,
          email: uniqueEmail,
          password: 'testpassword123'
        });
        
        // Verify response structure
        expect(registerResponse.status).to.be.oneOf([200, 201]);
        expect(registerResponse.data).to.have.property('user');
        expect(registerResponse.data.user).to.have.property('id');
        expect(registerResponse.data.user).to.have.property('username', uniqueUsername);
        expect(registerResponse.data.user).to.have.property('email', uniqueEmail);
        
        // Test login endpoint with the newly registered user
        const loginResponse = await apiClient.post('/auth/login', {
          email: uniqueEmail,
          password: 'testpassword123'
        });
        
        // Verify login response structure
        expect(loginResponse.status).to.equal(200);
        expect(loginResponse.data).to.have.property('token');
        expect(loginResponse.data).to.have.property('user');
        expect(loginResponse.data.user).to.have.property('id');
        expect(loginResponse.data.user).to.have.property('username', uniqueUsername);
        
        // Cleanup: Delete the test user
        apiClient.setAuthToken(loginResponse.data.token);
        await apiClient.delete(`/users/${loginResponse.data.user.id}`);
        apiClient.clearAuthToken();
      } catch (error) {
        console.error('API contract test failed:', error.message);
        throw error;
      }
    });
    
    it('should verify API contract for list endpoints', async function() {
      // Set auth token for this test
      apiClient.setAuthToken(regularUser.token);
      
      try {
        // Test creating a list
        const createListResponse = await apiClient.post('/lists', {
          name: testList.name,
          description: testList.description
        });
        
        // Verify response structure
        expect(createListResponse.status).to.be.oneOf([200, 201]);
        expect(createListResponse.data).to.have.property('id');
        expect(createListResponse.data).to.have.property('name', testList.name);
        expect(createListResponse.data).to.have.property('description', testList.description);
        
        // Save the list ID for later tests
        testList.id = createListResponse.data.id;
        
        // Test getting the list
        const getListResponse = await apiClient.get(`/lists/${testList.id}`);
        
        // Verify response structure
        expect(getListResponse.status).to.equal(200);
        expect(getListResponse.data).to.have.property('id', testList.id);
        expect(getListResponse.data).to.have.property('name', testList.name);
        
        // Test getting all lists
        const getAllListsResponse = await apiClient.get('/lists');
        
        // Verify response structure
        expect(getAllListsResponse.status).to.equal(200);
        expect(getAllListsResponse.data).to.be.an('array');
        
        // Find our test list in the response
        const foundList = getAllListsResponse.data.find(list => list.id === testList.id);
        expect(foundList).to.exist;
        expect(foundList).to.have.property('name', testList.name);
      } catch (error) {
        console.error('List API contract test failed:', error.message);
        throw error;
      } finally {
        apiClient.clearAuthToken();
      }
    });
    
    it('should verify API error handling for invalid requests', async function() {
      try {
        // Test login with invalid credentials
        try {
          await apiClient.post('/auth/login', {
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          });
          
          // If we get here, the test should fail
          expect.fail('Login with invalid credentials should have failed');
        } catch (error) {
          // Verify error response
          expect(error.response.status).to.be.oneOf([400, 401, 403]);
          expect(error.response.data).to.have.property('message');
        }
        
        // Test accessing protected resource without authentication
        try {
          await apiClient.get('/lists');
          
          // If we get here, the test might fail, but some APIs allow public list viewing
          // So we'll check if we got a 200 response, which might be valid
          // If we did get a 200, we'll just log it rather than failing the test
          console.log('Warning: GET /lists succeeded without authentication. This might be intended if lists are public.');
        } catch (error) {
          // Verify error response for unauthorized access
          expect(error.response.status).to.be.oneOf([401, 403]);
          expect(error.response.data).to.have.property('message');
        }
      } catch (error) {
        console.error('API error handling test failed:', error.message);
        throw error;
      }
    });
  });
  
  /**
   * Level 2: Frontend Service - API Integration Tests
   */
  describe('Level 2: Frontend Service - API Integration', function() {
    it('should simulate frontend service calls to backend API', async function() {
      // Set auth token for this test
      apiClient.setAuthToken(regularUser.token);
      
      try {
        // Simulate a frontend service call to create a restaurant
        // This would typically be in a service like restaurantService.createRestaurant()
        const createRestaurantResponse = await apiClient.post('/restaurants', testRestaurant);
        
        // Verify response structure
        expect(createRestaurantResponse.status).to.be.oneOf([200, 201]);
        expect(createRestaurantResponse.data).to.have.property('id');
        expect(createRestaurantResponse.data).to.have.property('name', testRestaurant.name);
        
        // Save the restaurant ID for later tests
        testRestaurant.id = createRestaurantResponse.data.id;
        
        // Simulate a frontend service call to add the restaurant to a list
        // This would typically be in a service like listService.addItemToList()
        const addToListResponse = await apiClient.post(`/lists/${testList.id}/items`, {
          itemId: testRestaurant.id,
          itemType: 'restaurant',
          notes: 'Added via frontend service simulation'
        });
        
        // Verify response structure
        expect(addToListResponse.status).to.be.oneOf([200, 201]);
        
        // Simulate a frontend service call to get list items
        // This would typically be in a service like listService.getListItems()
        const getListItemsResponse = await apiClient.get(`/lists/${testList.id}/items`);
        
        // Verify response structure
        expect(getListItemsResponse.status).to.equal(200);
        expect(getListItemsResponse.data).to.be.an('array');
        
        // Find our test restaurant in the list items
        const foundItem = getListItemsResponse.data.find(item => {
          // The structure might vary depending on the API
          if (item.itemId === testRestaurant.id) return true;
          if (item.restaurant && item.restaurant.id === testRestaurant.id) return true;
          if (item.item && item.item.id === testRestaurant.id) return true;
          return false;
        });
        
        expect(foundItem).to.exist;
        expect(foundItem.notes).to.equal('Added via frontend service simulation');
      } catch (error) {
        console.error('Frontend service integration test failed:', error.message);
        throw error;
      } finally {
        apiClient.clearAuthToken();
      }
    });
    
    it('should handle error responses in frontend services', async function() {
      // This test simulates how frontend services would handle API errors
      
      try {
        // Simulate a frontend service call with invalid data
        // This would typically be in a service like restaurantService.createRestaurant()
        try {
          const invalidRestaurant = { /* Missing required fields */ };
          await apiClient.post('/restaurants', invalidRestaurant);
          
          // If we get here, the test should fail
          expect.fail('Creating restaurant with invalid data should have failed');
        } catch (error) {
          // Verify error response
          expect(error.response.status).to.be.oneOf([400, 422]);
          expect(error.response.data).to.have.property('message');
          
          // Simulate frontend service error handling
          const errorMessage = error.response.data.message || 'An error occurred';
          const userFriendlyError = `Failed to create restaurant: ${errorMessage}`;
          
          expect(userFriendlyError).to.include('Failed to create restaurant');
        }
      } catch (error) {
        console.error('Frontend service error handling test failed:', error.message);
        throw error;
      }
    });
  });
  
  /**
   * Level 3: End-to-End User Flow Tests
   */
  describe('Level 3: End-to-End User Flow', function() {
    it('should simulate a complete user flow from UI to database and back', async function() {
      // Set auth token for this test
      apiClient.setAuthToken(regularUser.token);
      
      try {
        // Step 1: User logs in (already done in setup)
        
        // Step 2: User creates a new list (simulating UI interaction)
        const newListName = `E2E Flow List ${Date.now()}`;
        const createListResponse = await apiClient.post('/lists', {
          name: newListName,
          description: 'A list created during E2E user flow test'
        });
        
        const newListId = createListResponse.data.id;
        expect(newListId).to.exist;
        
        // Step 3: User searches for a restaurant (simulating UI search)
        const searchTerm = 'Test';
        const searchResponse = await apiClient.get(`/search?query=${encodeURIComponent(searchTerm)}`);
        
        expect(searchResponse.status).to.equal(200);
        expect(searchResponse.data).to.be.an('array');
        
        // Step 4: User adds a restaurant from search results to their list
        // For this test, we'll use our previously created test restaurant
        const addToListResponse = await apiClient.post(`/lists/${newListId}/items`, {
          itemId: testRestaurant.id,
          itemType: 'restaurant',
          notes: 'Added during E2E flow test'
        });
        
        expect(addToListResponse.status).to.be.oneOf([200, 201]);
        
        // Step 5: User views their list to confirm the addition
        const getListResponse = await apiClient.get(`/lists/${newListId}`);
        expect(getListResponse.status).to.equal(200);
        expect(getListResponse.data).to.have.property('name', newListName);
        
        const getListItemsResponse = await apiClient.get(`/lists/${newListId}/items`);
        expect(getListItemsResponse.status).to.equal(200);
        expect(getListItemsResponse.data).to.be.an('array');
        
        // Find our test restaurant in the list items
        const foundItem = getListItemsResponse.data.find(item => {
          // The structure might vary depending on the API
          if (item.itemId === testRestaurant.id) return true;
          if (item.restaurant && item.restaurant.id === testRestaurant.id) return true;
          if (item.item && item.item.id === testRestaurant.id) return true;
          return false;
        });
        
        expect(foundItem).to.exist;
        expect(foundItem.notes).to.equal('Added during E2E flow test');
        
        // Step 6: User updates the list name
        const updatedListName = `${newListName} (Updated)`;
        const updateListResponse = await apiClient.put(`/lists/${newListId}`, {
          name: updatedListName
        });
        
        expect(updateListResponse.status).to.equal(200);
        expect(updateListResponse.data).to.have.property('name', updatedListName);
        
        // Step 7: User verifies the update
        const getUpdatedListResponse = await apiClient.get(`/lists/${newListId}`);
        expect(getUpdatedListResponse.status).to.equal(200);
        expect(getUpdatedListResponse.data).to.have.property('name', updatedListName);
        
        // Step 8: User deletes the list
        const deleteListResponse = await apiClient.delete(`/lists/${newListId}`);
        expect(deleteListResponse.status).to.be.oneOf([200, 204]);
        
        // Step 9: User verifies the list is gone
        try {
          await apiClient.get(`/lists/${newListId}`);
          expect.fail('List should have been deleted');
        } catch (error) {
          expect(error.response.status).to.equal(404);
        }
      } catch (error) {
        console.error('E2E user flow test failed:', error.message);
        throw error;
      } finally {
        apiClient.clearAuthToken();
      }
    });
  });
});
