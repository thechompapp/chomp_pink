/**
 * Enable Admin Access Script
 * Run this in the browser console to fix admin panel access issues
 */
(function enableAdminAccess() {
  // Define the admin API key - this must match the one in the backend .env file
  const ADMIN_API_KEY = 'doof-admin-secret-key-dev';
  
  // Clear offline mode flags
  localStorage.removeItem('offline_mode');
  localStorage.removeItem('bypass_auth_check');
  localStorage.setItem('force_online', 'true');
  
  // Set admin authentication flags
  localStorage.setItem('admin_api_key', ADMIN_API_KEY);
  localStorage.setItem('admin_access_enabled', 'true');
  localStorage.setItem('superuser_override', 'true');
  
  // Set auth overrides for development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    localStorage.setItem('dev_mode', 'true');
    localStorage.setItem('dev_auth_bypass', 'true');
  }
  
  // Patch XHR to add admin headers
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    const result = originalOpen.apply(this, arguments);
    if (arguments[1] && arguments[1].includes('/admin')) {
      this.setRequestHeader('X-Admin-API-Key', ADMIN_API_KEY);
      this.setRequestHeader('X-Admin-Access', 'true');
      this.setRequestHeader('X-Superuser-Override', 'true');
    }
    return result;
  };
  
  // Add visual confirmation
  console.log('✅ Admin access enabled!');
  console.log('📋 Admin API Key:', ADMIN_API_KEY);
  console.log('🔄 Please refresh the page to apply changes');
  
  // Return true to indicate success
  return true;
})(); 