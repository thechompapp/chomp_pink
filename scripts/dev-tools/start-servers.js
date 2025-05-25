/* start-servers.js */
// Script to properly manage both frontend and backend servers with port control
import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

// Configuration
const FRONTEND_PORT = 5173;  // Port required by backend CORS config
const BACKEND_PORT = 5001;   // Standard backend port
const BACKEND_DIR = join(process.cwd(), 'doof-backend');

// Utility function to check if port is in use
function isPortInUse(port) {
  try {
    const result = execSync(`lsof -i :${port} -t`, { encoding: 'utf8' });
    return result.trim() !== '';
  } catch (error) {
    return false;
  }
}

// Utility function to kill process on port
function killProcessOnPort(port) {
  try {
    console.log(`🛑 Killing process on port ${port}...`);
    execSync(`kill -9 $(lsof -i :${port} -t)`, { stdio: 'inherit' });
    console.log(`✅ Port ${port} is now available`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to kill process on port ${port}:`, error.message);
    return false;
  }
}

// Verify backend directory exists
if (!existsSync(BACKEND_DIR)) {
  console.error(`❌ Backend directory not found at ${BACKEND_DIR}`);
  process.exit(1);
}

// Step 1: Free required ports if necessary
if (isPortInUse(FRONTEND_PORT)) {
  console.log(`⚠️ Port ${FRONTEND_PORT} is in use`);
  killProcessOnPort(FRONTEND_PORT);
}

if (isPortInUse(BACKEND_PORT)) {
  console.log(`⚠️ Port ${BACKEND_PORT} is in use`);
  killProcessOnPort(BACKEND_PORT);
}

// Step 2: Start backend server
console.log(`🚀 Starting backend server on port ${BACKEND_PORT}...`);
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: BACKEND_DIR,
  stdio: 'inherit',
  shell: true,
  detached: true
});

backendProcess.unref();

// Step 3: Start frontend server
console.log(`🚀 Starting frontend server on port ${FRONTEND_PORT}...`);
try {
  execSync(`npm run dev -- --port ${FRONTEND_PORT} --force`, {
    stdio: 'inherit'
  });
} catch (error) {
  console.error(`❌ Frontend server exited with error:`, error.message);
}

// This script will exit when the frontend server exits
// The backend server will continue running in the background
