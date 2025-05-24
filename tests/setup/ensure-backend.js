/**
 * Ensure Backend Server
 * 
 * This script checks if the backend server is running and starts it if needed.
 * It's designed to be run before executing tests to ensure a stable test environment.
 */

import http from 'http';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'http://localhost:5001';
const HEALTH_ENDPOINT = '/api/health';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const BACKEND_STARTUP_TIMEOUT = 30000; // 30 seconds

/**
 * Check if the backend server is running
 * @returns {Promise<boolean>} - Whether the server is running
 */
async function isBackendRunning() {
  return new Promise((resolve) => {
    const req = http.get(`${API_URL}${HEALTH_ENDPOINT}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Server is running if we get a 200 response
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', () => {
      // Server is not running if we get an error
      resolve(false);
    });
    
    // Set a timeout to avoid hanging
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Start the backend server
 * @returns {Promise<boolean>} - Whether the server was started successfully
 */
async function startBackendServer() {
  console.log('Starting backend server...');
  
  // Path to the backend directory
  const backendDir = path.join(__dirname, '..', '..', 'doof-backend');
  
  // Check if the backend directory exists
  if (!fs.existsSync(backendDir)) {
    console.error(`Backend directory not found: ${backendDir}`);
    return false;
  }
  
  // Start the backend server
  const serverProcess = spawn('npm', ['start'], {
    cwd: backendDir,
    stdio: 'pipe', // Capture output
    detached: true, // Run in background
    shell: true
  });
  
  // Log server output
  serverProcess.stdout.on('data', (data) => {
    console.log(`Backend server: ${data.toString().trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Backend server error: ${data.toString().trim()}`);
  });
  
  // Unref the process to allow the parent process to exit
  serverProcess.unref();
  
  // Wait for the server to start
  const startTime = Date.now();
  while (Date.now() - startTime < BACKEND_STARTUP_TIMEOUT) {
    // Check if the server is running
    const running = await isBackendRunning();
    if (running) {
      console.log('Backend server started successfully');
      return true;
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.error('Backend server failed to start within the timeout period');
  return false;
}

/**
 * Ensure the backend server is running
 * @returns {Promise<boolean>} - Whether the server is running
 */
export async function ensureBackendRunning() {
  console.log('Checking if backend server is running...');
  
  // Try to connect to the backend server
  for (let i = 0; i < MAX_RETRIES; i++) {
    const running = await isBackendRunning();
    if (running) {
      console.log('Backend server is already running');
      return true;
    }
    
    console.log(`Backend server not running (attempt ${i + 1}/${MAX_RETRIES})`);
    
    if (i < MAX_RETRIES - 1) {
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  // If we get here, the server is not running after all retries
  // Try to start the server
  return startBackendServer();
}

// If this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureBackendRunning()
    .then(running => {
      if (running) {
        console.log('Backend server is ready for testing');
        process.exit(0);
      } else {
        console.error('Failed to ensure backend server is running');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Error ensuring backend server is running:', error);
      process.exit(1);
    });
}

export default ensureBackendRunning;
