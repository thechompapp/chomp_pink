/**
 * Basic Health Check Test
 * 
 * This file contains a basic test to verify that we can connect to the API health endpoint.
 * This is a simpler test that doesn't rely on the global setup or complex API client.
 */

import { describe, it, expect } from 'vitest';
import axios from 'axios';

// Test timeout (10 seconds)
const TEST_TIMEOUT = 10000;

describe('Basic Health Check', () => {
  it('should be able to connect to the API health endpoint', async () => {
    try {
      console.log('Attempting to connect to health endpoint...');
      const response = await axios.get('http://localhost:5173/api/health', {
        timeout: 8000
      });
      
      console.log('Health endpoint response:', {
        status: response.status,
        data: response.data
      });
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'UP');
      expect(response.data).toHaveProperty('message');
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
