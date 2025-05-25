/**
 * Health Check Test
 * 
 * This file contains a basic test to verify that we can connect to the API health endpoint.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';

// Test timeout (5 seconds)
const TEST_TIMEOUT = 5000;

// Create a simple API client specifically for this test
const apiClient = axios.create({
  baseURL: 'http://localhost:5173/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

describe('Health Check', () => {
  it('should be able to connect to the API health endpoint', async () => {
    try {
      console.log('Attempting to connect to health endpoint...');
      const response = await apiClient.get('/health');
      
      console.log('Health endpoint response:', {
        status: response.status,
        data: response.data
      });
      
      expect(response.status).toBe(200);
    } catch (error) {
      console.error('Health endpoint error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // Re-throw the error to fail the test
      throw error;
    }
  }, TEST_TIMEOUT);
});
