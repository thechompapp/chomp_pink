import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { networkUtils } from '@/services/apiClient';

/**
 * Component that shows when the app is in offline mode
 */
const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(
    typeof localStorage !== 'undefined' && localStorage.getItem('offline_mode') === 'true'
  );
  
  useEffect(() => {
    // Function to check offline status
    const checkOfflineStatus = () => {
      setIsOffline(
        typeof localStorage !== 'undefined' && localStorage.getItem('offline_mode') === 'true'
      );
    };
    
    // Check when app loads
    checkOfflineStatus();
    
    // Set up interval to check periodically
    const interval = setInterval(checkOfflineStatus, 5000);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, []);
  
  // Function to handle reconnecting to the server
  const handleReconnect = () => {
    // Reset offline flag
    localStorage.removeItem('offline_mode');
    localStorage.removeItem('bypass_auth_check');
    
    if (networkUtils) {
      networkUtils.setOfflineMode(false);
    }
    
    // Force reload to restart all connections
    window.location.reload();
  };
  
  // Don't render anything if we're not offline
  if (!isOffline) return null;
  
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
