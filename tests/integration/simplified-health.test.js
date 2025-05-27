/**
 * Health Endpoint Integration Test
 * 
 * This file contains integration tests for the health endpoint.
 * It follows the project's rules by using real API endpoints and data.
 */

import { describe, it, expect, beforeAll, afterAll, fail, vi } from 'vitest';
import { config } from '../setup/config.js';
import { tokenStorage } from '../utils/tokenStorage.js';
import axios from 'axios';

// Determine if we should run integration tests
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true' || true; // Force true for now

// Test timeout (30 seconds for integration tests)
const TEST_TIMEOUT = 30000;

// Base URL for API endpoints
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';
const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

// Test user credentials from environment variables
const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'testuser@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
  username: process.env.TEST_USER_USERNAME || 'testuser'
};

// Helper to conditionally run tests (unused but keeping for future use)
const testIf = (condition) => condition ? it : it.skip;

// Configure axios instance for tests with shorter timeouts
const apiClient = axios.create({
  baseURL: cleanBaseUrl,
  timeout: 5000, // Reduced from 10000 to fail faster
  headers: {
    'Content-Type': 'application/json',
  },
});

// Disable request/response interceptors in test mode to reduce noise
if (process.env.NODE_ENV !== 'test') {
  // Add request interceptor for logging
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    (error) => {
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Add response interceptor for logging
  apiClient.interceptors.response.use(
    (response) => {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error('[API Response Error]', error.message);
      return Promise.reject(error);
    }
  );
}
// Add request interceptor to include auth token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle errors consistently
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors
      tokenStorage.clearToken();
    }
    return Promise.reject(error);
  }
);

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, options = {}) => {
  const { headers = {} } = options;
  try {
    // Handle URL construction
    let url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    const config = {
      method: method.toLowerCase(),
      url,
      headers: {
        ...headers
      }
    };
    
    if (data) {
      if (method.toLowerCase() === 'get') {
        config.params = data;
      } else {
        config.data = data;
      }
    }
    
    const response = await apiClient(config);
    return response;
  } catch (error) {
    // Enhance the error with more context
    const errorMessage = `Request failed (${method} ${endpoint}): ${error.response?.data?.message || error.message}`;
    const enhancedError = new Error(errorMessage);
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

// Helper function to register a test user
const registerTestUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data?.token) {
      tokenStorage.setToken(response.data.token);
      return {
        success: true,
        data: response.data
      };
    }
  } catch (error) {
    console.error('Error registering test user:', error);
  }
};

// Helper function to validate health check response
const validateHealthCheckResponse = (response) => {
  expect(response.status).toBe(200);
  expect(response.data).toHaveProperty('status');
  expect(['UP', 'DOWN']).toContain(response.data.status);
  expect(response.data).toHaveProperty('message');
  expect(response.data).toHaveProperty('timestamp');
  
  // Check if timestamp is valid
  const timestamp = new Date(response.data.timestamp);
  expect(timestamp instanceof Date && !isNaN(timestamp)).toBe(true);
  
  return response.data;
};

