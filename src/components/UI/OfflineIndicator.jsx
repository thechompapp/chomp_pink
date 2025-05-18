import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { isOfflineMode, setOfflineMode } from '@/services/apiClient';

/**
 * Component that shows when the app is in offline mode
 */
const OfflineIndicator = () => {
  // Initialize with the current offline status
  const [offlineStatus, setOfflineStatus] = useState(() => {
    // Default to checking localStorage for backward compatibility
    if (typeof window === 'undefined') return false;
    return isOfflineMode ? isOfflineMode() : false;
  });
  
  useEffect(() => {
    // Function to check offline status using the imported function
    const checkOfflineStatus = () => {
      if (typeof isOfflineMode === 'function') {
        setOfflineStatus(isOfflineMode());
      } else {
        // Fallback for backward compatibility
        setOfflineStatus(
          typeof localStorage !== 'undefined' && 
          (localStorage.getItem('offline_mode') === 'true' || 
           localStorage.getItem('offline-mode') === 'true' ||
           sessionStorage.getItem('offline-mode') === 'true')
        );
      }
    };
    
    // Check when app loads
    checkOfflineStatus();
    
    // Set up interval to check periodically
    const interval = setInterval(checkOfflineStatus, 3000);
    
    // Set up event listener for offline status changes
    const handleOfflineStatusChange = () => {
      checkOfflineStatus();
    };
    
    window.addEventListener('offlineStatusChanged', handleOfflineStatusChange);
    window.addEventListener('online', handleOfflineStatusChange);
    window.addEventListener('offline', handleOfflineStatusChange);
    
    // Clean up interval and event listeners
    return () => {
      clearInterval(interval);
      window.removeEventListener('offlineStatusChanged', handleOfflineStatusChange);
      window.removeEventListener('online', handleOfflineStatusChange);
      window.removeEventListener('offline', handleOfflineStatusChange);
    };
  }, []);
  
  // Function to handle reconnecting to the server
  const handleReconnect = () => {
    // Reset offline flag
    localStorage.removeItem('offline_mode');
    localStorage.removeItem('offline-mode');
    sessionStorage.removeItem('offline-mode');
    localStorage.removeItem('bypass_auth_check');
    
    // Use the imported function directly
    setOfflineMode(false);
    
    // Force reload to restart all connections
    window.location.reload();
  };
  
  // Don't render anything if we're not offline
  if (!offlineStatus) return null;
  
  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-600 text-white px-3 py-2 rounded-md shadow-lg flex items-center space-x-2">
      <WifiOff size={18} />
      <span className="text-sm font-medium">Offline Mode</span>
      <button 
        onClick={handleReconnect}
        className="ml-2 bg-white text-yellow-700 p-1 rounded-full hover:bg-yellow-100 transition-colors"
        title="Try to reconnect"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
};

export default OfflineIndicator;
