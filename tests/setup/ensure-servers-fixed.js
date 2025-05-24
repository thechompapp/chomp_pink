/**
 * Ensure Servers
 * 
 * This script ensures both frontend and backend servers are running before tests.
 * It provides a more reliable test environment by checking server status and
 * starting servers if needed.
 */

import axios from 'axios';
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';

// Get current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Configuration
const BACKEND_URL = 'http://localhost:5001';
const FRONTEND_URL = 'http://localhost:5173';
const HEALTH_ENDPOINT = '/api/health';
const MAX_RETRIES = 10;
const RETRY_DELAY = 3000; // 3 seconds
const SERVER_STARTUP_TIMEOUT = 60000; // 60 seconds
const SERVER_STARTUP_DELAY = 5000; // 5 seconds to allow server to fully initialize

// Track server processes
let backendProcess = null;
let frontendProcess = null;

/**
 * Check if a server is running at the specified URL with detailed error reporting
 * @param {string} url - The URL to check
 * @param {boolean} verbose - Whether to log detailed information
 * @returns {Promise<boolean>} - Whether the server is running
 */
async function isServerRunning(url, verbose = true) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    if (verbose) {
      console.log(chalk.green(`✅ Successfully connected to ${url}`));
      console.log(chalk.dim(`   Status: ${response.status}`));
    }
    return true;
  } catch (error) {
    if (verbose) {
      console.error(chalk.red(`❌ Failed to connect to ${url}`));
      if (error.code) {
        console.error(chalk.dim(`   Error code: ${error.code}`));
      }
      if (error.response) {
        console.error(chalk.dim(`   Status: ${error.response.status}`));
        console.error(chalk.dim(`   Message: ${error.response.statusText}`));
      } else if (error.request) {
        console.error(chalk.dim('   No response received from server'));
      } else {
        console.error(chalk.dim(`   Error message: ${error.message}`));
      }
    }
    return false;
  }
}

/**
 * Check if the backend server is running
 * @returns {Promise<boolean>} - Whether the server is running
 */
async function isBackendRunning() {
  return isServerRunning(`${BACKEND_URL}${HEALTH_ENDPOINT}`);
}

/**
 * Check if the frontend server is running
 * @returns {Promise<boolean>} - Whether the server is running
 */
async function isFrontendRunning() {
  return isServerRunning(FRONTEND_URL);
}

/**
 * Find process ID by port
 * @param {number} port - The port to check
 * @returns {string|null} - The process ID or null if not found
 */
function findProcessIdByPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`).toString();
      const match = output.match(/\\s+(\\d+)$/m);
      return match ? match[1] : null;
    } else {
      return execSync(`lsof -i :${port} -t`).toString().trim();
    }
  } catch (error) {
    return null; // No process found on this port
  }
}

/**
 * Kill process by port with better error handling
 * @param {number} port - The port to kill
 * @returns {Promise<boolean>} - Whether the process was killed
 */
async function killProcessOnPort(port) {
  const pid = findProcessIdByPort(port);
  if (!pid) {
    console.log(chalk.yellow(`No process found running on port ${port}`));
    return false;
  }
  
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /PID ${pid}`);
    } else {
      execSync(`kill -9 ${pid}`);
    }
    console.log(chalk.yellow(`Killed process ${pid} running on port ${port}`));
    return true;
  } catch (error) {
    console.error(chalk.red(`Failed to kill process on port ${port}: ${error.message}`));
    return false;
  }
}

/**
 * Kill any existing server processes
 */
async function killExistingServers() {
  console.log(chalk.blue('Killing any existing server processes...'));
  
  // Kill backend server process
  await killProcessOnPort(5001);
  
  // Kill frontend server process
  await killProcessOnPort(5173);
}

/**
 * Start backend server with better error handling
 * @returns {Promise<boolean>} - Whether the server was started successfully
 */
async function startBackendServer() {
  return new Promise((resolve) => {
    console.log(chalk.blue('Starting backend server...'));
    const backendPath = path.join(projectRoot, 'doof-backend');
    
    // Check if the backend directory exists
    if (!fs.existsSync(backendPath)) {
      console.error(chalk.red(`Backend directory not found at ${backendPath}`));
      resolve(false);
      return;
    }
    
    try {
      backendProcess = spawn('npm', ['start'], {
        cwd: backendPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
        shell: true
      });

      let backendStarted = false;
      let errorOutput = '';
      
      backendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(chalk.dim('Backend server:'), output);
        
        // Check if the server has started successfully
        if (output.includes('Backend server running on port') || 
            output.includes('Connected to doof_db')) {
          backendStarted = true;
          console.log(chalk.green('Backend server started successfully'));
          resolve(true);
        }
      });

      backendProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        console.error(chalk.red('Backend server error:'), output);
        errorOutput += output;
      });

      backendProcess.on('error', (error) => {
        console.error(chalk.red(`Failed to start backend server: ${error.message}`));
        resolve(false);
      });

      // Set a timeout to avoid hanging
      setTimeout(() => {
        if (!backendStarted) {
          console.error(chalk.red('Backend server startup timed out'));
          resolve(false);
        }
      }, SERVER_STARTUP_TIMEOUT);
    } catch (error) {
      console.error(chalk.red(`Exception starting backend server: ${error.message}`));
      resolve(false);
    }
  });
}

/**
 * Start frontend server with better error handling
 * @returns {Promise<boolean>} - Whether the server was started successfully
 */
