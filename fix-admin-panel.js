// fix-admin-panel.js
// Script to fix admin panel authentication issues

// Set the admin API key - this should match your backend .env ADMIN_API_KEY
const ADMIN_API_KEY = 'doof-admin-secret-key-dev';

// Fix admin panel authentication
(function fixAdminPanel() {
  console.log('Fixing admin panel authentication...');
  
  // 1. First, turn off offline mode
  localStorage.removeItem('offline_mode');
  localStorage.removeItem('bypass_auth_check');
  localStorage.setItem('force_online', 'true');
  
  // 2. Set up admin authentication
  localStorage.setItem('admin_api_key', ADMIN_API_KEY);
  localStorage.setItem('admin_access_enabled', 'true');
  localStorage.setItem('superuser_override', 'true');
  
  // 3. Patch the apiClient to add admin headers to requests
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener('readystatechange', function() {
      if (this.readyState === 1) {
        if (this.__sentry_xhr__ && this.__sentry_xhr__.url && 
            this.__sentry_xhr__.url.includes('/admin')) {
          this.setRequestHeader('X-Admin-API-Key', ADMIN_API_KEY);
          this.setRequestHeader('X-Bypass-Auth', 'true');
          this.setRequestHeader('X-Superuser-Override', 'true');
          this.setRequestHeader('X-Admin-Access', 'true');
          console.log('Added admin headers to request:', this.__sentry_xhr__.url);
        }
      }
    });
    originalXHROpen.apply(this, arguments);
  };
  
  // 4. Patch fetch API as well
  const originalFetch = window.fetch;
  window.fetch = function(resource, options = {}) {
    const url = resource.url || resource;
    if (typeof url === 'string' && url.includes('/admin')) {
      options.headers = options.headers || {};
      options.headers['X-Admin-API-Key'] = ADMIN_API_KEY;
      options.headers['X-Bypass-Auth'] = 'true';
      options.headers['X-Superuser-Override'] = 'true';
      options.headers['X-Admin-Access'] = 'true';
      console.log('Added admin headers to fetch request:', url);
    }
    return originalFetch.call(this, resource, options);
  };
  
  console.log('Admin panel fix applied successfully. Please reload the page.');
})();

// To use this script:
// 1. Open your browser developer console (F12)
// 2. Copy and paste this entire script into the console
// 3. Press Enter to run it
// 4. Reload the page 