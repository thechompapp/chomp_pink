// src/tests/auth-system-test.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import authService from '@/services/auth/authService';
import tokenManager from '@/services/auth/tokenManager';
import { logInfo, logError } from '@/utils/logger';

/**
 * Authentication System Test Component
 * 
 * This component tests the new authentication system functionality:
 * - Login/logout
 * - Token management
 * - Admin authentication
 * - Error handling
 */
const AuthSystemTest = () => {
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testStatus, setTestStatus] = useState('idle');
  
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout,
    isLoading,
    error,
    isSuperuser 
  } = useAuth();
  
  const { isAdmin, hasPermission } = useAdminAuth();
  
  /**
   * Run all authentication tests
   */
  const runTests = async () => {
    setIsRunningTests(true);
    setTestStatus('running');
    setTestResults({});
    
    const results = {};
    
    try {
      // Test 1: Check initial state
      results.initialState = {
        status: 'passed',
        data: {
          isAuthenticated,
          user: user ? 'User object exists' : 'No user',
          isLoading,
          error: error ? error.message : 'No error'
        }
      };
      
      // Test 2: Login with invalid credentials
      try {
        await login({ email: 'invalid@example.com', password: 'wrongpassword' });
        results.invalidLogin = {
          status: 'failed',
          message: 'Login with invalid credentials should have failed'
        };
      } catch (error) {
        results.invalidLogin = {
          status: 'passed',
          message: 'Login with invalid credentials failed as expected',
          error: error.message
        };
      }
      
      // Test 3: Login with valid credentials
      try {
        // Use admin credentials for testing
        await login({ email: 'admin@example.com', password: 'doof123' });
        
        results.validLogin = {
          status: 'passed',
          data: {
            isAuthenticated: true,
            user: user ? 'User object exists' : 'No user',
            isSuperuser
          }
        };
      } catch (error) {
        results.validLogin = {
          status: 'failed',
          message: 'Login with valid credentials failed',
          error: error.message
        };
      }
      
      // Test 4: Check token management
      const hasAccessToken = tokenManager.getAccessToken() !== null;
      const hasRefreshToken = tokenManager.getRefreshToken() !== null;
      const tokensValid = tokenManager.hasValidTokens();
      
      results.tokenManagement = {
        status: hasAccessToken && hasRefreshToken && tokensValid ? 'passed' : 'failed',
        data: {
          hasAccessToken,
          hasRefreshToken,
          tokensValid
        }
      };
      
      // Test 5: Check admin authentication
      results.adminAuth = {
        status: 'passed',
        data: {
          isAdmin,
          hasAdminPermission: hasPermission('admin'),
          hasCreatePermission: hasPermission('create')
        }
      };
      
      // Test 6: Test direct service calls
      try {
        const isAuthenticatedResult = await authService.isAuthenticated();
        const currentUser = await authService.getCurrentUser();
        
        results.serviceDirectCalls = {
          status: 'passed',
          data: {
            isAuthenticated: isAuthenticatedResult,
            currentUser: currentUser ? 'User object exists' : 'No user'
          }
        };
      } catch (error) {
        results.serviceDirectCalls = {
          status: 'failed',
          message: 'Direct service calls failed',
          error: error.message
        };
      }
      
      // Test 7: Logout
      try {
        await logout();
        
        const loggedOut = !isAuthenticated && !user;
        const tokensCleared = !tokenManager.hasValidTokens();
        
        results.logout = {
          status: loggedOut && tokensCleared ? 'passed' : 'failed',
          data: {
            isAuthenticated: !isAuthenticated,
            user: user ? 'User still exists' : 'No user',
            tokensCleared
          }
        };
      } catch (error) {
        results.logout = {
          status: 'failed',
          message: 'Logout failed',
          error: error.message
        };
      }
      
      setTestStatus('completed');
    } catch (error) {
      logError('[AuthSystemTest] Error running tests:', error);
      setTestStatus('error');
      results.error = {
        message: 'Error running tests',
        error: error.message
      };
    } finally {
      setTestResults(results);
      setIsRunningTests(false);
    }
  };
  
  /**
   * Calculate overall test status
   */
  const getOverallStatus = () => {
    if (testStatus === 'idle') return 'Not started';
    if (testStatus === 'running') return 'Running...';
    if (testStatus === 'error') return 'Error running tests';
    
    const testCount = Object.keys(testResults).length;
    const passedCount = Object.values(testResults).filter(r => r.status === 'passed').length;
    
    return `${passedCount}/${testCount} tests passed`;
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication System Test</h1>
      
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isRunningTests}
          className={`px-4 py-2 rounded ${
            isRunningTests 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isRunningTests ? 'Running Tests...' : 'Run Tests'}
        </button>
        
        <div className="mt-2">
          <strong>Status:</strong> {getOverallStatus()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Auth State */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Current Authentication State</h2>
          <div className="space-y-2">
            <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
            <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
            <div><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'Not logged in'}</div>
            <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
            <div><strong>Is Superuser:</strong> {isSuperuser ? 'Yes' : 'No'}</div>
            <div><strong>Error:</strong> {error ? error.message : 'None'}</div>
          </div>
        </div>
        
        {/* Token Information */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Token Information</h2>
          <div className="space-y-2">
            <div><strong>Access Token:</strong> {tokenManager.getAccessToken() ? 'Present' : 'None'}</div>
            <div><strong>Refresh Token:</strong> {tokenManager.getRefreshToken() ? 'Present' : 'None'}</div>
            <div><strong>Tokens Valid:</strong> {tokenManager.hasValidTokens() ? 'Yes' : 'No'}</div>
            <div><strong>Token Expiry:</strong> {tokenManager.getTokenExpiry() || 'N/A'}</div>
          </div>
        </div>
      </div>
      
      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="space-y-4">
            {Object.entries(testResults).map(([testName, result]) => (
              <div key={testName} className="border rounded p-4">
                <h3 className="text-lg font-medium mb-2">
                  {testName}
                  <span 
                    className={`ml-2 px-2 py-1 text-sm rounded ${
                      result.status === 'passed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.status}
                  </span>
                </h3>
                
                {result.message && (
                  <div className="mb-2">{result.message}</div>
                )}
                
                {result.error && (
                  <div className="text-red-600 mb-2">Error: {result.error}</div>
                )}
                
                {result.data && (
                  <pre className="bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthSystemTest;
