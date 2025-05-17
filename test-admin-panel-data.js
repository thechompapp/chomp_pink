/**
 * Test script for Admin Panel data loading
 * 
 * This script tests the admin API endpoints and verifies the response format
 * to ensure the frontend can properly process the data.
 */

import axios from 'axios';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const API_URL = 'http://localhost:5173/api';
const AUTH_ENDPOINT = '/auth/login';
const ADMIN_ENDPOINTS = [
  '/admin/restaurants',
  '/admin/dishes',
  '/admin/users',
  '/admin/cities',
  '/admin/neighborhoods',
  '/admin/hashtags',
  '/admin/submissions'
];

// Authentication credentials
const AUTH_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'doof123'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log with color
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Get authentication token
 */
async function authenticate() {
  log('Authenticating...', colors.blue);
  try {
    const response = await axios.post(`${API_URL}${AUTH_ENDPOINT}`, AUTH_CREDENTIALS);
    if (response.data && response.data.token) {
      log('Authentication successful!', colors.green);
      return response.data.token;
    } else {
      log('Authentication failed: No token in response', colors.red);
      console.log(response.data);
      return null;
    }
  } catch (error) {
    log(`Authentication error: ${error.message}`, colors.red);
    if (error.response) {
      console.log(error.response.data);
    }
    return null;
  }
}

/**
 * Test an admin endpoint
 */
async function testEndpoint(endpoint, token) {
  log(`Testing endpoint: ${endpoint}`, colors.yellow);
  try {
    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Check if the response has the expected structure
    if (response.data && response.data.success === true && Array.isArray(response.data.data)) {
      log(`✅ Endpoint ${endpoint} returned valid data structure`, colors.green);
      log(`   - Data items: ${response.data.data.length}`, colors.cyan);
      
      // Sample the first item if available
      if (response.data.data.length > 0) {
        const sample = response.data.data[0];
        log(`   - Sample item keys: ${Object.keys(sample).join(', ')}`, colors.cyan);
      }
      
      return response.data;
    } else {
      log(`❌ Endpoint ${endpoint} returned unexpected data structure`, colors.red);
      console.log(response.data);
      return null;
    }
  } catch (error) {
    log(`Error testing endpoint ${endpoint}: ${error.message}`, colors.red);
    if (error.response) {
      console.log(error.response.data);
    }
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  log('Starting Admin Panel API tests', colors.magenta);
  
  // Get authentication token
  const token = await authenticate();
  if (!token) {
    log('Tests aborted due to authentication failure', colors.red);
    return;
  }
  
  // Test all endpoints
  const results = {};
  for (const endpoint of ADMIN_ENDPOINTS) {
    const result = await testEndpoint(endpoint, token);
    results[endpoint] = result;
  }
  
  // Save results to file for analysis
  fs.writeFileSync(`${__dirname}/admin-api-test-results.json`, JSON.stringify(results, null, 2));
  log('Test results saved to admin-api-test-results.json', colors.blue);
  
  // Summary
  log('\nTest Summary:', colors.magenta);
  let passCount = 0;
  for (const endpoint of ADMIN_ENDPOINTS) {
    const passed = results[endpoint] !== null;
    if (passed) passCount++;
    log(`${passed ? '✅' : '❌'} ${endpoint}`, passed ? colors.green : colors.red);
  }
  
  log(`\n${passCount} of ${ADMIN_ENDPOINTS.length} tests passed`, 
    passCount === ADMIN_ENDPOINTS.length ? colors.green : colors.yellow);
}

// Run the tests
runTests().catch(error => {
  log(`Unhandled error: ${error.message}`, colors.red);
  console.error(error);
});
