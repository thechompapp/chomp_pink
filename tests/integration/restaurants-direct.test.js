import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fetch from 'node-fetch';

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';
const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

describe('Restaurant API', () => {
  let authToken = '';
  let testRestaurantId = '';

  // Login before running tests
  beforeAll(async () => {
    // Login to get auth token
    const response = await fetch(`${cleanBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    const data = await response.json();
    if (data.success && data.data.token) {
      authToken = data.data.token;
      console.log('Successfully logged in for restaurant tests');
    } else {
      console.error('Failed to log in for restaurant tests:', data);
      throw new Error('Login failed for restaurant tests');
    }
  });

  it('should fetch all restaurants', async () => {
    const response = await fetch(`${cleanBaseUrl}/restaurants?page=1&limit=10`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Restaurants response:', { status: response.status, count: data.data?.length || 0 });
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    
    // Save the first restaurant ID for subsequent tests if available
    if (data.data.length > 0) {
      testRestaurantId = data.data[0].id;
      console.log('First restaurant ID:', testRestaurantId);
    }
  });

  it('should fetch a single restaurant by ID', async () => {
    if (!testRestaurantId) {
      console.log('Skipping single restaurant test - no restaurant ID available');
      return;
    }

    const response = await fetch(`${cleanBaseUrl}/restaurants/${testRestaurantId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    console.log('Single restaurant response:', { status: response.status, id: data.data?.id });
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('id', testRestaurantId);
  });

  it('should search for restaurants', async () => {
    const query = 'pizza';
    const response = await fetch(`${cleanBaseUrl}/restaurants?search=${encodeURIComponent(query)}&page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Restaurant search response:', { status: response.status, query, count: data.data?.length || 0 });
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('should fetch dishes for a restaurant', async () => {
    if (!testRestaurantId) {
      console.log('Skipping dishes test - no restaurant ID available');
      return;
    }

    const response = await fetch(`${cleanBaseUrl}/dishes?restaurant_id=${testRestaurantId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Dishes response:', { status: response.status, restaurantId: testRestaurantId, count: data.data?.length || 0 });
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
