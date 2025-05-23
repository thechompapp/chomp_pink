/**
 * Comprehensive Clear Offline Mode Script
 * 
 * Run this in your browser console while the app is open to force online mode
 * This handles all the specific offline mode flags found in the API client
 */

console.log('🔧 Comprehensive offline mode clearing...');

// Clear all possible offline mode indicators (from API client analysis)
const offlineKeys = [
  'offline-mode',
  'offline_mode', 
  'chomp_offline_mode',
  'offlineMode',
  'isOffline'
];

// Clear cached data keys
const cacheKeys = [
  'cachedLists',
  'cached_lists',
  'offlineData',
  'offline_data'
];

// Force online mode keys
const onlineKeys = [
  'force_online',
  'forceOnline',
  'user_explicitly_logged_out'
];

console.log('🗑️ Clearing offline mode flags...');
offlineKeys.forEach(key => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
  console.log(`   Removed: ${key}`);
});

console.log('🗑️ Clearing cached data...');
cacheKeys.forEach(key => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
  console.log(`   Removed: ${key}`);
});

console.log('📡 Setting force online flags...');
localStorage.setItem('force_online', 'true');
localStorage.setItem('forceOnline', 'true');
localStorage.removeItem('user_explicitly_logged_out');

// Clear session storage completely to be safe
console.log('🧹 Clearing session storage...');
sessionStorage.clear();

// Check for any auth-related flags that might interfere
console.log('🔐 Checking auth state...');
const authStorage = localStorage.getItem('auth-storage');
if (authStorage) {
  try {
    const authData = JSON.parse(authStorage);
    console.log('   Auth state found:', authData?.state?.isAuthenticated ? 'authenticated' : 'not authenticated');
  } catch (e) {
    console.warn('   Could not parse auth storage');
  }
}

// Dispatch offline status change event to notify components
console.log('📢 Dispatching offline status change event...');
if (window.dispatchEvent) {
  window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
    detail: { isOffline: false }
  }));
}

console.log('✅ All offline mode flags cleared');
console.log('📡 Online mode forced');
console.log('🔄 Reloading in 2 seconds...');

// Show current localStorage state for debugging
console.log('🔍 Current localStorage relevant keys:');
Object.keys(localStorage).filter(key => 
  key.includes('offline') || 
  key.includes('online') || 
  key.includes('cache') ||
  key.includes('auth')
).forEach(key => {
  console.log(`   ${key}: ${localStorage.getItem(key)}`);
});

// Reload the page after a short delay
setTimeout(() => {
    console.log('🔄 Reloading page...');
    location.reload();
}, 2000); 