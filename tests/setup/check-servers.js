/**
 * Server Check Utility
 * 
 * This script checks if both the backend and frontend servers are running
 * before executing any tests. It uses direct HTTP requests without axios
 * to avoid any configuration issues.
 */

import http from 'http';
import https from 'https';

// Server configurations
const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5175';

/**
 * Make a simple HTTP request to check if a server is running
 * @param {string} url - The URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} - True if server is running, false otherwise
 */
function checkServer(url, timeout = 5000) {
  return new Promise((resolve) => {
    console.log(`Checking server at ${url}...`);
    
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      console.log(`Server at ${url} responded with status: ${res.statusCode}`);
      resolve(res.statusCode >= 200 && res.statusCode < 500);
      res.resume(); // Consume response to free up memory
    });
    
    req.on('error', (err) => {
      console.error(`Error connecting to ${url}: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(timeout, () => {
      console.error(`Connection to ${url} timed out after ${timeout}ms`);
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Check if the backend server is running
 * @returns {Promise<boolean>}
 */
async function isBackendRunning() {
  return await checkServer(`${BACKEND_URL}/api/health`);
}

/**
 * Check if the frontend server is running
 * @returns {Promise<boolean>}
 */
async function isFrontendRunning() {
  return await checkServer(`${FRONTEND_URL}`);
}

/**
 * Check if both servers are running
 * @returns {Promise<{backend: boolean, frontend: boolean}>}
 */
async function checkBothServers() {
  const [backend, frontend] = await Promise.all([
    isBackendRunning(),
    isFrontendRunning()
  ]);
  
  return { backend, frontend };
}

// Export the functions
export {
  isBackendRunning,
  isFrontendRunning,
  checkBothServers,
  BACKEND_URL,
  FRONTEND_URL
};
