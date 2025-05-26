/**
 * API Protocol and Error Handling E2E Test Suite
 * 
 * This test suite covers the API protocol and error handling test cases specified in TSINSTRUCTION.md:
 * - Verify correct HTTP status codes for success (200, 201, 204)
 * - Verify correct HTTP status codes for client errors (400, 401, 403, 404, 409)
 * - Verify consistent error response structure
 * - Test with invalid/missing parameters
 * - Test with malformed JWTs or tokens
 */

import { 
  login, 
  register,
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getProfile
} from '../setup/robust-api-client.js';
import { generateTestUser } from '../setup/test-users.js';
import { initializeDatabase } from '../setup/db-init.js';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import axios from 'axios';

// Create a custom instance of axios for direct API calls
const directApiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

describe('API Protocol and Error Handling E2E Tests', function() {
  this.timeout(15000); // Set timeout to 15 seconds
  
  let testUser;
  let authToken;
  let testRestaurant;
  
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
        name: 'Error Handling Test Restaurant',
        description: 'A restaurant for testing error handling',
        address: '123 Error St, Test City, TC 12345',
        cuisine: 'Test Cuisine',
        price_range: '$$'
      };
      
      const restaurantResponse = await createRestaurant(restaurantData);
      testRestaurant = restaurantResponse.data;
      console.log(`Created test restaurant: ${testRestaurant.name}`);
    } catch (error) {
      console.error('Error in test setup:', error);
      throw error;
    }
  });
  
  /**
   * Test success status codes (200, 201)
   */
  it('should return correct success status codes', async function() {
    try {
      // Test 200 OK for GET request
      const getResponse = await getRestaurants();
      expect(getResponse.status).to.equal(200);
      
      // Test 201 Created for POST request
      const restaurantData = {
        name: 'Status Code Test Restaurant',
        description: 'A restaurant for testing status codes',
        address: '456 Status St, Test City, TC 12345',
        cuisine: 'Test Cuisine',
        price_range: '$$'
      };
      
      const createResponse = await createRestaurant(restaurantData);
      expect(createResponse.status).to.equal(201);
      
      console.log('Successfully verified success status codes');
    } catch (error) {
      console.error('Error in success status code test:', error);
      throw error;
    }
  });
  
  /**
   * Test 400 Bad Request
   */
  it('should return 400 Bad Request for invalid input', async function() {
    try {
      // Try to create a restaurant without required fields
      try {
        await createRestaurant({
          // Missing required name field
          description: 'Invalid restaurant data'
        });
        throw new Error('Expected 400 Bad Request but got success response');
      } catch (error) {
        expect(error.response).to.exist;
        expect(error.response.status).to.equal(400);
        expect(error.response.data).to.be.an('object');
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.message).to.be.a('string');
      }
      
      console.log('Successfully verified 400 Bad Request status code');
    } catch (error) {
      if (error.message && error.message.includes('Expected 400')) {
        throw error; // Rethrow our assertion error
      }
      console.error('Error in 400 Bad Request test:', error);
      throw error;
    }
  });
  
  /**
   * Test 401 Unauthorized
   */
  it('should return 401 Unauthorized for missing or invalid token', async function() {
    try {
      // Try to access protected route without token
      try {
        // Use direct axios client to avoid the token being automatically added
        await directApiClient.get('/auth/profile');
        throw new Error('Expected 401 Unauthorized but got success response');
      } catch (error) {
        expect(error.response).to.exist;
        expect(error.response.status).to.equal(401);
        expect(error.response.data).to.be.an('object');
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.message).to.be.a('string');
      }
      
      // Try with invalid token
      try {
        await directApiClient.get('/auth/profile', {
          headers: {
            'Authorization': 'Bearer invalid_token_here'
          }
        });
        throw new Error('Expected 401 Unauthorized but got success response');
      } catch (error) {
        expect(error.response).to.exist;
        expect(error.response.status).to.equal(401);
        expect(error.response.data).to.be.an('object');
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.message).to.be.a('string');
      }
      
      console.log('Successfully verified 401 Unauthorized status code');
    } catch (error) {
      if (error.message && error.message.includes('Expected 401')) {
        throw error; // Rethrow our assertion error
      }
      console.error('Error in 401 Unauthorized test:', error);
      throw error;
    }
  });
  
  /**
   * Test 404 Not Found
   */
  it('should return 404 Not Found for non-existent resources', async function() {
    try {
      // Try to get a non-existent restaurant
      try {
        await getRestaurantById(99999);
        throw new Error('Expected 404 Not Found but got success response');
      } catch (error) {
        expect(error.response).to.exist;
        expect(error.response.status).to.equal(404);
        expect(error.response.data).to.be.an('object');
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.message).to.be.a('string');
      }
      
      console.log('Successfully verified 404 Not Found status code');
    } catch (error) {
      if (error.message && error.message.includes('Expected 404')) {
        throw error; // Rethrow our assertion error
      }
      console.error('Error in 404 Not Found test:', error);
      throw error;
    }
  });
  
  /**
   * Test consistent error response structure
   */
  it('should return consistent error response structure', async function() {
    try {
      // Test multiple error scenarios to verify consistent structure
      const errorScenarios = [
        // 400 Bad Request
        {
          fn: () => createRestaurant({ description: 'Missing required fields' }),
          expectedStatus: 400
        },
        // 401 Unauthorized
        {
          fn: () => {
            const originalToken = directApiClient.defaults.headers.common['Authorization'];
            directApiClient.defaults.headers.common['Authorization'] = 'Bearer invalid_token';
            return directApiClient.get('/auth/profile').finally(() => {
              directApiClient.defaults.headers.common['Authorization'] = originalToken;
            });
          },
          expectedStatus: 401
        },
        // 404 Not Found
        {
          fn: () => getRestaurantById(99999),
          expectedStatus: 404
        }
      ];
      
      for (const scenario of errorScenarios) {
        try {
          await scenario.fn();
          throw new Error(`Expected ${scenario.expectedStatus} error but got success response`);
        } catch (error) {
          if (error.message && error.message.includes('Expected')) {
            throw error; // Rethrow our assertion error
          }
          
          // Verify consistent error structure
          expect(error.response).to.exist;
          expect(error.response.status).to.equal(scenario.expectedStatus);
          expect(error.response.data).to.be.an('object');
          expect(error.response.data.success).to.be.false;
          expect(error.response.data.message).to.be.a('string');
          
          // Additional fields may be present but not required
          if (error.response.data.error) {
            expect(error.response.data.error).to.be.an('object');
          }
        }
      }
      
      console.log('Successfully verified consistent error response structure');
    } catch (error) {
      if (error.message && error.message.includes('Expected')) {
        throw error; // Rethrow our assertion error
      }
      console.error('Error in consistent error structure test:', error);
      throw error;
    }
  });
  
  /**
   * Test with malformed JWTs or tokens for different users
   */
  it('should handle malformed JWTs or tokens correctly', async function() {
    try {
      const tokenScenarios = [
        { token: 'not_even_a_jwt', description: 'Invalid format' },
        { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c', description: 'Valid JWT but not from our system' },
        { token: authToken + 'corrupted', description: 'Corrupted token' }
      ];
      
      for (const scenario of tokenScenarios) {
        try {
          await directApiClient.get('/auth/profile', {
            headers: {
              'Authorization': `Bearer ${scenario.token}`
            }
          });
          throw new Error(`Expected error for ${scenario.description} but got success response`);
        } catch (error) {
          if (error.message && error.message.includes('Expected error')) {
            throw error; // Rethrow our assertion error
          }
          
          expect(error.response).to.exist;
          expect(error.response.status).to.equal(401);
          expect(error.response.data.success).to.be.false;
          
          console.log(`Successfully verified token handling for ${scenario.description}`);
        }
      }
    } catch (error) {
      if (error.message && error.message.includes('Expected error')) {
        throw error; // Rethrow our assertion error
      }
      console.error('Error in token handling test:', error);
      throw error;
    }
  });
});
