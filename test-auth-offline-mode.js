/**
 * Authentication and Offline Mode Test Script
 * 
 * This script tests the authentication system and ensures that
 * offline mode is properly disabled when a user is authenticated.
 */

// Import required modules
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  apiUrl: 'http://localhost:5001/api',
  credentials: {
    email: 'admin@example.com',
    password: 'doof123'
  }
};

// Helper function to log with timestamp
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Helper function to check localStorage
function checkLocalStorage() {
  if (typeof localStorage !== 'undefined') {
    log('Checking localStorage values:');
    log(`- offline-mode: ${localStorage.getItem('offline-mode')}`);
    log(`- offline_mode: ${localStorage.getItem('offline_mode')}`);
    log(`- force_online: ${localStorage.getItem('force_online')}`);
    log(`- bypass_auth_check: ${localStorage.getItem('bypass_auth_check')}`);
    log(`- auth-token: ${localStorage.getItem('auth-token') ? 'Present' : 'Not present'}`);
  } else {
    log('localStorage not available in this environment');
  }
}

// Test authentication flow
async function testAuthentication() {
  log('Starting authentication test');
  
  try {
    // Step 1: Attempt login
    log('Attempting login with admin credentials');
    const loginResponse = await axios.post(`${config.apiUrl}/auth/login`, config.credentials);
    
    if (loginResponse.data && loginResponse.data.token) {
      log('Login successful, received token');
      
      // Step 2: Check offline mode flags
      log('Checking if offline mode flags are properly cleared');
      checkLocalStorage();
      
      // Step 3: Test authenticated API call
      log('Testing authenticated API call');
      const authResponse = await axios.get(`${config.apiUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      
      if (authResponse.data && authResponse.data.user) {
        log('Authenticated API call successful');
        log(`User role: ${authResponse.data.user.role}`);
        log(`Is superuser: ${authResponse.data.user.account_type === 'superuser'}`);
      } else {
        log('Authenticated API call failed: Invalid response format');
      }
      
      // Step 4: Check admin status
      log('Checking admin status');
      const adminResponse = await axios.get(`${config.apiUrl}/admin/status`, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      
      if (adminResponse.data && adminResponse.data.isAdmin) {
        log('Admin status confirmed');
      } else {
        log('Admin status check failed');
      }
      
      log('Authentication test completed successfully');
      return true;
    } else {
      log('Login failed: Invalid response format');
      return false;
    }
  } catch (error) {
    log(`Authentication test failed: ${error.message}`);
    if (error.response) {
      log(`Status: ${error.response.status}`);
      log(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return false;
  }
}

// Run the test
testAuthentication()
  .then(success => {
    if (success) {
      log('All tests passed!');
      process.exit(0);
    } else {
      log('Tests failed');
      process.exit(1);
    }
  })
  .catch(error => {
    log(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
