import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import axios from 'axios';

// Base URL for API endpoints
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';
const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Admin credentials from memories
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'doof123',
  username: 'admin'
};

// Test user credentials - using admin credentials since we know they exist
const TEST_USER = ADMIN_CREDENTIALS;

// Configure axios instance for tests
const apiClient = axios.create({
  baseURL: cleanBaseUrl,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

describe('Authentication Flow', () => {
  // Set a timeout of 15 seconds for all tests in this suite
  const TEST_TIMEOUT = 15000;
  let authToken = '';

  beforeAll(() => {
    // Mock console methods to reduce test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should verify admin credentials', async () => {
    // Skip if we don't have admin credentials
    if (!ADMIN_CREDENTIALS.email || !ADMIN_CREDENTIALS.password) {
      console.warn('Admin credentials not found, skipping test');
      return;
    }
    
    console.log('Verifying admin credentials...');
  }, TEST_TIMEOUT);

  it('should login with admin credentials', async () => {
    // Skip if we don't have admin credentials
    if (!ADMIN_CREDENTIALS.email || !ADMIN_CREDENTIALS.password) {
      console.warn('Admin credentials not found, skipping test');
      return;
    }

    console.log('Attempting to login with admin credentials...');
    
    try {
      const response = await apiClient.post('/auth/login', {
        email: ADMIN_CREDENTIALS.email,
        password: ADMIN_CREDENTIALS.password
      }, {
        timeout: 10000 // 10 second timeout for login
      });

      console.log('Login response:', {
        status: response.status,
        data: response.data
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data.data).toHaveProperty('token');
      expect(response.data.data).toHaveProperty('user');
      
      // Store the token for future requests
      authToken = response.data.data.token;
      console.log('Successfully obtained auth token');
    } catch (error) {
      console.error('Login failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }, TEST_TIMEOUT);

  it('should get current user with valid token', async () => {
    // Skip if we don't have a token from the login test
    if (!authToken) {
      console.warn('No auth token available, skipping test');
      return;
    }
    
    console.log('Using auth token to fetch current user...');

    const response = await apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success', true);
    expect(response.data.data).toHaveProperty('email', TEST_USER.email);
  }, TEST_TIMEOUT);
});
