// src/components/UI/DevModeToggle.jsx
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Cog, Bug } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { logDebug } from '@/utils/logger';

/**
 * Development mode toggle component - only shown in development
 * Allows toggling various development features
 */
const DevModeToggle = () => {
  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;
  
  const [isOpen, setIsOpen] = useState(false);
  const [bypassAuthCheck, setBypassAuthCheck] = useState(
    localStorage.getItem('bypass_auth_check') === 'true'
  );
  const [useMockData, setUseMockData] = useState(
    localStorage.getItem('use_mock_data') === 'true'
  );
  
  // Avoid unnecessary re-renders by using a stable reference
  const { checkAuthStatus: checkAuthStatus } = useAuth();
  
  // Use useCallback to prevent function recreation on every render
  const toggleBypassAuth = useCallback(() => {
    setBypassAuthCheck(prevState => {
      const newValue = !prevState;
      localStorage.setItem('bypass_auth_check', newValue ? 'true' : 'false');
      logDebug(`[DevMode] ${newValue ? 'Enabled' : 'Disabled'} auth bypass mode`);
      
      // Force auth check
      if (!newValue) {
        setTimeout(() => {
          checkAuthStatus(true);
        }, 100);
      }
      
      return newValue;
    });
  }, [checkAuthStatus]);
  
  // Use useCallback for this function too
  const toggleMockData = useCallback(() => {
    setUseMockData(prevState => {
      const newValue = !prevState;
      localStorage.setItem('use_mock_data', newValue ? 'true' : 'false');
      logDebug(`[DevMode] ${newValue ? 'Enabled' : 'Disabled'} mock data mode`);
      
      // Force reload to apply changes
      window.location.reload();
      return newValue; // Not actually used due to reload, but good practice
    });
  }, []);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
        title="Development Tools"
      >
        {isOpen ? <Bug size={20} /> : <Cog size={20} />}
      </button>
      
      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white shadow-xl border border-gray-200 rounded-lg p-3 w-64">
          <div className="text-sm font-semibold mb-2 pb-1 border-b border-gray-200">
            Developer Settings
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm cursor-pointer" htmlFor="bypass-auth">
                Bypass Auth Checks
              </label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input 
                  id="bypass-auth"
                  type="checkbox" 
                  checked={bypassAuthCheck}
                  onChange={toggleBypassAuth}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${bypassAuthCheck ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white border-2 rounded-full w-4 h-4 transition ${bypassAuthCheck ? 'transform translate-x-4 border-green-500' : 'border-gray-300'}`}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm cursor-pointer" htmlFor="use-mock-data">
                Use Mock Data
              </label>
              <div className="relative inline-block w-10 align-middle select-none">
                <input 
                  id="use-mock-data"
                  type="checkbox" 
                  checked={useMockData}
                  onChange={toggleMockData}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${useMockData ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white border-2 rounded-full w-4 h-4 transition ${useMockData ? 'transform translate-x-4 border-green-500' : 'border-gray-300'}`}></div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-400">
            Only visible in development mode
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(DevModeToggle);
