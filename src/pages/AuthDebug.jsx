import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth';
import { logInfo, logError } from '../utils/logger';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';

const AuthDebug = () => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    login, 
    logout, 
    checkAuthStatus,
    isSuperuser 
  } = useAuth();
  
  const [debugInfo, setDebugInfo] = useState({});
  const [testCredentials, setTestCredentials] = useState({
    email: 'admin@example.com',
    password: 'doof123'
  });

  // Collect debug information
  useEffect(() => {
    const collectDebugInfo = () => {
      const authToken = localStorage.getItem('auth-token');
      const authStorage = localStorage.getItem('auth-authentication-storage');
      const explicitlyLoggedOut = localStorage.getItem('user_explicitly_logged_out');
      const offlineMode = localStorage.getItem('offline_mode');
      
      setDebugInfo({
        // Environment
        isDevelopment: process.env.NODE_ENV === 'development',
        hostname: window.location.hostname,
        
        // Auth Context State
        isAuthenticated,
        isLoading,
        user: user ? { ...user, password_hash: '[REDACTED]' } : null,
        isSuperuser,
        error,
        
        // localStorage
        authToken: authToken ? `${authToken.substring(0, 20)}...` : null,
        authStorage: authStorage ? JSON.parse(authStorage) : null,
        explicitlyLoggedOut,
        offlineMode,
        
        // Timestamps
        timestamp: new Date().toISOString(),
      });
    };

    collectDebugInfo();
    const interval = setInterval(collectDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, user, isSuperuser, error]);

  const handleTestLogin = async () => {
    try {
      logInfo('[AuthDebug] Testing login with:', testCredentials.email);
      await login(testCredentials);
      logInfo('[AuthDebug] Login test completed');
    } catch (error) {
      logError('[AuthDebug] Login test failed:', error);
    }
  };

  const handleTestLogout = async () => {
    try {
      logInfo('[AuthDebug] Testing logout');
      await logout();
      logInfo('[AuthDebug] Logout test completed');
    } catch (error) {
      logError('[AuthDebug] Logout test failed:', error);
    }
  };

  const handleCheckAuth = async () => {
    try {
      logInfo('[AuthDebug] Checking auth status');
      await checkAuthStatus(true);
      logInfo('[AuthDebug] Auth status check completed');
    } catch (error) {
      logError('[AuthDebug] Auth status check failed:', error);
    }
  };

  const handleClearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Authentication Debug Panel</h1>
      
      {/* Current Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Current Authentication Status</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Authenticated:</span> 
            <span className={`ml-2 px-2 py-1 rounded ${isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isAuthenticated ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Loading:</span> 
            <span className={`ml-2 px-2 py-1 rounded ${isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
              {isLoading ? '⏳ Yes' : '✅ No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Superuser:</span> 
            <span className={`ml-2 px-2 py-1 rounded ${isSuperuser ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {isSuperuser ? '👑 Yes' : '👤 No'}
            </span>
          </div>
          <div>
            <span className="font-medium">User:</span> 
            <span className="ml-2">{user ? user.email || user.username : 'None'}</span>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Test Login */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Test Authentication</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={testCredentials.email}
                onChange={(e) => setTestCredentials(prev => ({...prev, email: e.target.value}))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                value={testCredentials.password}
                onChange={(e) => setTestCredentials(prev => ({...prev, password: e.target.value}))}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleTestLogin} disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Test Login'}
            </Button>
            <Button onClick={handleTestLogout} variant="outline" disabled={!isAuthenticated}>
              Test Logout
            </Button>
            <Button onClick={handleCheckAuth} variant="outline">
              Check Auth Status
            </Button>
            <Button onClick={handleClearStorage} variant="destructive">
              Clear Storage & Reload
            </Button>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-96">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Development Mode Info */}
      {debugInfo.isDevelopment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-800 mb-2">Development Mode Active</h3>
          <p className="text-blue-700 text-sm">
            In development mode, the authentication system should automatically grant admin access to authenticated users.
            If you're having login issues, try using the test credentials above or check the browser console for errors.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthDebug; 