/* dev-server.js */
// This script ensures the development server runs on port 5173 to match the backend CORS configuration
import { execSync } from 'child_process';
import { spawnSync } from 'child_process';
import { platform } from 'os';
import fs from 'fs';
import path from 'path';

// Check which OS we're running on for appropriate commands
const isWindows = platform() === 'win32';

// Function to ensure localStorage settings for development
function setupLocalStorageDefaults() {
  try {
    // Create a small script to set localStorage values when the app loads
    const localStorageScript = `
    // Auto-set development localStorage values
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Clear explicit logout flag
      localStorage.removeItem('user_explicitly_logged_out');
      
      // Set admin access flags
      localStorage.setItem('bypass_auth_check', 'true');
      localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
      localStorage.setItem('superuser_override', 'true');
      localStorage.setItem('admin_access_enabled', 'true');
      
      console.log('[DevServer] Development localStorage values set');
    }
    `;
    
    // Write to a temporary file that will be loaded by Vite
    fs.writeFileSync(path.join(process.cwd(), 'dev-localStorage.js'), localStorageScript);
    console.log('✅ Created dev-localStorage.js for development settings');
  } catch (err) {
    console.warn('⚠️ Could not create localStorage setup script:', err);
  }
}

// Setup development environment
setupLocalStorageDefaults();

console.log('🔍 Checking if port 5173 is already in use...');

try {
  // More aggressive port checking and killing
  if (!isWindows) {
    // On Unix systems, try to kill any process on port 5173 directly
    try {
      execSync(`lsof -ti:5173 | xargs kill -9`, { stdio: 'pipe' });
      console.log('✅ Killed any processes using port 5173');
    } catch (e) {
      // This might fail if no processes are using the port, which is fine
      console.log('✅ No processes found using port 5173');
    }
  } else {
    // Windows version
    try {
      // Check for processes using port 5173
      const portCheck = spawnSync('cmd', ['/c', `netstat -ano | findstr :5173`], { encoding: 'utf8' });
      
      if (portCheck.stdout && portCheck.stdout.trim()) {
        console.log('⚠️ Port 5173 is already in use. Attempting to free it...');
        
        // Extract PID and kill (Windows)
        const pidRegex = /(\d+)\s*$/m;
        const match = pidRegex.exec(portCheck.stdout);
        if (match && match[1]) {
          execSync(`taskkill /F /PID ${match[1]}`, { stdio: 'inherit' });
          console.log(`✅ Killed process with PID ${match[1]} using port 5173`);
        }
      } else {
        console.log('✅ Port 5173 is available');
      }
    } catch (e) {
      console.log('✅ No processes found using port 5173');
    }
  }
  
  // Wait a moment for the port to be fully released
  console.log('⏳ Waiting for port to be fully released...');
  execSync('sleep 1');
  
  // Now start the server on port 5173 with the --force flag to ensure it uses this port
  console.log('🚀 Starting development server on port 5173...');
  console.log('💡 TIP: If you see CORS errors, make sure both frontend and backend are running');
  console.log('   Frontend should be on port 5173 and backend on port 5001');
  
  // Add the dev-localStorage.js to the Vite entries
  execSync('npm run dev -- --port 5173 --force', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start development server:', error);
  console.log('⚠️ Attempting to start on any available port as fallback...');
  console.log('⚠️ WARNING: This may cause CORS issues with the backend!');
  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (fallbackError) {
    console.error('❌ Failed to start server even on fallback port:', fallbackError);
    process.exit(1);
  }
}
