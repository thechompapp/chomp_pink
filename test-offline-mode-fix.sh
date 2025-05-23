#!/bin/bash

# Test script for offline mode fix
# This script tests that offline mode is properly disabled when a user is authenticated

echo "===== Testing Offline Mode Fix ====="
echo "This script will verify that offline mode is properly disabled when a user is authenticated."
echo ""

# Check if the server is running
if ! curl -s http://localhost:5001/api/health > /dev/null; then
  echo "Error: API server is not running. Please start the server first."
  echo "Run: npm run start-servers"
  exit 1
fi

# Clear any existing offline mode flags
echo "Clearing existing offline mode flags..."
cat << EOF > clear-offline-flags.js
// Clear offline mode flags
localStorage.removeItem('offline-mode');
localStorage.removeItem('offline_mode');
sessionStorage.removeItem('offline-mode');
localStorage.setItem('force_online', 'true');

// Check if user is authenticated
const authStorage = localStorage.getItem('auth-storage');
let isAuthenticated = false;

try {
  if (authStorage) {
    const authData = JSON.parse(authStorage);
    isAuthenticated = authData?.state?.isAuthenticated || false;
    console.log('User is ' + (isAuthenticated ? 'authenticated' : 'not authenticated'));
  }
} catch (err) {
  console.error('Error parsing auth storage:', err);
}

// Report offline mode status
console.log('Offline mode status:');
console.log('- localStorage offline-mode:', localStorage.getItem('offline-mode'));
console.log('- localStorage offline_mode:', localStorage.getItem('offline_mode'));
console.log('- sessionStorage offline-mode:', sessionStorage.getItem('offline-mode'));
console.log('- force_online:', localStorage.getItem('force_online'));
EOF

echo "Checking current offline mode status..."
echo "Please open your browser console and paste the following code:"
echo ""
cat clear-offline-flags.js
echo ""

echo "Next steps:"
echo "1. Log in to the application with admin@example.com / doof123"
echo "2. Verify that admin features (Admin, Bulk Add) are visible in the navbar"
echo "3. Run the following code in your browser console to verify offline mode is disabled:"
echo ""
cat << EOF
// Check if offline mode is disabled
const isOffline = localStorage.getItem('offline-mode') === 'true' || 
                  localStorage.getItem('offline_mode') === 'true' || 
                  sessionStorage.getItem('offline-mode') === 'true';

console.log('Is offline mode enabled:', isOffline);
console.log('Is force online set:', localStorage.getItem('force_online') === 'true');

// Check if user is authenticated
const authStorage = localStorage.getItem('auth-storage');
let isAuthenticated = false;

try {
  if (authStorage) {
    const authData = JSON.parse(authStorage);
    isAuthenticated = authData?.state?.isAuthenticated || false;
    console.log('User is authenticated:', isAuthenticated);
    
    if (isAuthenticated) {
      console.log('User details:', authData.state.user);
      console.log('Is superuser:', authData.state.isSuperuser);
    }
  }
} catch (err) {
  console.error('Error parsing auth storage:', err);
}

// Test if admin features should be visible
console.log('Should admin features be visible:', isAuthenticated && !isOffline);
EOF

echo ""
echo "If 'Is offline mode enabled' is false and 'Should admin features be visible' is true,"
echo "then the fix is working correctly!"
