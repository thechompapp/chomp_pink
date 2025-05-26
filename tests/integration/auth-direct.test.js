import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fetch from 'node-fetch';

// Test configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';
const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  username: 'testuser'
};

describe('Authentication Flow', () => {
  let authToken = '';

  it('should handle user registration', async () => {
    // First try to register (should fail with 409 as user exists)
    const response = await fetch(`${cleanBaseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        username: TEST_USER.username,
        accountType: 'user'
      })
    });

    const data = await response.json();
    console.log('Register response:', data);
    
    // Should return 409 with appropriate error when user exists
    expect(response.status).toBe(409);
    expect(data).toHaveProperty('success', false);
    expect(data.error).toHaveProperty('code', 'USER_ALREADY_EXISTS');
  });

  it('should login with existing user', async () => {
    const response = await fetch(`${cleanBaseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    const data = await response.json();
    console.log('Login response:', data);
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('token');
    expect(data.data.user).toHaveProperty('email', TEST_USER.email);
    
    // Save the token for subsequent tests
    authToken = data.data.token;
  });

  it('should get current user with valid token', async () => {
    const response = await fetch(`${cleanBaseUrl}/auth/status`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    console.log('Status response:', data);
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('email', TEST_USER.email);
  });

  it('should logout the user', async () => {
    const response = await fetch(`${cleanBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Logout response:', data);
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
  });

  it('should handle invalid token gracefully', async () => {
    const response = await fetch(`${cleanBaseUrl}/auth/status`, {
      headers: {
        'Authorization': 'Bearer invalid.token.here'
      }
    });

    const data = await response.json();
    console.log('Invalid token response:', data);
    
    // The API returns 200 with isAuthenticated: false for invalid tokens
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('isAuthenticated', false);
  });
});
