/**
 * Development Mode Setup
 * 
 * This module is automatically imported in the main application entry point
 * and sets up development mode utilities and fixes common issues.
 */

import { disableOfflineMode } from './offlineMode';
import { enableAdminAccess } from './authUtils';

// Only run in development mode
if (process.env.NODE_ENV === 'development') {
  console.info('[DevModeSetup] Initializing development mode utilities...');
  
  // Fix offline mode on startup
  if (localStorage.getItem('force_online') !== 'true') {
    disableOfflineMode();
    console.info('[DevModeSetup] Disabled offline mode on startup');
  }
  
  // Enable admin access for development
  if (localStorage.getItem('admin_access_enabled') !== 'true') {
    enableAdminAccess();
    console.info('[DevModeSetup] Enabled admin access for development');
  }
  
  // Add event listener for offline status changes
  window.addEventListener('offlineStatusChanged', (event) => {
    console.info(`[DevModeSetup] Offline status changed: ${event.detail.offline ? 'OFFLINE' : 'ONLINE'}`);
  });
}

export default {
  // This module doesn't export any functions, it's auto-executed on import
};
