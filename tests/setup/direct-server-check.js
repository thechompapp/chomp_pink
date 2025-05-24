/**
 * Direct Server Check
 * 
 * This module provides a direct way to check if servers are running
 * using Node's native http module to avoid any cross-origin issues.
 */

import http from 'http';

// Server configurations
const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5175';

/**
 * Check if a server is running using Node's native http module
 * @param {string} url - Full URL to check
 * @param {string} path - Path to check (e.g., '/api/health')
 * @returns {Promise<boolean>} - True if server is running
 */
export function checkServer(url, path = '/') {
  return new Promise((resolve) => {
    // Parse the URL to get host and port
    const urlObj = new URL(url + path);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname,
      method: 'GET',
      timeout: 5000
    };
    
    console.log(`Checking server at ${url}${path}...`);
    
    const req = http.request(options, (res) => {
      console.log(`Server at ${url}${path} responded with status: ${res.statusCode}`);
      
      // Consider 2xx and 3xx status codes as success
      const success = res.statusCode >= 200 && res.statusCode < 400;
      resolve(success);
      
      // Consume response data to free up memory
      res.resume();
    });
    
    req.on('error', (err) => {
      console.error(`Error connecting to ${url}${path}: ${err.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.error(`Connection to ${url}${path} timed out`);
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
}

/**
 * Check if the backend server is running
 * @returns {Promise<boolean>}
 */
export async function isBackendRunning() {
  return await checkServer(BACKEND_URL, '/api/health');
}

/**
 * Check if the frontend server is running
 * @returns {Promise<boolean>}
 */
export async function isFrontendRunning() {
  return await checkServer(FRONTEND_URL);
}

/**
 * Verify that the backend server is running
 * @throws {Error} If backend server is not running
 */
export async function verifyBackendServer() {
  const isRunning = await isBackendRunning();
  
  if (!isRunning) {
    throw new Error('Backend server MUST be running to execute these tests. Please start the server and try again.');
  }
  
  console.log('✅ Backend server is connected and ready for tests');
  return true;
}

export { BACKEND_URL, FRONTEND_URL };
