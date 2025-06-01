/**
 * Emergency Reset Utility
 * 
 * Provides functions to reset authentication state and break infinite loops
 */

/**
 * Emergency reset function to break infinite authentication loops
 * Call this from browser console: window.emergencyReset()
 */
export function emergencyReset() {
  console.log('🚨 EMERGENCY RESET: Clearing all authentication state...');
  
  try {
    // Clear all authentication-related localStorage
    const authKeys = [
      'auth-storage',
      'auth-authentication-storage', 
      'auth-token',
      'authToken',
      'token',
      'userData',
      'currentUser',
      'admin_access_enabled',
      'superuser_override',
      'admin_api_key',
      'bypass_auth_check',
      'dev_admin_setup',
      'user_explicitly_logged_out',
      'e2e_testing_mode',
      'refreshToken'
    ];
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✅ Cleared: ${key}`);
    });
    
    // Clear session storage
    sessionStorage.clear();
    console.log('✅ Cleared session storage');
    
    // Set explicit logout flag to prevent auto-restoration
    localStorage.setItem('user_explicitly_logged_out', 'true');
    console.log('✅ Set explicit logout flag');
    
    // Disable AdminAuthSetup if it exists
    if (window.AdminAuthSetup) {
      window.AdminAuthSetup.isInitializing = false;
      window.AdminAuthSetup.isRestoringAuth = false;
      window.AdminAuthSetup.isSettingUpAuth = false;
      console.log('✅ Reset AdminAuthSetup flags');
    }
    
    // Reload the page to ensure clean state
    console.log('🔄 Reloading page in 2 seconds...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    return true;
  } catch (error) {
    console.error('❌ Emergency reset failed:', error);
    return false;
  }
}

/**
 * Quick auth state check
 */
export function checkAuthState() {
  console.log('🔍 Current Authentication State:');
  
  const authKeys = [
    'auth-storage',
    'auth-authentication-storage',
    'authToken',
    'userData',
    'admin_access_enabled',
    'superuser_override',
    'user_explicitly_logged_out',
    'e2e_testing_mode'
  ];
  
  authKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}: ${value ? '✅ Present' : '❌ Missing'}`);
    if (value && key.includes('storage')) {
      try {
        const parsed = JSON.parse(value);
        console.log(`  └─ Parsed:`, parsed);
      } catch (e) {
        console.log(`  └─ Invalid JSON`);
      }
    }
  });
  
  // Check AdminAuthSetup state
  if (window.AdminAuthSetup) {
    console.log('AdminAuthSetup flags:');
    console.log(`  isInitializing: ${window.AdminAuthSetup.isInitializing}`);
    console.log(`  isRestoringAuth: ${window.AdminAuthSetup.isRestoringAuth}`);
    console.log(`  isSettingUpAuth: ${window.AdminAuthSetup.isSettingUpAuth}`);
  }
}

/**
 * Safe login for development
 */
export function safeDevLogin() {
  console.log('🔐 Attempting safe development login...');
  
  // First clear any problematic state
  localStorage.removeItem('user_explicitly_logged_out');
  localStorage.removeItem('e2e_testing_mode');
  
  // Set up minimal auth state
  const mockUser = {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    account_type: 'superuser',
    role: 'admin'
  };
  
  const authToken = 'dev-token-' + Date.now();
  
  // Set basic auth storage
  localStorage.setItem('authToken', authToken);
  localStorage.setItem('userData', JSON.stringify(mockUser));
  localStorage.setItem('admin_access_enabled', 'true');
  localStorage.setItem('superuser_override', 'true');
  
  console.log('✅ Safe development login complete');
  console.log('🔄 Reloading page...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Make functions available globally for emergency use
if (typeof window !== 'undefined') {
  window.emergencyReset = emergencyReset;
  window.checkAuthState = checkAuthState;
  window.safeDevLogin = safeDevLogin;
  
  console.log('🛠️ Emergency utilities loaded:');
  console.log('  - window.emergencyReset() - Clear all auth state');
  console.log('  - window.checkAuthState() - Check current state');
  console.log('  - window.safeDevLogin() - Safe development login');
} 