const { makeRequest, tokenStorage } = require('../setup/integration-setup');
const { testIf, runIntegrationTests } = require('../setup/test-utils');

// Test configuration
const TEST_TIMEOUT = 30000; // 30 seconds

// Helper function to validate health check response
const validateHealthCheckResponse = (response) => {
  expect(response.status).toBe(200);
  expect(response.data).toHaveProperty('status');
  expect(['UP', 'DOWN']).toContain(response.data.status);
  expect(response.data).toHaveProperty('message');
  expect(response.data).toHaveProperty('timestamp');
  
  // Check if timestamp is valid
  const timestamp = new Date(response.data.timestamp);
  expect(timestamp.toString()).not.toBe('Invalid Date');
  
  return response.data;
};

describe('Health Check API', () => {
  // Basic health check test
  test('should return a successful health check response', async () => {
    const response = await makeRequest('GET', '/health');
    const healthData = validateHealthCheckResponse(response);
    
    // Basic response structure
    expect(healthData).toMatchObject({
      status: expect.any(String),
      message: expect.any(String),
      timestamp: expect.any(String)
    });
    
    if (healthData.status === 'DOWN') {
      console.warn('API is reporting DOWN status:', healthData);
    }
  }, TEST_TIMEOUT);
  
  // Test different HTTP methods
  describe('HTTP Method Handling', () => {
    test('should handle HEAD requests', async () => {
      const response = await makeRequest('HEAD', '/health');
      expect(response.status).toBe(200);
      expect(response.data).toBe(''); // HEAD responses typically have no body
    });
    
    test('should handle OPTIONS requests', async () => {
      const response = await makeRequest('OPTIONS', '/health');
      expect([200, 204]).toContain(response.status);
    });
    
    test('should handle POST requests', async () => {
      try {
        const response = await makeRequest('POST', '/health', {});
        expect([200, 405]).toContain(response.status);
      } catch (error) {
        expect(error.response.status).toBe(405); // Method Not Allowed
      }
    });
  });
  
  // Test error handling
  describe('Error Handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
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
    });

    test('should handle invalid HTTP methods', async () => {
      try {
        await makeRequest('INVALID_METHOD', '/health');
        fail('Expected error for invalid HTTP method');
      } catch (error) {
        expect([400, 405]).toContain(error.response?.status);
      }
    });
  });
  
  // Test with different content types
  describe('Content Type Handling', () => {
    const contentTypes = [
      'application/json',
      'application/x-www-form-urlencoded',
      'text/plain'
    ];
    
    contentTypes.forEach(contentType => {
      test(`should handle ${contentType} content type`, async () => {
        const response = await makeRequest('GET', '/health', null, {
          headers: { 'Content-Type': contentType }
        });
        validateHealthCheckResponse(response);
      });
    });
  });
  
  // Test with different query parameters
  test('should ignore query parameters', async () => {
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
  
  // Test server information if available
  describe('Server Information', () => {
    test('should include server information if available', async () => {
      const response = await makeRequest('GET', '/health');
      const { data } = response;
      
      // These fields are optional, only test if they exist
      if (data.version) {
        expect(typeof data.version).toBe('string');
      }
      
      if (data.uptime) {
        expect(typeof data.uptime).toBe('number');
        expect(data.uptime).toBeGreaterThan(0);
      }
      
      if (data.environment) {
        expect(typeof data.environment).toBe('string');
        expect(['development', 'test', 'staging', 'production']).toContain(data.environment);
      }
      
      if (data.memoryUsage) {
        expect(typeof data.memoryUsage).toBe('object');
        expect(data.memoryUsage).toHaveProperty('rss');
        expect(data.memoryUsage).toHaveProperty('heapTotal');
        expect(data.memoryUsage).toHaveProperty('heapUsed');
      }
    });
  });
  
  // Test database connection status if available
  describe('Database Status', () => {
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
          expect(response.data.database.pingTime).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
  
  // Test external service status if available
  describe('External Services', () => {
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
    });
  });
});

// Add a message when integration tests are skipped
if (!runIntegrationTests) {
  console.log('Integration tests are disabled. Set RUN_INTEGRATION_TESTS=true to enable them.');
}
