/**
 * Admin Access Fix Script
 * 
 * This script modifies the request headers for admin API endpoints to include the correct
 * admin API key from the server's .env file. Run this on the backend server to enable 
 * proper admin authentication.
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
if (!ADMIN_API_KEY) {
  console.error('ADMIN_API_KEY is not defined in the .env file');
  process.exit(1);
}

// Create the admin-auth.js file for the frontend to use
const adminAuthScript = `/**
 * Admin Authentication Script
 * 
 * This script configures all API requests to include the proper admin authentication headers.
 * Run this in the browser console to enable admin access.
 */
(function enableAdminAccess() {
  // Store admin credentials in localStorage
  localStorage.setItem('admin_api_key', '${ADMIN_API_KEY}');
  localStorage.setItem('admin_access_enabled', 'true');
  localStorage.setItem('force_online', 'true');
  
  // Patch XMLHttpRequest to add admin headers
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    const result = originalOpen.apply(this, arguments);
    
    // Add admin headers for admin routes
    if (arguments[1] && arguments[1].includes('/admin')) {
      this.setRequestHeader('X-Admin-API-Key', '${ADMIN_API_KEY}');
      this.setRequestHeader('X-Admin-Access', 'true');
      this.setRequestHeader('Authorization', 'Bearer admin-auth-token');
    }
    
    return result;
  };

  // Also patch fetch API for admin requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    if (url && url.includes('/admin')) {
      if (!options.headers) {
        options.headers = {};
      }
      
      // Add admin headers
      options.headers['X-Admin-API-Key'] = '${ADMIN_API_KEY}';
      options.headers['X-Admin-Access'] = 'true';
      options.headers['Authorization'] = 'Bearer admin-auth-token';
    }
    
    return originalFetch.call(this, url, options);
  };

  console.log('✅ Admin access enabled with API key: ${ADMIN_API_KEY}');
  console.log('🔄 Please refresh the page to apply changes');
  
  return true;
})();
`;

// Write the script to a file in the public directory for easy access
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'admin-auth.js'), adminAuthScript);
console.log('✅ Admin authentication script created successfully at public/admin-auth.js');
console.log('🔧 To enable admin access, run this script in your browser console.');

// Create instructions for frontend developers
const instructions = `
# Admin Panel Access Instructions

To enable admin access in the frontend application:

1. Make sure the backend server is running
2. Open your browser developer console (F12 or Ctrl+Shift+I)
3. Run the following code in the console:

\`\`\`javascript
fetch('/admin-auth.js')
  .then(response => response.text())
  .then(script => {
    eval(script);
  })
  .catch(error => {
    console.error('Error loading admin authentication script:', error);
  });
\`\`\`

This will load and execute the admin authentication script, which will:
- Add the correct admin API key to all admin requests
- Enable online mode in the application
- Configure proper authentication headers

After running the script, refresh the page to see the admin panel with data.
`;

fs.writeFileSync(path.join(publicDir, 'ADMIN_ACCESS.md'), instructions);
console.log('📝 Admin access instructions created at public/ADMIN_ACCESS.md'); 