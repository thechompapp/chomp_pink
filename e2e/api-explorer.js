#!/usr/bin/env node

/**
 * API Explorer
 * 
 * This script helps diagnose the API structure by attempting to connect
 * to various endpoints and reporting their status.
 */

import axios from 'axios';
import { setTimeout } from 'timers/promises';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Print a formatted message to the console
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Print a section header
 */
function logSection(title) {
  console.log('\n');
  log(`${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
  console.log('\n');
}

/**
 * Test an API endpoint and return the result
 */
async function testEndpoint(baseUrl, endpoint, method = 'get', data = null, timeout = 5000) {
  const url = `${baseUrl}${endpoint}`;
  log(`Testing ${method.toUpperCase()} ${url}...`, colors.dim);
  
  try {
    const config = {
      method,
      url: endpoint,
      baseURL: baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        success: false,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        error: 'No response received',
        code: error.code,
        message: error.message
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        success: false,
        error: 'Request setup error',
        message: error.message
      };
    }
  }
}

/**
 * Print the result of an endpoint test
 */
function printEndpointResult(endpoint, result) {
  if (result.success) {
    log(`✅ ${endpoint}: ${result.status}`, colors.green);
    
    if (typeof result.data === 'object') {
      log('Response data:', colors.dim);
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      log(`Response data: ${result.data}`, colors.dim);
    }
  } else if (result.status) {
    log(`❌ ${endpoint}: ${result.status}`, colors.red);
    
    if (result.data) {
      log('Error data:', colors.dim);
      console.log(JSON.stringify(result.data, null, 2));
    }
  } else {
    log(`❌ ${endpoint}: ${result.error} - ${result.message}`, colors.red);
  }
  
  console.log('\n');
}

/**
 * Main function
 */
async function main() {
  log(`${colors.bright}${colors.magenta}Doof API Explorer${colors.reset}`, colors.magenta);
  log(`Starting at: ${new Date().toLocaleString()}`, colors.dim);
  
  // Define the base URL
  const baseUrl = 'http://localhost:5173';
  
  // Define endpoints to test
  const endpoints = [
    // Health endpoints
    { path: '/api/health', method: 'get' },
    { path: '/health', method: 'get' },
    { path: '/api', method: 'get' },
    { path: '/', method: 'get' },
    
    // Auth endpoints
    { 
      path: '/api/auth/login', 
      method: 'post',
      data: { email: 'user@example.com', password: 'password123' }
    },
    { path: '/auth/login', method: 'post', data: { email: 'user@example.com', password: 'password123' } },
    
    // User endpoints
    { path: '/api/user/profile', method: 'get' },
    { path: '/user/profile', method: 'get' },
    
    // Restaurant endpoints
    { path: '/api/restaurants', method: 'get' },
    { path: '/restaurants', method: 'get' },
    
    // Dish endpoints
    { path: '/api/dishes', method: 'get' },
    { path: '/dishes', method: 'get' }
  ];
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    const result = await testEndpoint(
      baseUrl, 
      endpoint.path, 
      endpoint.method, 
      endpoint.data
    );
    
    printEndpointResult(endpoint.path, result);
    
    // Add a small delay between requests
    await setTimeout(500);
  }
  
  logSection('API Exploration Complete');
}

// Run the main function
main().catch(error => {
  log(`Error: ${error.message}`, colors.red);
  process.exit(1);
});
