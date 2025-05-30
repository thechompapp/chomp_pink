/**
 * Authentication and Restaurant Functionality Debug Script
 * 
 * Run this in the browser console to test:
 * 1. Authentication persistence
 * 2. Restaurant address functionality
 * 3. Admin panel accessibility
 */

// Test 1: Check Authentication State
console.log('🔍 Testing Authentication State...');
const authStorage = localStorage.getItem('auth-authentication-storage');
if (authStorage) {
  const authData = JSON.parse(authStorage);
  console.log('✅ Auth data found in localStorage:', {
    isAuthenticated: authData?.state?.isAuthenticated,
    hasUser: !!authData?.state?.user,
    hasToken: !!authData?.state?.token,
    lastAuthCheck: authData?.state?.lastAuthCheck ? new Date(authData.state.lastAuthCheck).toLocaleString() : 'never',
    user: authData?.state?.user?.email
  });
} else {
  console.log('❌ No authentication data found in localStorage');
}

// Test 2: Check Session Cache Duration
const cacheAge = Date.now() - (authData?.state?.lastAuthCheck || 0);
const cacheValidMinutes = 30; // Should match AUTH_CONFIG.SESSION_CACHE_DURATION
console.log(`🕒 Cache age: ${Math.round(cacheAge / 1000)} seconds (valid for ${cacheValidMinutes} minutes)`);

// Test 3: Test API Calls
console.log('🌐 Testing API accessibility...');
fetch('/api/auth/status')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Auth status API response:', data);
  })
  .catch(error => {
    console.error('❌ Auth status API error:', error);
  });

// Test 4: Check for Restaurant Functionality
console.log('🍽️ Testing Restaurant Features...');
if (window.location.pathname.includes('/admin')) {
  console.log('✅ Already on admin panel');
  
  // Check for restaurants tab
  const restaurantTab = document.querySelector('button:contains("Restaurants"), [role="tab"]:contains("Restaurants")');
  if (restaurantTab) {
    console.log('✅ Restaurants tab found');
  } else {
    console.log('❌ Restaurants tab not found');
  }
  
  // Check for enhanced features notice
  const enhancedNotice = document.querySelector('*:contains("Google Places"), *:contains("Enhanced Features")');
  if (enhancedNotice) {
    console.log('✅ Enhanced features notice found');
  } else {
    console.log('❌ Enhanced features notice not found');
  }
} else {
  console.log('ℹ️ Navigate to /admin to test restaurant features');
}

// Test 5: Check for Intervals (should be minimal now)
console.log('⏱️ Checking for active intervals...');
const intervalCount = setInterval(() => {}, 999999); // Get a high interval ID
clearInterval(intervalCount);
console.log(`ℹ️ Estimated active intervals: ~${intervalCount} (should be low)`);

// Test 6: Monitor Auth Calls
console.log('📊 Monitoring auth calls for 30 seconds...');
let authCallCount = 0;
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0] && args[0].includes('/auth/status')) {
    authCallCount++;
    console.log(`🔔 Auth call #${authCallCount} at ${new Date().toLocaleTimeString()}`);
  }
  return originalFetch.apply(this, args);
};

setTimeout(() => {
  window.fetch = originalFetch; // Restore original fetch
  console.log(`📈 Total auth calls in 30 seconds: ${authCallCount} (should be 0-2 for good persistence)`);
}, 30000);

console.log('🎯 Debug script complete! Check console for results over the next 30 seconds.'); 