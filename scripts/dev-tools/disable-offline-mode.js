// disable-offline-mode.js
// Script to disable offline mode and reset the application state

// Remove offline mode flags
localStorage.removeItem('offline_mode');
localStorage.removeItem('bypass_auth_check');

// Remove development mode no backend flag
sessionStorage.removeItem('dev_mode_no_backend');

// Force online mode
localStorage.setItem('force_online', 'true');

// Reset any cached values in memory
if (window._offlineModeCache !== undefined) {
  window._offlineModeCache = false;
}

if (window._developmentModeNoBackend !== undefined) {
  window._developmentModeNoBackend = false;
}

console.log('Offline mode disabled successfully. Application will use real API requests now.');

// Reload the application to apply changes
window.location.reload();