// Direct script to reset offline mode and force reconnection

export function resetOfflineMode() {
  // Clear all offline flags
  localStorage.removeItem('offline_mode');
  localStorage.removeItem('bypass_auth_check');
  
  // Set a flag to indicate we're forcing online mode
  localStorage.setItem('force_online', 'true');
  
  console.log('Offline mode flags reset, forcing online mode');
  
  // Reload the page to apply changes
  window.location.reload();
}
