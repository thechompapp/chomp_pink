/**
 * Health Endpoint Integration Test
 * 
 * This file contains integration tests for the health endpoint.
 * It follows the project's rules by using real API endpoints and data.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import axios from 'axios';
import { config, skipIfNoIntegration, debugLog } from '../setup/test-config.js';

// Test timeout (30 seconds to allow for API response time)
const TEST_TIMEOUT = 30000;

// Skip tests if integration tests are disabled
describe.skipIf(!config.test.integration)('Health Endpoint (Integration)', () => {
  let healthResponse;
  let apiClient;

  beforeAll(() => {
    // Create a fresh axios instance for testing with minimal configuration
    apiClient = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: config.api.headers,
      withCredentials: false
    });

    // Simple request interceptor for logging
    apiClient.interceptors.request.use(request => {
      console.log(`[TEST] Sending ${request.method?.toUpperCase()} to ${request.url}`);
      return request;
    });

    // Simple response interceptor for logging
    apiClient.interceptors.response.use(
      response => {
        console.log(`[TEST] Received ${response.status} from ${response.config.url}`);
        return response;
      },
      error => {
        if (error.response) {
          console.error('[TEST] Error response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            url: error.config.url,
            data: error.response.data
          });
        } else if (error.request) {
          console.error('[TEST] No response received:', error.message);
        } else {
          console.error('[TEST] Request setup error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }, TEST_TIMEOUT);

  it('should return a 200 status code and UP status', async () => {
    try {
      // Make a real API request to the health endpoint
      const response = await apiClient.get('/health');
      healthResponse = response.data;
      
      debugLog('Health check response:', response.data);
      
      // Basic response validation
      expect(response.status).toBe(200);
      expect(healthResponse).toBeDefined();
      expect(healthResponse.status).toBe('UP');
      expect(healthResponse.message).toBeDefined();
      expect(healthResponse.timestamp).toBeDefined();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error; // Re-throw to fail the test
    }
  }, TEST_TIMEOUT);
  
  it('should include database pool information', () => {
    expect(healthResponse).toBeDefined();
    expect(healthResponse.databasePool).toBeDefined();
    expect(healthResponse.databasePool).toMatchObject({
      total: expect.any(Number),
      idle: expect.any(Number),
      waiting: expect.any(Number)
    });
  });
  
  it('should include memory usage information', () => {
    expect(healthResponse).toBeDefined();
    expect(healthResponse.memoryUsage).toBeDefined();
    expect(healthResponse.memoryUsage).toMatchObject({
      rss: expect.any(Number),
      heapTotal: expect.any(Number),
      heapUsed: expect.any(Number)
    });
  });
  
  it('should respond within a reasonable time', async () => {
    const startTime = Date.now();
    try {
      const response = await apiClient.get('/health');
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      debugLog(`Health endpoint response time: ${responseTime}ms`);
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond in under 1 second
    } catch (error) {
      console.error('Health check failed in response time test:', error);
      throw error; // Re-throw to fail the test
    }
  }, TEST_TIMEOUT);
  
  afterAll(() => {
    // Clean up any resources if needed
    debugLog('Cleaning up test resources');
  });
});

// Add a message when integration tests are skipped
if (!config.test.integration) {
  console.log('\n\x1b[33m%s\x1b[0m', 
    'Integration tests are skipped. Set RUN_INTEGRATION_TESTS=true to run them.'
  );
}