describe('Health Check Integration Tests', () => {
  // Force tests to run in series to prevent race conditions
  beforeEach(() => {
    // Reset any mocks or spies
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Ensure all pending promises are resolved
    await new Promise(resolve => setImmediate(resolve));
  });
  // Basic health check test
  it('should return a successful health check response with expected structure', async () => {
    console.log('Testing basic health check endpoint...');
    const response = await makeRequest('GET', '/health');
    
    console.log('Health check response:', {
      status: response.status,
      data: response.data
    });
    
    const healthData = validateHealthCheckResponse(response);
    
    // Additional assertions for the health check data
    expect(healthData).toMatchObject({
      status: expect.any(String),
      message: expect.any(String),
      timestamp: expect.any(String)
    });
    
    if (healthData.status === 'DOWN') {
      console.warn('API is reporting DOWN status:', healthData);
    }
  }, TEST_TIMEOUT);
  
  // Test with different HTTP methods
  it('should handle different HTTP methods appropriately', async () => {
    // HEAD request should work without body
    const headResponse = await makeRequest('HEAD', '/health');
    expect(headResponse.status).toBe(200);
    
    // OPTIONS request should return allowed methods
    const optionsResponse = await makeRequest('OPTIONS', '/health');
    expect([200, 204]).toContain(optionsResponse.status);
    
    // POST should be allowed but might return 200 or 405
    try {
      const postResponse = await makeRequest('POST', '/health', {});
      expect([200, 405]).toContain(postResponse.status);
    } catch (error) {
      expect(error.response.status).toBe(405); // Method Not Allowed
    }
  }, TEST_TIMEOUT);
  
  // Test error handling for non-existent endpoints
  it('should return appropriate error for non-existent endpoints', async () => {
    const invalidEndpoints = [
      '/health/nonexistent',
      '/health-invalid',
      '/api/healthz',
      '/health/'
    ];
    
    for (const endpoint of invalidEndpoints) {
      try {
        await makeRequest('GET', endpoint);
        fail(`Expected 404 for endpoint: ${endpoint}`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    }
  }, TEST_TIMEOUT);
  
  // Test with different content types
  it('should handle different content types', async () => {
    const contentTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'text/plain'
    ];
    
    for (const contentType of contentTypes) {
      const response = await makeRequest('GET', '/health', null, {
        headers: { 'Content-Type': contentType }
      });
      
      expect(response.status).toBe(200);
      validateHealthCheckResponse(response);
    }
  }, TEST_TIMEOUT);
  
  // Test with various query parameters (should be ignored by health check)
  it('should ignore query parameters', async () => {
    const params = [
      '?test=1',
      '?cache=false&debug=true',
      '?',
      '?invalid=param&another=one'
    ];
    
    for (const param of params) {
      const response = await makeRequest('GET', `/health${param}`);
      validateHealthCheckResponse(response);
    }
  }, TEST_TIMEOUT);
  
  // Test with different user agents
  test('should work with different user agents', async () => {
    const userAgents = [
      'Mozilla/5.0',
      'Chrome/91.0',
      'PostmanRuntime/7.28.4',
      'curl/7.68.0'
    ];
    
    for (const ua of userAgents) {
      const response = await makeRequest('GET', '/health', null, {
        headers: { 'User-Agent': ua }
      });
      
      validateHealthCheckResponse(response);
    }
  }, TEST_TIMEOUT);
  
  // Test with malformed requests
  test('should handle malformed requests gracefully', async () => {
    // Test with invalid HTTP method
    try {
      await makeRequest('INVALID_METHOD', '/health');
      fail('Expected error for invalid HTTP method');
    } catch (error) {
      expect([400, 405]).toContain(error.response?.status);
    }
    
    // Test with malformed headers
    try {
      await makeRequest('GET', '/health', null, {
        headers: { 'X-Custom-Header': 'value\x00with\x00null\x00bytes' }
      });
      // Some servers might accept this, others might not
    } catch (error) {
      // Some encodings might not be supported, which is okay
      console.log(`Encoding not supported:`, error.message);
    }
  }, TEST_TIMEOUT);
  
  // Test with rate limiting (if applicable)
  test('should handle rate limiting', async () => {
    // Make multiple requests in quick succession
    const requests = Array(10).fill().map(() => 
      makeRequest('GET', '/health').catch(e => e)
    );
    
    const responses = await Promise.all(requests);
    
    // Check that at least some requests succeeded
    const successResponses = responses.filter(r => r.status === 200);
    expect(successResponses.length).toBeGreaterThan(0);
    
    // If rate limited, some might return 429, but that's okay
    const rateLimited = responses.filter(r => r.response?.status === 429);
    if (rateLimited.length > 0) {
      console.log(`Rate limited ${rateLimited.length} out of ${requests.length} requests`);
    }
  }, TEST_TIMEOUT);
  
  // Test with different authentication states
  describe('with authentication', () => {
    beforeAll(() => {
      // Clear any existing tokens
      tokenStorage.clearToken();
    });
    
    test('should work without authentication', async () => {
      const response = await makeRequest('GET', '/health');
      validateHealthCheckResponse(response);
    });
    
    test('should work with malformed auth headers', async () => {
      // Test with malformed auth headers
      const response = await makeRequest('GET', '/health', null, {
        headers: { 'Authorization': 'Bearer invalid.token.here' }
      });
      
      // Should still work even with invalid auth
      validateHealthCheckResponse(response);
    });
  });
  
  // Test with different request timeouts
  test('should handle request timeouts', async () => {
    // Test with very short timeout
    try {
      await makeRequest('GET', '/health', null, { timeout: 1 });
    } catch (error) {
      expect(['ECONNABORTED', 'ETIMEDOUT']).toContain(error.code);
    }
    
    // Test with normal timeout
    const response = await makeRequest('GET', '/health', null, { timeout: 5000 });
    validateHealthCheckResponse(response);
  }, TEST_TIMEOUT);
  
  // Test with different request sizes
  test('should handle large request headers', async () => {
    // Create a very large header
    const largeHeader = 'x'.repeat(8000);
    
    const response = await makeRequest('GET', '/health', null, {
      headers: { 'X-Test-Header': largeHeader }
    });
    
    validateHealthCheckResponse(response);
  }, TEST_TIMEOUT);
  
  // Test with different content encodings
  test('should handle different content encodings', async () => {
    const encodings = ['gzip', 'deflate', 'br'];
    
    for (const encoding of encodings) {
      try {
        const response = await makeRequest('GET', '/health', null, {
          headers: { 'Accept-Encoding': encoding }
        });
        
        // The response might or might not use the requested encoding
        expect(response.status).toBe(200);
        validateHealthCheckResponse(response);
      } catch (error) {
        // Some encodings might not be supported, which is okay
        console.log(`Encoding ${encoding} not supported:`, error.message);
      }
    }
  }, TEST_TIMEOUT);
  
  // Test with different cache control headers
  test('should respect cache control headers', async () => {
    const cacheControls = [
      'no-cache',
      'no-store',
      'max-age=0',
      'max-age=60',
      'public, max-age=60',
      'private, no-cache, no-store, must-revalidate'
    ];
    
    for (const cacheControl of cacheControls) {
      const response = await makeRequest('GET', '/health', null, {
        headers: { 'Cache-Control': cacheControl }
      });
      
      validateHealthCheckResponse(response);
      
      // The API might or might not include cache headers in the response
      if (response.headers['cache-control']) {
    
    // Check if timestamp is recent (within last 5 minutes to be safe)
    const now = new Date();
    }
  }
}, TEST_TIMEOUT);

// Test server information if available
test('should return server information if available', async () => {
  const response = await makeRequest('GET', '/health');
  
  // These fields are optional, only test if they exist
  if (response.data.version) {
    expect(typeof response.data.version).toBe('string');
  }
  
  if (response.data.uptime) {
    expect(typeof response.data.uptime).toBe('number');
    expect(response.data.uptime).toBeGreaterThan(0);
  }
  
  if (response.data.environment) {
    expect(typeof response.data.environment).toBe('string');
    expect(['development', 'test', 'staging', 'production']).toContain(response.data.environment);
  }
  
  if (response.data.memoryUsage) {
    expect(typeof response.data.memoryUsage).toBe('object');
    expect(response.data.memoryUsage).toHaveProperty('rss');
    expect(response.data.memoryUsage).toHaveProperty('heapTotal');
    expect(response.data.memoryUsage).toHaveProperty('heapUsed');
  }
}, TEST_TIMEOUT);

// Test database connection status if available
test('should report database connection status if available', async () => {
  const response = await makeRequest('GET', '/health');
  
  if (response.data.database) {
    expect(typeof response.data.database).toBe('object');
    expect(response.data.database).toHaveProperty('status');
    expect(['UP', 'DOWN']).toContain(response.data.database.status);
    
    if (response.data.database.type) {
      expect(typeof response.data.database.type).toBe('string');
    }
    
    if (response.data.database.pingTime) {
      expect(typeof response.data.database.pingTime).toBe('number');
    }
  }
}, TEST_TIMEOUT);

// Test external service status if available
test('should report external service status if available', async () => {
  const response = await makeRequest('GET', '/health');
  
  if (response.data.services) {
    expect(Array.isArray(response.data.services)).toBe(true);
    
    for (const service of response.data.services) {
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('status');
      expect(['UP', 'DOWN', 'DEGRADED']).toContain(service.status);
      
      if (service.responseTime) {
        expect(typeof service.responseTime).toBe('number');
        expect(service.responseTime).toBeGreaterThanOrEqual(0);
      }
    }
  }
}, TEST_TIMEOUT);

// Test timestamp
test('should return valid timestamps', async () => {
  const response = await makeRequest('GET', '/health');
  
  expect(response.status).toBe(200);
  
  // Check if timestamp is a valid date string
  const timestamp = new Date(response.data.timestamp);
  expect(timestamp.toString()).not.toBe('Invalid Date');
  
  // Check if timestamp is recent (within last 5 minutes to be safe)
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
  expect(timestamp.getTime()).toBeGreaterThan(fiveMinutesAgo.getTime());
  expect(timestamp.getTime()).toBeLessThanOrEqual(now.getTime());
}, TEST_TIMEOUT);

// Add a message when integration tests are skipped
if (!runIntegrationTests) {
  console.log('Integration tests are skipped. Set RUN_INTEGRATION_TESTS=true to run them.');
}
