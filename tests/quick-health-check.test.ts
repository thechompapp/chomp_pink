import { test, expect } from 'vitest';
import axios from 'axios';

test('API health check', async () => {
  try {
    const response = await axios.get('http://localhost:5001/api/health');
    console.log('Health check response:', response.data);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('UP');
  } catch (error) {
    console.error('Health check failed:', error.message);
    throw error;
  }
}, 10000); // 10 second timeout
