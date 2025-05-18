// admin-fix.js
// Quick fix for admin panel authentication issues

(function() {
  // Admin API key - must match the key in your backend .env file
  const ADMIN_API_KEY = 'doof-admin-secret-key-dev';
  
  // Clear any network-related settings in localStorage
  localStorage.removeItem('offline_mode');
  localStorage.removeItem('bypass_auth_check');
  localStorage.setItem('force_online', 'true');
  
  // Set admin authentication data
  localStorage.setItem('admin_api_key', ADMIN_API_KEY);
  localStorage.setItem('admin_access_enabled', 'true');
  localStorage.setItem('superuser_override', 'true');
  
  console.log('✅ Admin authentication headers configured.');
  console.log('📋 Instructions:');
  console.log('1. Reload the page');
  console.log('2. If issues persist, check the backend server logs for authentication errors');
  
  // Return true so it's clear the script executed successfully
  return true;
})(); 