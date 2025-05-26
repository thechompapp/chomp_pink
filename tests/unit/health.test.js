import { test, expect, beforeAll } from 'vitest';
import axios from 'axios';
import '../test-config.local.js'; // Load test configuration

// Simple health check test
// This verifies that the API is running and responding to requests
test('API health check', async () => {
  console.log('Running health check test...');
  console.log('API Base URL:', process.env.API_BASE_URL);
  
  try {
    const response = await axios.get(`${process.env.API_BASE_URL}/health`, {
      timeout: 5000 // 5 second timeout
    });
    
    console.log('Health check response status:', response.status);
    console.log('Health check response data:', JSON.stringify(response.data, null, 2));
    
    // Basic assertions
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toBe('UP');
    
    // Additional checks if available
    if (response.data.databasePool) {
      console.log('Database pool stats:', response.data.databasePool);
    }
    if (response.data.memoryUsage) {
      console.log('Memory usage:', response.data.memoryUsage);
    }
    
    return true;
  } catch (error) {
    console.error('Health check failed:');
    console.error('Error message:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Request config:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error config:', error.config);
    }
    
    throw error;
  }
}, 15000); // 15 second timeout
