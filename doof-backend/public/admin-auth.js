/**
 * Admin Authentication Script
 * 
 * This script configures all API requests to include the proper admin authentication headers.
 * Run this in the browser console to enable admin access.
 */
(function enableAdminAccess() {
  // Store admin credentials in localStorage
  localStorage.setItem('admin_api_key', 'doof-admin-secret-key-dev');
  localStorage.setItem('admin_access_enabled', 'true');
  localStorage.setItem('force_online', 'true');
  
  // Patch XMLHttpRequest to add admin headers
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    const result = originalOpen.apply(this, arguments);
    
    // Add admin headers for admin routes
    if (arguments[1] && arguments[1].includes('/admin')) {
      this.setRequestHeader('X-Admin-API-Key', 'doof-admin-secret-key-dev');
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
      options.headers['X-Admin-API-Key'] = 'doof-admin-secret-key-dev';
      options.headers['X-Admin-Access'] = 'true';
      options.headers['Authorization'] = 'Bearer admin-auth-token';
    }
    
    return originalFetch.call(this, url, options);
  };

  console.log('✅ Admin access enabled with API key: doof-admin-secret-key-dev');
  console.log('🔄 Please refresh the page to apply changes');
  
  return true;
})();
