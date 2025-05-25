/**
 * Direct API Tests
 * 
 * This script tests the API endpoints directly using Node.js HTTP requests,
 * bypassing CORS restrictions that occur in browser environments.
 */

import http from 'http';
import https from 'https';
import { URL } from 'url';

// Configuration
const BACKEND_URL = 'http://localhost:5001';
const TEST_TIMEOUT = 10000; // 10 seconds

// API Endpoints
const API_ENDPOINTS = {
  HEALTH: '/api/health',
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    STATUS: '/api/auth/status'
  },
  E2E: {
    RESTAURANTS: '/api/e2e/restaurants',
    DISHES: '/api/e2e/dishes'
  }
};

/**
 * Make an HTTP request to the API
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} path - API endpoint path
 * @param {object} data - Request body data (for POST, PUT, etc.)
 * @param {object} headers - Request headers
 * @returns {Promise<object>} - Response data
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Test-Mode': 'true',
        ...headers
      },
      timeout: TEST_TIMEOUT
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          console.error('Error parsing response data:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Request error for ${path}:`, error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout for ${path}`));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Run a test case
 * @param {string} name - Test name
 * @param {Function} testFn - Test function
 */
async function runTest(name, testFn) {
  console.log(`\n🧪 Running test: ${name}`);
  try {
    await testFn();
    console.log(`✅ Test passed: ${name}`);
    return true;
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

/**
 * Assert that a condition is true
 * @param {boolean} condition - Condition to check
 * @param {string} message - Error message if condition is false
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Test the health check endpoint
 */
async function testHealthCheck() {
  const response = await makeRequest('GET', API_ENDPOINTS.HEALTH);
  
  assert(response.status === 200, `Expected status 200, got ${response.status}`);
  assert(response.data.status === 'UP', `Expected status UP, got ${response.data.status}`);
  
  console.log('Health check response:', {
    status: response.data.status,
    message: response.data.message
  });
}

/**
 * Test the E2E restaurants endpoint
 */
async function testE2ERestaurants() {
  const response = await makeRequest('GET', API_ENDPOINTS.E2E.RESTAURANTS);
  
  assert(response.status === 200, `Expected status 200, got ${response.status}`);
  assert(Array.isArray(response.data), 'Expected array response');
  
  console.log(`Received ${response.data.length} restaurants`);
}

/**
 * Test the E2E dishes endpoint
 */
async function testE2EDishes() {
  const response = await makeRequest('GET', API_ENDPOINTS.E2E.DISHES);
  
  assert(response.status === 200, `Expected status 200, got ${response.status}`);
  assert(Array.isArray(response.data), 'Expected array response');
  
  console.log(`Received ${response.data.length} dishes`);
}

/**
 * Test user registration
 */
async function testUserRegistration() {
  // Generate unique user data
  const uniqueId = Date.now();
  const userData = {
    email: `test${uniqueId}@example.com`,
    username: `testuser${uniqueId}`,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User'
  };
  
  const response = await makeRequest('POST', API_ENDPOINTS.AUTH.REGISTER, userData);
  
  assert(response.status === 201, `Expected status 201, got ${response.status}`);
  assert(response.data.success === true, 'Expected success to be true');
  assert(response.data.token, 'Expected token in response');
  
  console.log('Registration successful:', {
    email: userData.email,
    username: userData.username
  });
  
  return response.data.token;
}

/**
 * Test user login
 */
async function testUserLogin() {
  // First register a user
  const uniqueId = Date.now();
  const userData = {
    email: `login${uniqueId}@example.com`,
    username: `loginuser${uniqueId}`,
    password: 'Password123!',
    firstName: 'Login',
    lastName: 'Test'
  };
  
  // Register the user
  await makeRequest('POST', API_ENDPOINTS.AUTH.REGISTER, userData);
  
  // Now try to login
  const loginData = {
    email: userData.email,
    password: userData.password
  };
  
  const response = await makeRequest('POST', API_ENDPOINTS.AUTH.LOGIN, loginData);
  
  assert(response.status === 200, `Expected status 200, got ${response.status}`);
  assert(response.data.success === true, 'Expected success to be true');
  assert(response.data.token, 'Expected token in response');
  
  console.log('Login successful:', {
    email: userData.email
  });
  
  return response.data.token;
}

/**
 * Test auth status endpoint
 */
async function testAuthStatus(token) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  
  const response = await makeRequest('GET', API_ENDPOINTS.AUTH.STATUS, null, headers);
  
  assert(response.status === 200, `Expected status 200, got ${response.status}`);
  assert(response.data.success === true, 'Expected success to be true');
  
  if (token) {
    assert(response.data.isAuthenticated === true, 'Expected to be authenticated');
    console.log('Auth status: Authenticated');
  } else {
    assert(response.data.isAuthenticated === false, 'Expected to be unauthenticated');
    console.log('Auth status: Unauthenticated');
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🔍 Running Direct API Tests');
  console.log('==========================');
  
  let allTestsPassed = true;
  
  // Test health check
  allTestsPassed = await runTest('Health Check', testHealthCheck) && allTestsPassed;
  
  // Test E2E endpoints
  allTestsPassed = await runTest('E2E Restaurants', testE2ERestaurants) && allTestsPassed;
  allTestsPassed = await runTest('E2E Dishes', testE2EDishes) && allTestsPassed;
  
  // Test auth endpoints
  let token;
  try {
    token = await runTest('User Registration', testUserRegistration) ? await testUserRegistration() : null;
  } catch (error) {
    console.error('Error during registration:', error.message);
    allTestsPassed = false;
  }
  
  try {
    const loginToken = await runTest('User Login', testUserLogin) ? await testUserLogin() : null;
    if (loginToken) {
      allTestsPassed = await runTest('Auth Status (Authenticated)', () => testAuthStatus(loginToken)) && allTestsPassed;
    }
  } catch (error) {
    console.error('Error during login:', error.message);
    allTestsPassed = false;
  }
  
  allTestsPassed = await runTest('Auth Status (Unauthenticated)', () => testAuthStatus(null)) && allTestsPassed;
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('==============');
  console.log(allTestsPassed ? '✅ All tests passed!' : '❌ Some tests failed!');
  
  // Exit with appropriate code
  process.exit(allTestsPassed ? 0 : 1);
}

// Run all tests
runAllTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
