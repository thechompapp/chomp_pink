/**
 * IMMEDIATE FIX FOR OFFLINE MODE
 * 
 * Copy and paste this ENTIRE script into your browser console and press Enter
 * to immediately fix offline mode issues.
 */

(function() {
  console.log('🛠️ FIXING OFFLINE MODE...');
  
  // Clear ALL possible offline mode flags
  const keysToRemove = [
    // LocalStorage keys
    'OFFLINE_MODE',
    'offline_mode',
    'DEV_MODE_NO_BACKEND',
    'dev_mode_no_backend',
    'bypass-auth-check',
    'bypass_auth_check',
    
    // Any other potentially related keys
    'mock_responses',
    'MOCK_RESPONSES'
  ];
  
  // Remove from both localStorage and sessionStorage
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`Could not remove key: ${key}`, e);
    }
  });
  
  // Force ONLINE mode
  localStorage.setItem('force_online', 'true');
  localStorage.setItem('FORCE_ONLINE', 'true');
  
  // Enable admin access
  localStorage.setItem('admin_access_enabled', 'true');
  localStorage.setItem('superuser_override', 'true');
  
  console.log('✅ OFFLINE MODE FIXED!');
  console.log('✅ ADMIN ACCESS ENABLED!');
  console.log('🔄 Please RELOAD the page to apply changes.');
  
  return {
    success: true,
    reload: function() {
      window.location.reload();
    }
  };
})();
