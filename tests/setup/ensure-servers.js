/**
 * Ensure Servers Script
 * 
 * This script ensures that both the backend and frontend servers are running
 * before executing tests. It will start the servers if they are not already running.
 */

import { spawn, exec } from 'child_process';
import { join } from 'path';
import axios from 'axios';

// Configuration
const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5173';
const BACKEND_PORT = 5001;
const FRONTEND_PORT = 5173;
const SERVER_STARTUP_TIMEOUT = 30000; // 30 seconds
const SERVER_STARTUP_DELAY = 2000; // 2 seconds
const MAX_CHECK_ATTEMPTS = 10;
const CHECK_INTERVAL = 3000; // 3 seconds

// Global state
let backendStarted = false;
let frontendStarted = false;

/**
 * Main function to ensure both servers are running
 */
async function main() {
  console.log('=== Setting up test environment ===');
  
  // Check if servers are already running
  const backendRunning = await isServerRunning(BACKEND_URL + '/api/health');
  const frontendRunning = await isServerRunning(FRONTEND_URL + '/');
  
  console.log(`Backend server running: ${backendRunning}`);
  console.log(`Frontend server running: ${frontendRunning}`);
  
  // If both servers are running, we're done
  if (backendRunning && frontendRunning) {
    console.log('Both servers are already running');
    return true;
  }
  
  // Kill any existing server processes to avoid port conflicts
  killExistingServers();
  
  // Start servers if needed
  let backendSuccess = backendRunning;
  let frontendSuccess = frontendRunning;
  
  if (!backendRunning) {
    const backendProcess = await startBackendServer();
    if (backendProcess) {
      backendSuccess = await waitForServerToBeAvailable(BACKEND_URL + '/api/health');
    }
  }
  
  if (!frontendRunning) {
    const frontendProcess = await startFrontendServer();
    if (frontendProcess) {
      console.log('Waiting 5 seconds for Frontend server to initialize...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      frontendSuccess = await waitForServerToBeAvailable(FRONTEND_URL + '/');
    }
  }
  
  // Final connectivity check
  console.log('=== Performing final connectivity check ===');
  const finalBackendRunning = await isServerRunning(BACKEND_URL + '/api/health');
  const finalFrontendRunning = await isServerRunning(FRONTEND_URL);
  
  if (finalBackendRunning && finalFrontendRunning) {
    console.log('Both servers are running and ready for tests');
    return true;
  } else {
    console.log('Final connectivity check failed');
    if (!finalBackendRunning) console.log('Backend server is not running');
    if (!finalFrontendRunning) console.log('Frontend server is not running');
    return false;
  }
}

/**
 * Check if a server is running by making a request to it
 */
async function isServerRunning(url) {
  try {
    console.log(`Checking connection to ${url}...`);
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ Successfully connected to ${url}`);
    console.log(`   Status: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to connect to ${url}`);
    if (error.code) {
      console.log(`   Error code: ${error.code}`);
    }
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.statusText}`);
    } else {
      console.log('   No response received from server');
    }
    return false;
  }
}

/**
 * Wait for a server to become available
 */
async function waitForServerToBeAvailable(url) {
  for (let attempt = 1; attempt <= MAX_CHECK_ATTEMPTS; attempt++) {
    console.log(`Checking if ${url} is available (attempt ${attempt}/${MAX_CHECK_ATTEMPTS})...`);
    const available = await isServerRunning(url);
    if (available) {
      return true;
    }
    
    console.log(`Waiting ${CHECK_INTERVAL/1000} seconds before next attempt...`);
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
  
  console.log(`❌ Failed to connect to ${url} after ${MAX_CHECK_ATTEMPTS} attempts`);
  return false;
}

/**
 * Kill any existing server processes
 */
function killExistingServers() {
  console.log('Killing any existing server processes...');
  
  try {
    // Kill process on backend port
    exec(`lsof -ti:${BACKEND_PORT} | xargs kill -9`, (error, stdout, stderr) => {
      if (error && !error.message.includes('No such process')) {
        console.log(`Failed to kill process on port ${BACKEND_PORT}: ${error.message}`);
      }
    });
    
    // Kill process on frontend port
    exec(`lsof -ti:${FRONTEND_PORT} | xargs kill -9`, (error, stdout, stderr) => {
      if (error && !error.message.includes('No such process')) {
        console.log(`Failed to kill process on port ${FRONTEND_PORT}: ${error.message}`);
      }
    });
  } catch (error) {
    console.error(`Error killing existing servers: ${error.message}`);
  }
}

/**
 * Start the backend server
 */
async function startBackendServer() {
  console.log('Starting backend server...');
  const backendPath = join(process.cwd(), 'doof-backend');
  
  try {
    const backendProcess = spawn('node', ['server.js'], {
      cwd: backendPath,
      stdio: 'pipe',
      env: { ...process.env, PORT: BACKEND_PORT }
    });
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      console.log(`Backend server: ${output}`);
      
      if (output.includes('Server is running') || output.includes('listening on port')) {
        console.log('Backend server is ready to accept connections');
        backendStarted = true;
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend server error: ${data.toString().trim()}`);
    });
    
    backendProcess.on('error', (error) => {
      console.error(`Failed to start backend server: ${error.message}`);
    });
    
    return backendProcess;
  } catch (error) {
    console.error(`Exception starting backend server: ${error.message}`);
    return null;
  }
}

/**
 * Start the frontend server
 */
async function startFrontendServer() {
  console.log('Starting frontend server...');
  const frontendPath = join(process.cwd());
  
  try {
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendPath,
      stdio: 'pipe'
    });
    
    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      console.log(`Frontend server: ${output}`);
      
      if (output.includes('ready in') || output.includes('Local:')) {
        console.log('Frontend server is ready to accept connections');
        frontendStarted = true;
      }
    });
    
    frontendProcess.stderr.on('data', (data) => {
      console.error(`Frontend server error: ${data.toString().trim()}`);
    });
    
    frontendProcess.on('error', (error) => {
      console.error(`Failed to start frontend server: ${error.message}`);
    });
    
    return frontendProcess;
  } catch (error) {
    console.error(`Exception starting frontend server: ${error.message}`);
    return null;
  }
}

// Run the main function
main().then(success => {
  if (!success) {
    console.error('Failed to ensure servers are running');
    process.exit(1);
  }
}).catch(error => {
  console.error(`Error ensuring servers are running: ${error.message}`);
  process.exit(1);
});
