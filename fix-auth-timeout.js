// fix-auth-timeout.js - Enhanced authentication bypass for development
// This script addresses the "Authentication check timed out" errors
// by properly configuring the auth store and API client

// Enable auth bypass for development
localStorage.setItem('bypass_auth_check', 'true');

// Force online mode to prevent offline restrictions
localStorage.setItem('force_online', 'true');
localStorage.removeItem('offline_mode');

// Create mock admin user data for development
const mockAdminUser = {
  id: 1,
  username: 'admin',
  email: 'admin@example.com',
  account_type: 'superuser'
};

// Set up auth storage with mock admin user
const authStorage = {
  state: {
    isAuthenticated: true,
    user: mockAdminUser,
    token: 'mock-token-for-development',
    isSuperuser: true,
    lastAuthCheck: Date.now()
  },
  version: 1
};

// Store auth data in localStorage
localStorage.setItem('auth-storage', JSON.stringify(authStorage));

// Log success message
console.log('✅ Authentication bypass enabled with admin user');
console.log('🔑 User:', mockAdminUser.email);
console.log('🛡️ Account type:', mockAdminUser.account_type);
console.log('⏱️ Timestamp:', new Date().toISOString());

// Force page reload to apply changes
setTimeout(() => {
  console.log('🔄 Reloading page to apply authentication fix...');
  window.location.reload();
}, 1000);
