/**
 * Force Online Mode and Admin Authentication Script
 * 
 * This script disables offline mode, enables real API requests, and configures proper
 * admin authentication headers for admin API endpoints.
 * Run this in the browser console to resolve API connectivity issues.
 */
(function forceOnlineMode() {
  // Define admin credentials - should match the server's .env file
  const ADMIN_API_KEY = 'doof-admin-secret-key-dev';
  
  // Clear all offline mode flags
  localStorage.removeItem('offline_mode');
  localStorage.removeItem('bypass_auth_check');
  
  // Set force online flag and admin credentials
  localStorage.setItem('force_online', 'true');
  localStorage.setItem('admin_api_key', ADMIN_API_KEY);
  localStorage.setItem('admin_access_enabled', 'true');
  
  // Clear any API caches that might be holding stale data
  const cacheKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('cache') || key.includes('api') || key.includes('offline')) {
      cacheKeys.push(key);
    }
  }
  
  // Remove any found cache keys
  cacheKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`Removed cache key: ${key}`);
    } catch (err) {
      console.error(`Error removing key ${key}:`, err);
    }
  });
  
  // Patch XMLHttpRequest to ensure appropriate headers are sent
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    const result = originalOpen.apply(this, arguments);
    
    // Add headers to ensure requests aren't cancelled due to offline mode
    this.setRequestHeader('X-Force-Online', 'true');
    
    // Add admin API key for admin routes
    if (arguments[1] && arguments[1].includes('/admin')) {
      this.setRequestHeader('X-Admin-API-Key', ADMIN_API_KEY);
      this.setRequestHeader('X-Admin-Access', 'true');
      this.setRequestHeader('Authorization', 'Bearer admin-auth-token');
    }
    
    // Add special header for places API requests
    if (arguments[1] && arguments[1].includes('/places')) {
      this.setRequestHeader('X-Places-Api-Request', 'true');
      this.setRequestHeader('X-Bypass-Auth', 'true');
    }
    
    return result;
  };

  // Patch fetch API for admin requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    options = options || {};
    
    if (!options.headers) {
      options.headers = {};
    }
    
    // Add X-Force-Online header to all requests
    options.headers['X-Force-Online'] = 'true';
    
    // Add admin headers for admin routes
    if (url && url.toString().includes('/admin')) {
      options.headers['X-Admin-API-Key'] = ADMIN_API_KEY;
      options.headers['X-Admin-Access'] = 'true';
      options.headers['Authorization'] = 'Bearer admin-auth-token';
    }
    
    return originalFetch.call(this, url, options);
  };

  // Create a visual confirmation
  console.log('✅ Force online mode enabled successfully!');
  console.log('✅ Admin authentication configured!');
  console.log('🔄 Please refresh the page to apply changes');
  
  // Create visual notification
  const notificationDiv = document.createElement('div');
  notificationDiv.style.position = 'fixed';
  notificationDiv.style.top = '20px';
  notificationDiv.style.right = '20px';
  notificationDiv.style.backgroundColor = '#4CAF50';
  notificationDiv.style.color = 'white';
  notificationDiv.style.padding = '15px';
  notificationDiv.style.borderRadius = '5px';
  notificationDiv.style.zIndex = '10000';
  notificationDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  notificationDiv.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <div style="font-size:24px;">✅</div>
      <div>
        <div style="font-weight:bold; margin-bottom:5px;">Online Mode + Admin Access Enabled</div>
        <div style="font-size:12px;">Please refresh the page to apply changes</div>
      </div>
    </div>
  `;
  document.body.appendChild(notificationDiv);
  
  // Remove notification after 5 seconds
  setTimeout(() => {
    document.body.removeChild(notificationDiv);
  }, 5000);
  
  // For future API requests
  if (window.networkUtils && typeof window.networkUtils.forceOnlineMode === 'function') {
    window.networkUtils.forceOnlineMode();
    console.log('✅ Network utilities forceOnlineMode() method called');
  }
  
  return true;
})(); 