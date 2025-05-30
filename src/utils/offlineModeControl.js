/**
 * Offline Mode Control Utility
 * 
 * Provides tools to debug, monitor, and control offline mode behavior
 * Use this when the app gets stuck in offline mode despite servers being up
 */

import { logInfo, logWarn, logError } from '@/utils/logger';

/**
 * Force the application to go online
 * Clears all offline mode flags and forces online state
 */
export function forceOnlineMode() {
  logInfo('[OfflineModeControl] Forcing application to online mode...');
  
  try {
    // Clear all possible offline mode storage locations
    const storageKeys = [
      'offline-mode',
      'offline_mode', 
      'dev-mode-no-backend',
      'dev_mode_no_backend',
      'OFFLINE_MODE',
      'DEV_MODE_NO_BACKEND'
    ];
    
    // Clear from localStorage
    if (typeof localStorage !== 'undefined') {
      storageKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Set explicit online flags
      localStorage.setItem('force_online', 'true');
      localStorage.setItem('network_override', 'online');
      localStorage.removeItem('user_explicitly_logged_out');
    }
    
    // Clear from sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      storageKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      sessionStorage.setItem('force_online', 'true');
    }
    
    // Dispatch events to notify all components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:force_online', {
        detail: { timestamp: Date.now() }
      }));
      
      window.dispatchEvent(new CustomEvent('offlineStatusChanged', {
        detail: { isOffline: false, forced: true }
      }));
      
      // Trigger online event
      window.dispatchEvent(new Event('online'));
    }
    
    logInfo('[OfflineModeControl] Successfully forced online mode');
    return true;
  } catch (error) {
    logError('[OfflineModeControl] Error forcing online mode:', error);
    return false;
  }
}

/**
 * Get comprehensive offline mode status
 * @returns {Object} Detailed offline mode status
 */
export function getOfflineModeStatus() {
  const status = {
    timestamp: new Date().toISOString(),
    browserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    storage: {},
    environment: {},
    flags: {}
  };
  
  // Check localStorage
  if (typeof localStorage !== 'undefined') {
    status.storage.localStorage = {
      'offline-mode': localStorage.getItem('offline-mode'),
      'dev-mode-no-backend': localStorage.getItem('dev-mode-no-backend'), 
      'force_online': localStorage.getItem('force_online'),
      'network_override': localStorage.getItem('network_override'),
      'user_explicitly_logged_out': localStorage.getItem('user_explicitly_logged_out')
    };
  }
  
  // Check sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    status.storage.sessionStorage = {
      'offline-mode': sessionStorage.getItem('offline-mode'),
      'dev-mode-no-backend': sessionStorage.getItem('dev-mode-no-backend'),
      'force_online': sessionStorage.getItem('force_online')
    };
  }
  
  // Check environment
  status.environment = {
    nodeEnv: getEnvVar('NODE_ENV'),
    viteMode: getEnvVar('VITE_MODE'),
    isDevelopment: isDevelopmentEnv()
  };
  
  // Check auth status
  try {
    const authStorage = localStorage.getItem('auth-storage') || localStorage.getItem('auth-authentication-storage');
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      status.auth = {
        isAuthenticated: authData?.state?.isAuthenticated || false,
        hasUser: !!authData?.state?.user,
        hasToken: !!authData?.state?.token
      };
    }
  } catch (err) {
    status.auth = { error: err.message };
  }
  
  return status;
}

/**
 * Safe environment variable access
 */
function getEnvVar(key) {
  // Check Vite environment variables first (import.meta is always available in ES modules)
  if (import.meta && import.meta.env) {
    return import.meta.env[key];
  }
  // Check process.env if available (Node.js/webpack environments)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  // Check window environment variables as fallback
  if (typeof window !== 'undefined' && window.__ENV__) {
    return window.__ENV__[key];
  }
  return undefined;
}

/**
 * Check if we're in development environment
 */
function isDevelopmentEnv() {
  const nodeEnv = getEnvVar('NODE_ENV') || getEnvVar('VITE_MODE') || 'development';
  return nodeEnv === 'development';
}

/**
 * Log comprehensive offline mode status to console
 */
export function logOfflineModeStatus() {
  const status = getOfflineModeStatus();
  console.group('🔍 Offline Mode Status Debug');
  console.log('📊 Status:', status);
  console.log('🌐 Browser Online:', status.browserOnline);
  console.log('💾 Storage:', status.storage);
  console.log('🔧 Environment:', status.environment);
  console.log('🔐 Auth:', status.auth);
  console.groupEnd();
  return status;
}

/**
 * Test network connectivity to the API
 * @param {string} apiBaseUrl - API base URL to test
 * @returns {Promise<boolean>} Whether the API is reachable
 */
export async function testApiConnectivity(apiBaseUrl = null) {
  // Get API base URL from various sources
  const baseUrl = apiBaseUrl || 
                  getEnvVar('VITE_API_BASE_URL') || 
                  getEnvVar('REACT_APP_API_URL') ||
                  (typeof window !== 'undefined' && window.__API_BASE_URL__) ||
                  'http://localhost:5001/api';
  
  logInfo('[OfflineModeControl] Testing API connectivity to:', baseUrl);
  
  try {
    // Test with a simple endpoint
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    const isConnected = response.ok || response.status < 500;
    logInfo('[OfflineModeControl] API connectivity test result:', isConnected);
    return isConnected;
  } catch (error) {
    logWarn('[OfflineModeControl] API connectivity test failed:', error.message);
    return false;
  }
}

/**
 * Auto-fix offline mode issues
 * Attempts to resolve common offline mode problems
 */
export async function autoFixOfflineMode() {
  logInfo('[OfflineModeControl] Auto-fixing offline mode issues...');
  
  // Auto-fix is currently disabled to prevent refresh loops
  logInfo('[OfflineModeControl] Auto-fix disabled to prevent refresh loops');
  return ['Auto-fix disabled to prevent refresh loops'];
}

/**
 * Add debug controls to window object for manual testing
 */
export function enableOfflineModeDebugControls() {
  if (typeof window !== 'undefined') {
    window.offlineModeDebug = {
      forceOnline: forceOnlineMode,
      getStatus: getOfflineModeStatus,
      logStatus: logOfflineModeStatus,
      testApi: testApiConnectivity,
      autoFix: autoFixOfflineMode
    };
    
    console.log('🛠️ Offline Mode Debug Controls enabled!');
    console.log('Available commands:');
    console.log('  window.offlineModeDebug.forceOnline() - Force app online');
    console.log('  window.offlineModeDebug.getStatus() - Get detailed status');
    console.log('  window.offlineModeDebug.logStatus() - Log status to console');
    console.log('  window.offlineModeDebug.testApi() - Test API connectivity');
    console.log('  window.offlineModeDebug.autoFix() - Auto-fix offline issues');
  }
}

// Auto-enable debug controls in development
if (isDevelopmentEnv() && typeof window !== 'undefined') {
  enableOfflineModeDebugControls();
} 