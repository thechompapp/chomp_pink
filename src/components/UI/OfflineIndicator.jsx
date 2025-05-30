import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { isOfflineMode, setOfflineMode } from '@/services/apiClient';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore

/**
 * Component that shows when the app is in offline mode
 * Updated to respect authentication state
 */
const OfflineIndicator = () => {
  const { isAuthenticated  } = useAuth();
  // Initialize with the current offline status
  const [offlineStatus, setOfflineStatus] = useState(() => {
    // Default to checking localStorage for backward compatibility
    if (typeof window === 'undefined') return false;
    // If authenticated, never show offline mode
    if (isAuthenticated) return false;
    return isOfflineMode ? isOfflineMode() : false;
  });
  
  useEffect(() => {
    // Function to check offline status using the imported function
    const checkOfflineStatus = () => {
      // If authenticated, never show offline mode
      if (isAuthenticated) {
        setOfflineStatus(false);
        return;
      }
      
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
    
    // Use event-driven approach instead of polling
    // Only check when specific events occur
    const handleOfflineStatusChange = () => {
      checkOfflineStatus();
    };
    
    // Set up event listeners for relevant changes
    window.addEventListener('offlineStatusChanged', handleOfflineStatusChange);
    window.addEventListener('online', handleOfflineStatusChange);
    window.addEventListener('offline', handleOfflineStatusChange);
    window.addEventListener('auth:login_complete', handleOfflineStatusChange);
    window.addEventListener('auth:logout_complete', handleOfflineStatusChange);
    
    // Optional: Very infrequent polling as fallback (every 60 seconds instead of 3)
    const interval = setInterval(checkOfflineStatus, 60000);
    
    // Clean up interval and event listeners
    return () => {
      clearInterval(interval);
      window.removeEventListener('offlineStatusChanged', handleOfflineStatusChange);
      window.removeEventListener('online', handleOfflineStatusChange);
      window.removeEventListener('offline', handleOfflineStatusChange);
      window.removeEventListener('auth:login_complete', handleOfflineStatusChange);
      window.removeEventListener('auth:logout_complete', handleOfflineStatusChange);
    };
  }, [isAuthenticated]);
  
  // Function to handle reconnecting to the server
  const handleReconnect = () => {
    // Reset offline flag
    localStorage.removeItem('offline_mode');
    localStorage.removeItem('offline-mode');
    sessionStorage.removeItem('offline-mode');
    localStorage.removeItem('bypass_auth_check');
    
    // Force online mode
    localStorage.setItem('force_online', 'true');
    
    // Use the imported function directly
    setOfflineMode(false);
    
    // Trigger auth check if authenticated
    if (isAuthenticated) {
      // Dispatch event to notify auth system to refresh
      window.dispatchEvent(new CustomEvent('auth:refresh_requested'));
    }
    
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
