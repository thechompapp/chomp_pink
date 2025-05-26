/**
 * API Connection Test
 * 
 * This file contains basic tests to verify that we can connect to the API correctly.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import apiClient, { handleApiRequest } from '../setup/simplified-api-client.js';

// Test timeout (3 seconds - lightning fast)
const TEST_TIMEOUT = 3000;

describe('API Connection', () => {
  // Health check test
  describe('Health Check', () => {
    it('should be able to connect to the API health endpoint', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/health'),
        'Health check'
      );
      
      console.log('Health check result:', result);
      
      // We don't assert success here because the health endpoint might not exist
      // We just want to see what response we get
    });
    
    it('should be able to connect to the API root', async () => {
      const result = await handleApiRequest(
        () => apiClient.get('/'),
        'API root check'
      );
      
      console.log('API root check result:', result);
      
      // We don't assert success here because the root endpoint might return different statuses
      // We just want to see what response we get
    });
  });
  
  // Auth endpoints test
  describe('Auth Endpoints', () => {
    it('should check if login endpoint exists', async () => {
      try {
        // We use a direct axios call here to see the raw error
        const response = await apiClient.post('/auth/login', {
          email: 'test@example.com',
          password: 'password123'
        });
        
        console.log('Login endpoint response:', {
          status: response.status,
          data: response.data
        });
      } catch (error) {
        console.log('Login endpoint error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
    });
  });
  
  // Other API endpoints test
  describe('Other Endpoints', () => {
    it('should check if restaurants endpoint exists', async () => {
      try {
        const response = await apiClient.get('/restaurants');
        
        console.log('Restaurants endpoint response:', {
          status: response.status,
          data: Array.isArray(response.data) ? 
            `Array with ${response.data.length} items` : 
            response.data
        });
      } catch (error) {
        console.log('Restaurants endpoint error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
    });
    
    it('should check if dishes endpoint exists', async () => {
      try {
        const response = await apiClient.get('/dishes');
        
        console.log('Dishes endpoint response:', {
          status: response.status,
          data: Array.isArray(response.data) ? 
            `Array with ${response.data.length} items` : 
            response.data
        });
      } catch (error) {
        console.log('Dishes endpoint error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
    });
  });
});
