/**
 * Admin Browser Fix Script
 * 
 * This script adds the proper admin authentication headers to all admin API requests.
 * Copy and paste this entire script into your browser's developer console when 
 * on the admin page to enable admin access.
 */
(function enableAdminAccess() {
  // Define admin credentials
  const ADMIN_API_KEY = 'doof-admin-secret-key-dev'; // This should match your backend .env file
  
  // Store admin credentials in localStorage for persistence
  localStorage.setItem('admin_api_key', ADMIN_API_KEY);
  localStorage.setItem('admin_access_enabled', 'true');
  localStorage.setItem('force_online', 'true');
  
  // Clear any offline mode flags
  localStorage.removeItem('offline_mode');
  localStorage.removeItem('bypass_auth_check');
  
  // Patch XMLHttpRequest to add admin headers
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    const result = originalOpen.apply(this, arguments);
    
    // Force online mode for all requests
    this.setRequestHeader('X-Force-Online', 'true');
    
    // Add admin headers for admin routes
    if (arguments[1] && arguments[1].includes('/admin')) {
      this.setRequestHeader('X-Admin-API-Key', ADMIN_API_KEY);
      this.setRequestHeader('X-Admin-Access', 'true');
      this.setRequestHeader('Authorization', 'Bearer admin-auth-token');
    }
    
    return result;
  };

  // Also patch fetch API for admin requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    if (url && url.toString().includes('/admin')) {
      options = options || {};
      if (!options.headers) {
        options.headers = {};
      }
      
      // Add admin headers
      options.headers['X-Admin-API-Key'] = ADMIN_API_KEY;
      options.headers['X-Admin-Access'] = 'true';
      options.headers['Authorization'] = 'Bearer admin-auth-token';
    }
    
    return originalFetch.call(this, url, options);
  };

  // Create a visual confirmation element
  const confirmationDiv = document.createElement('div');
  confirmationDiv.style.position = 'fixed';
  confirmationDiv.style.top = '20px';
  confirmationDiv.style.right = '20px';
  confirmationDiv.style.backgroundColor = '#4CAF50';
  confirmationDiv.style.color = 'white';
  confirmationDiv.style.padding = '15px';
  confirmationDiv.style.borderRadius = '5px';
  confirmationDiv.style.zIndex = '10000';
  confirmationDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  confirmationDiv.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <div style="font-size:24px;">✅</div>
      <div>
        <div style="font-weight:bold; margin-bottom:5px;">Admin Access Enabled</div>
        <div style="font-size:12px;">Please refresh the page to apply changes</div>
      </div>
    </div>
  `;
  document.body.appendChild(confirmationDiv);
  
  // Automatically remove the confirmation after 5 seconds
  setTimeout(() => {
    document.body.removeChild(confirmationDiv);
  }, 5000);
  
  console.log('✅ Admin access enabled with API key:', ADMIN_API_KEY);
  console.log('🔄 Please refresh the page to apply all changes');
  
  return true;
})(); 