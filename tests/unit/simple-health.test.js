// Simple health check test that doesn't rely on the test setup
import { test, expect } from 'vitest';
import axios from 'axios';

// Simple test that directly checks the API health endpoint
test('Direct API health check', async () => {
  const apiUrl = 'http://localhost:5001/api/health';
  console.log(`Testing API health at: ${apiUrl}`);
  
  try {
    const response = await axios.get(apiUrl, { timeout: 5000 });
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    // Basic assertions
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data.status).toBe('UP');
    
  } catch (error) {
    console.error('Test failed:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}, 10000);
