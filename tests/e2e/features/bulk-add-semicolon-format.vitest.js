import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import robustApiClient from '../../setup/robust-api-client.js';
import { dbHelper, createTestUser, TEST_USER } from '../../setup/test-utils.js';

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds

// Get the apiClient from the robustApiClient
const { apiClient, tokenStorage } = robustApiClient;

// Configure the API client with test settings
const baseURL = process.env.API_BASE_URL || 'http://localhost:5001/api';
apiClient.defaults.baseURL = baseURL;
apiClient.defaults.timeout = 10000;
apiClient.defaults.headers.common['Content-Type'] = 'application/json';
apiClient.defaults.headers.common['Accept'] = 'application/json';
apiClient.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
apiClient.defaults.headers.common['X-Test-Mode'] = 'true';

console.log('API Client configured with baseURL:', baseURL);

describe('Bulk Add Semicolon Format E2E Tests', () => {
  let authToken;
  let testUser;
  let testList;
  
  beforeAll(async () => {
    console.log('🔧 Setting up test environment...');
    
    try {
      // Create a test user with a unique email
      testUser = await createTestUser({
        email: `test_${Date.now()}@example.com`,
        username: `testuser_${Date.now()}`,
        role: 'user'
      });
      
      console.log('Test user created:', testUser.email);
      
      // Login to get auth token
      const loginResponse = await apiClient.post('/auth/login', {
        email: testUser.email,
        password: testUser.password
      });
      
      if (!loginResponse.data || !loginResponse.data.token) {
        console.error('Login failed:', loginResponse);
        throw new Error('Failed to authenticate test user');
      }
      
      authToken = loginResponse.data.token;
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      console.log('Successfully authenticated test user');
      
      // Create a test list
      const listResponse = await apiClient.post('/lists', {
        name: 'Test List',
        description: 'Test list for bulk add operations'
      });
      
      testList = listResponse.data;
      console.log('Created test list with ID:', testList.id);
    } catch (error) {
      console.error('Error in beforeAll:', error);
      throw error;
    }
  }, TEST_TIMEOUT);
  
  afterAll(async () => {
    console.log('🧹 Cleaning up test environment...');
    
    try {
      // Clean up test list if it was created
      if (testList && testList.id) {
        try {
          await apiClient.delete(`/lists/${testList.id}`);
          console.log('Successfully deleted test list');
        } catch (error) {
          console.error('Error cleaning up test list:', error);
        }
      }
      
      // Logout the test user if authenticated
      if (authToken) {
        try {
          await apiClient.post('/auth/logout');
          console.log('Successfully logged out test user');
        } catch (error) {
          console.error('Error during logout:', error);
        }
      }
      
      // Clean up test user if it was created
      if (testUser && testUser.email) {
        try {
          await deleteTestUser(testUser.email);
          console.log('Successfully cleaned up test user');
        } catch (error) {
          console.error('Error cleaning up test user:', error);
        }
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      // Always clean up the database connection
      await dbHelper.cleanup();
    }
  }, TEST_TIMEOUT);
  
  it('should process semicolon-delimited input format', async () => {
    // Test data
    const testData = {
      input: 'Test Restaurant 1; 123 Test St; Test Dish 1; 10.99; Italian',
      listId: testList.id
    };
    
    try {
      // Make the bulk add request
      const response = await apiClient.post(
        '/restaurants/bulk',
        testData,
        {
          validateStatus: (status) => status < 500 // Don't throw for 4xx errors
        }
      );
      
      console.log('Bulk add response:', {
        status: response.status,
        data: response.data
      });
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('data');
      
      // Verify the restaurant was created
      const restaurantResponse = await apiClient.get('/restaurants');
      expect(restaurantResponse.status).toBe(200);
      expect(restaurantResponse.data).toHaveProperty('data');
      expect(Array.isArray(restaurantResponse.data.data)).toBe(true);
      expect(restaurantResponse.data.data.length).toBeGreaterThan(0);
      
      // Verify the dish was created
      const restaurantId = restaurantResponse.data.data[0].id;
      const dishesResponse = await apiClient.get(`/restaurants/${restaurantId}/dishes`);
      expect(dishesResponse.status).toBe(200);
      expect(dishesResponse.data).toHaveProperty('data');
      expect(Array.isArray(dishesResponse.data.data)).toBe(true);
      expect(dishesResponse.data.data.length).toBeGreaterThan(0);
      
    } catch (error) {
      console.error('Test failed:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  }, TEST_TIMEOUT);
});
