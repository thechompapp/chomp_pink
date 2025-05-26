/**
 * Debug utility for offline mode issues
 * Run this in the browser console to check and fix offline mode state
 */

const debugOfflineMode = {
  /**
   * Check the current offline mode state and related flags
   */
  checkState: () => {
    if (typeof window === 'undefined') {
      console.log('This utility must be run in the browser');
      return;
    }

    console.log('=== Offline Mode Debug ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Navigator Online:', navigator.onLine);
    
    // Check local storage
    console.log('\n=== Local Storage ===');
    const storageKeys = [
      'offline-mode',
      'offline_mode',
      'force_online',
      'use_mock_data',
      'auth-storage',
      'auth-token',
      'admin_access_enabled',
      'superuser_override',
      'user_explicitly_logged_out'
    ];
    
    storageKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        console.log(`localStorage.${key}:`, value);
      }
    });

    // Check session storage
    console.log('\n=== Session Storage ===');
    ['offline-mode', 'offline_mode'].forEach(key => {
      const value = sessionStorage.getItem(key);
      if (value !== null) {
        console.log(`sessionStorage.${key}:`, value);
      }
    });

    // Check if we're in development mode
    console.log('\n=== Development Mode Checks ===');
    console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
    console.log('process.env.REACT_APP_OFFLINE_MODE:', process.env.REACT_APP_OFFLINE_MODE);
  },

  /**
   * Force online mode by clearing all offline-related flags
   */
  forceOnline: () => {
    if (typeof window === 'undefined') return;
    
    // Clear local storage flags
    localStorage.removeItem('offline-mode');
    localStorage.removeItem('offline_mode');
    localStorage.setItem('force_online', 'true');
    localStorage.removeItem('use_mock_data');
    
    // Clear session storage flags
    sessionStorage.removeItem('offline-mode');
    sessionStorage.removeItem('offline_mode');
    
    console.log('Forced online mode. Refreshing page...');
    window.location.reload();
  },

  /**
   * Check if the app is in offline mode according to the API client
   */
  checkApiClientOfflineMode: () => {
    if (typeof window === 'undefined') return;
    
    try {
      // This assumes the apiClient is available in the window object
      if (window.apiClient) {
        const isOffline = window.apiClient.isOfflineMode();
        console.log('API Client Offline Mode:', isOffline);
        return isOffline;
      } else {
        console.log('API Client not found in window object');
        return null;
      }
    } catch (error) {
      console.error('Error checking API client offline mode:', error);
      return null;
    }
  }
};

// Make it available in the browser console
if (typeof window !== 'undefined') {
  window.debugOfflineMode = debugOfflineMode;
}

export default debugOfflineMode;
