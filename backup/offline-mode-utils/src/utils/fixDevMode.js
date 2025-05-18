/**
 * Fix Development Mode Script
 * 
 * This script can be loaded in the browser console to immediately fix
 * offline mode and admin access issues in development.
 * 
 * Usage:
 * 1. Open browser console (F12 or Cmd+Option+I)
 * 2. Copy and paste this entire file into the console
 * 3. Press Enter to execute
 */

(function() {
  console.info('🛠️ Doof Development Mode Fixer 🛠️');
  console.info('Fixing offline mode and admin access issues...');
  
  // Fix offline mode
  function fixOfflineMode() {
    try {
      // Remove all offline mode flags from localStorage
      localStorage.removeItem('OFFLINE_MODE');
      localStorage.removeItem('offline_mode');
      localStorage.removeItem('bypass-auth-check');
      localStorage.removeItem('bypass_auth_check');
      
      // Remove all offline mode flags from sessionStorage
      sessionStorage.removeItem('DEV_MODE_NO_BACKEND');
      sessionStorage.removeItem('dev_mode_no_backend');
      sessionStorage.removeItem('offline_mode');
      
      // Force online mode
      localStorage.setItem('force_online', 'true');
      localStorage.setItem('FORCE_ONLINE', 'true');
      
      console.info('✅ Offline mode disabled successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error disabling offline mode:', error);
      return false;
    }
  }
  
  // Fix admin access
  function fixAdminAccess() {
    try {
      // Set admin access flags
      localStorage.setItem('admin_access_enabled', 'true');
      localStorage.setItem('superuser_override', 'true');
      
      // Create a stronger token with admin privileges embedded
      const adminToken = 'admin-mock-token-with-superuser-privileges-' + Date.now();
      
      // Store the token in localStorage directly for API client access
      localStorage.setItem('auth-token', adminToken);
      
      // Update auth storage with admin user
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const authData = JSON.parse(authStorage);
          if (authData && authData.state) {
            // Update user with admin privileges
            if (authData.state.user) {
              authData.state.user.account_type = 'superuser';
              authData.state.user.role = 'admin';
              authData.state.user.permissions = ['admin', 'superuser'];
            } else {
              // Create mock admin user if none exists
              authData.state.user = {
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                account_type: 'superuser',
                role: 'admin',
                permissions: ['admin', 'superuser']
              };
            }
            
            // Ensure authenticated state
            authData.state.isAuthenticated = true;
            authData.state.token = adminToken;
            authData.state.isSuperuser = true;
            
            // Save updated auth data
            localStorage.setItem('auth-storage', JSON.stringify(authData));
          }
        }
      } catch (authError) {
        console.warn('⚠️ Could not update auth storage:', authError);
      }
      
      console.info('✅ Admin access enabled successfully!');
      return true;
    } catch (error) {
      console.error('❌ Error enabling admin access:', error);
      return false;
    }
  }
  
  // Run fixes
  const offlineFixed = fixOfflineMode();
  const adminFixed = fixAdminAccess();
  
  // Show summary
  console.info('📋 Fix Summary:');
  console.info(`- Offline Mode: ${offlineFixed ? '✅ Fixed' : '❌ Failed'}`);
  console.info(`- Admin Access: ${adminFixed ? '✅ Fixed' : '❌ Failed'}`);
  
  // Prompt for reload
  if (offlineFixed || adminFixed) {
    console.info('🔄 Please reload the page to apply changes.');
    
    // Create reload button in console
    console.info('%c Click here to reload the page ', 'background: #4CAF50; color: white; padding: 5px; border-radius: 4px; cursor: pointer;');
    
    // Add click handler for the reload message
    if (typeof console._commandLineAPI !== 'undefined') {
      console._commandLineAPI.clear();
    }
    
    // Offer to reload automatically
    if (confirm('Reload page now to apply changes?')) {
      window.location.reload();
    }
  }
  
  return {
    offlineFixed,
    adminFixed,
    reload: function() {
      window.location.reload();
    }
  };
})();
