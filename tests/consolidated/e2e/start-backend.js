#!/usr/bin/env node

/**
 * Start Backend Server
 * 
 * This script starts the backend server for E2E testing.
 * It ensures the server is running on the correct port and
 * provides detailed logging about the server status.
 */

import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const backendDir = path.join(projectRoot, 'doof-backend');

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
 * Check if a port is in use
 */
function isPortInUse(port) {
  try {
    const result = execSync(`lsof -i :${port} -t`, { encoding: 'utf8' });
    return result.trim() !== '';
  } catch (error) {
    return false;
  }
}

/**
 * Kill a process running on a specific port
 */
function killProcessOnPort(port) {
  try {
    log(`Killing process on port ${port}...`, colors.yellow);
    execSync(`kill -9 $(lsof -i :${port} -t)`, { stdio: 'inherit' });
    log(`Port ${port} is now available`, colors.green);
    return true;
  } catch (error) {
    log(`Failed to kill process on port ${port}: ${error.message}`, colors.red);
    return false;
  }
}

/**
 * Start the backend server
 */
function startBackendServer(port) {
  return new Promise((resolve, reject) => {
    // Check if backend directory exists
    if (!fs.existsSync(backendDir)) {
      log(`Backend directory not found at ${backendDir}`, colors.red);
      reject(new Error('Backend directory not found'));
      return;
    }
    
    // Free the port if it's in use
    if (isPortInUse(port)) {
      log(`Port ${port} is in use`, colors.yellow);
      if (!killProcessOnPort(port)) {
        reject(new Error(`Failed to free port ${port}`));
        return;
      }
    }
    
    // Set environment variables for the backend server
    const env = {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug'
    };
    
    // Start the backend server
    log(`Starting backend server on port ${port}...`, colors.blue);
    const backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendDir,
      stdio: 'inherit',
      shell: true,
      env
    });
    
    // Handle process events
    backendProcess.on('error', (error) => {
      log(`Error starting backend server: ${error.message}`, colors.red);
      reject(error);
    });
    
    // Wait for the server to start
    setTimeout(() => {
      log(`Backend server started on port ${port}`, colors.green);
      resolve(backendProcess);
    }, 5000);
  });
}

/**
 * Main function
 */
async function main() {
  const BACKEND_PORT = 5001;
  
  logSection('Starting Backend Server');
  
  try {
    const backendProcess = await startBackendServer(BACKEND_PORT);
    
    log(`Backend server is running on port ${BACKEND_PORT}`, colors.green);
    log(`API URL: http://localhost:${BACKEND_PORT}/api`, colors.green);
    
    // Keep the script running
    process.on('SIGINT', () => {
      log('Shutting down backend server...', colors.yellow);
      process.exit(0);
    });
  } catch (error) {
    log(`Failed to start backend server: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the main function
main();
