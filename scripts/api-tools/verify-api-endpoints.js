/**
 * API Endpoint Verification
 * 
 * This script directly checks the API endpoints using Node's native http module
 * to avoid any cross-origin or configuration issues.
 */

import http from 'http';

// Backend server configuration
const BACKEND_URL = 'http://localhost:5001';
const API_ENDPOINTS = [
  { path: '/api/health', method: 'GET', description: 'Health Check' },
  { path: '/api/auth/status', method: 'GET', description: 'Auth Status' },
  { path: '/api/auth/register', method: 'POST', description: 'User Registration', 
    data: { email: 'test@example.com', password: 'Password123!', name: 'Test User' } },
  { path: '/api/auth/login', method: 'POST', description: 'User Login', 
    data: { email: 'test@example.com', password: 'Password123!' } }
];

/**
 * Make a direct HTTP request to an API endpoint
 * @param {Object} endpoint - Endpoint configuration
 * @returns {Promise<Object>} - Response data
 */
function checkEndpoint(endpoint) {
  return new Promise((resolve) => {
    // Parse the URL
    const url = new URL(BACKEND_URL + endpoint.path);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 5000
    };
    
    console.log(`\nChecking ${endpoint.description} (${endpoint.method} ${endpoint.path})...`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        
        try {
          const jsonData = data ? JSON.parse(data) : {};
          console.log('Response:', JSON.stringify(jsonData, null, 2));
          resolve({ 
            success: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            data: jsonData
          });
        } catch (err) {
          console.log('Raw response:', data);
          resolve({ 
            success: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            data: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      console.error(`Error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
    
    req.on('timeout', () => {
      console.error('Request timed out');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
    
    // Send request data if needed
    if (endpoint.data && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
      const postData = JSON.stringify(endpoint.data);
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * Main function to check all endpoints
 */
async function main() {
  console.log('🔍 Verifying API Endpoints...');
  console.log(`Backend URL: ${BACKEND_URL}`);
  
  for (const endpoint of API_ENDPOINTS) {
    await checkEndpoint(endpoint);
  }
  
  console.log('\n✅ API endpoint verification complete');
}

// Run the main function
main().catch(err => {
  console.error('Unhandled error:', err);
});