async function startFrontendServer() {
  return new Promise((resolve) => {
    console.log(chalk.blue('Starting frontend server...'));
    
    try {
      frontendProcess = spawn('npm', ['run', 'dev'], {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
        shell: true
      });

      let frontendStarted = false;
      let errorOutput = '';
      
      frontendProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        console.log(chalk.dim('Frontend server:'), output);
        
        // Check for the "ready in" message which indicates the server is ready
        if (output.includes('ready in') || output.includes('Local:')) {
          frontendStarted = true;
          console.log(chalk.green('Frontend server is ready to accept connections'));
          resolve(true);
        }
      });

      frontendProcess.stderr.on('data', (data) => {
        const output = data.toString().trim();
        console.error(chalk.red('Frontend server error:'), output);
        errorOutput += output;
        
        // Check if the server failed to start due to port already in use
        if (output.includes('EADDRINUSE')) {
          console.log(chalk.yellow('Frontend server port already in use. Attempting to use existing server.'));
          resolve(true);
        }
      });

      frontendProcess.on('error', (error) => {
        console.error(chalk.red(`Failed to start frontend server: ${error.message}`));
        resolve(false);
      });

      // Set a timeout to avoid hanging
      setTimeout(() => {
        if (!frontendStarted) {
          console.error(chalk.red('Frontend server startup timed out'));
          resolve(false);
        }
      }, SERVER_STARTUP_TIMEOUT);
    } catch (error) {
      console.error(chalk.red(`Exception starting frontend server: ${error.message}`));
      resolve(false);
    }
  });
}

/**
 * Wait for server to be available with improved logging
 * @param {Function} checkFunction - Function to check if server is running
 * @param {string} serverType - Type of server (Backend or Frontend)
 * @returns {Promise<boolean>} - Whether the server is available
 */
async function waitForServer(checkFunction, serverType) {
  // First wait a bit to let the server initialize
  console.log(chalk.blue(`Waiting ${SERVER_STARTUP_DELAY/1000} seconds for ${serverType} server to initialize...`));
  await new Promise(resolve => setTimeout(resolve, SERVER_STARTUP_DELAY));
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    console.log(chalk.blue(`Checking if ${serverType} server is available (attempt ${i + 1}/${MAX_RETRIES})...`));
    if (await checkFunction()) {
      console.log(chalk.green(`✅ ${serverType} server is available`));
      return true;
    }
    
    if (i < MAX_RETRIES - 1) {
      console.log(chalk.blue(`Waiting ${RETRY_DELAY/1000} seconds before next attempt...`));
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  console.error(chalk.red(`❌ Failed to connect to ${serverType} server after ${MAX_RETRIES} attempts`));
  return false;
}

/**
 * Ensure both servers are running
 * @returns {Promise<boolean>} - Whether both servers are running
 */
export async function ensureServersRunning() {
  console.log(chalk.blue('=== Setting up test environment ==='));
  
  // Check if servers are already running
  let backendRunning = await isBackendRunning();
  let frontendRunning = await isFrontendRunning();
  
  console.log(chalk.blue(`Backend server running: ${backendRunning}`));
  console.log(chalk.blue(`Frontend server running: ${frontendRunning}`));
  
  // If either server is not running, kill any existing server processes
  if (!backendRunning || !frontendRunning) {
    await killExistingServers();
  }
  
  // Start backend server if not running
  if (!backendRunning) {
    backendRunning = await startBackendServer();
    
    // Wait for the server to be fully available
    if (backendRunning) {
      backendRunning = await waitForServer(isBackendRunning, 'Backend');
    }
  }
  
  // Start frontend server if not running
  if (!frontendRunning) {
    frontendRunning = await startFrontendServer();
    
    // Wait for the server to be fully available
    if (frontendRunning) {
      frontendRunning = await waitForServer(isFrontendRunning, 'Frontend');
    }
  }
  
  // Final connectivity check
  console.log(chalk.blue('=== Performing final connectivity check ==='));
  const finalBackendCheck = await isBackendRunning();
  const finalFrontendCheck = await isFrontendRunning();
  
  if (!finalBackendCheck || !finalFrontendCheck) {
    console.error(chalk.red('Final connectivity check failed'));
    return false;
  }
  
  console.log(chalk.green('✅ All servers are running and ready for tests'));
  return finalBackendCheck && finalFrontendCheck;
}

/**
 * Cleanup function to kill server processes
 */
export function cleanupServers() {
  console.log(chalk.blue('Cleaning up server processes...'));
  
  if (backendProcess) {
    try {
      process.kill(-backendProcess.pid);
      console.log(chalk.yellow('Terminated backend server process'));
    } catch (error) {
      console.error(chalk.red(`Error terminating backend process: ${error.message}`));
    }
  }
  
  if (frontendProcess) {
    try {
      process.kill(-frontendProcess.pid);
      console.log(chalk.yellow('Terminated frontend server process'));
    } catch (error) {
      console.error(chalk.red(`Error terminating frontend process: ${error.message}`));
    }
  }
}

// If this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureServersRunning()
    .then(running => {
      if (running) {
        console.log(chalk.green('Servers are running successfully!'));
        process.exit(0);
      } else {
        console.error(chalk.red('Failed to ensure servers are running. Cannot run tests.'));
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red(`Error ensuring servers are running: ${error.message}`));
      process.exit(1);
    });
}
