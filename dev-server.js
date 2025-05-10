/* dev-server.js */
// This script ensures the development server runs on port 5173 to match the backend CORS configuration
import { execSync } from 'child_process';
import { spawnSync } from 'child_process';
import { platform } from 'os';

// Check which OS we're running on for appropriate commands
const isWindows = platform() === 'win32';

console.log('🔍 Checking if port 5173 is already in use...');

try {
  // Check for processes using port 5173
  const checkPortCmd = isWindows 
    ? `netstat -ano | findstr :5173` 
    : `lsof -i :5173`;
  
  const portCheck = spawnSync(isWindows ? 'cmd' : 'sh', 
    [isWindows ? '/c' : '-c', checkPortCmd], 
    { encoding: 'utf8' });
  
  if (portCheck.stdout && portCheck.stdout.trim()) {
    console.log('⚠️ Port 5173 is already in use. Attempting to free it...');
    
    // Kill process using port 5173
    if (isWindows) {
      // Extract PID and kill (Windows)
      const pidRegex = /(\d+)\s*$/m;
      const match = pidRegex.exec(portCheck.stdout);
      if (match && match[1]) {
        execSync(`taskkill /F /PID ${match[1]}`, { stdio: 'inherit' });
      }
    } else {
      // Extract PID and kill (Unix)
      const lines = portCheck.stdout.trim().split('\n');
      for (const line of lines) {
        if (line.includes('LISTEN')) {
          const parts = line.trim().split(/\s+/);
          // PID is typically in index 1 for lsof output
          const pid = parts[1];
          console.log(`🛑 Killing process with PID ${pid} on port 5173`);
          execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
        }
      }
    }
    
    console.log('✅ Port 5173 has been freed');
  } else {
    console.log('✅ Port 5173 is available');
  }
  
  // Now start the server on port 5173
  console.log('🚀 Starting development server on port 5173...');
  execSync('npm run dev -- --port 5173 --force', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start development server:', error);
  console.log('⚠️ Attempting to start on any available port as fallback...');
  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (fallbackError) {
    console.error('❌ Failed to start server even on fallback port:', fallbackError);
    process.exit(1);
  }
}
