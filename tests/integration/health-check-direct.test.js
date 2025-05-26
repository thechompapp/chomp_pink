import { describe, it, expect } from 'vitest';
import fetch from 'node-fetch';

describe('Health Check Endpoint', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';
  const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

  it('should return 200 and healthy status', async () => {
    try {
      const response = await fetch(`${cleanBaseUrl}/health`);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('status', 'UP');
      console.log('Health check passed:', data);
    } catch (error) {
      console.error('Health check failed:', error.message);
      throw error;
    }
  });
});
