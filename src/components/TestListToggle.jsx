/* src/components/TestListToggle.jsx */
import React, { useEffect, useState } from 'react';
import { listService } from '@/services/listService';
import { logDebug, logInfo, logError } from '@/utils/logger';

export default function TestListToggle() {
  const [testResults, setTestResults] = useState({
    status: 'idle',
    allListsCount: 0,
    followingListsCount: 0,
    error: null,
    mockDataFlag: localStorage.getItem('use_mock_data') === 'true',
    localStorageKeys: Object.keys(localStorage)
  });

  // Function to run the test
  const runTest = async () => {
    setTestResults(prev => ({ ...prev, status: 'running' }));
    
    try {
      // Clear mock data flag first to ensure fresh test
      localStorage.removeItem('use_mock_data');
      
      // Test 1: Get all lists
      logInfo('[TestListToggle] Testing all lists view');
      const allListsResult = await listService.getUserLists({ view: 'all' });
      const allListsCount = Array.isArray(allListsResult.data) ? allListsResult.data.length : 0;
      
      // Test 2: Get following lists
      logInfo('[TestListToggle] Testing following view');
      const followingListsResult = await listService.getUserLists({ view: 'following' });
      const followingListsCount = Array.isArray(followingListsResult.data) ? followingListsResult.data.length : 0;
      
      // Log full results for debugging
      logInfo('[TestListToggle] Test results:', {
        allLists: allListsResult,
        followingLists: followingListsResult,
        mockDataFlag: localStorage.getItem('use_mock_data') === 'true'
      });
      
      setTestResults({
        status: 'complete',
        allListsCount,
        followingListsCount,
        error: null,
        mockDataFlag: localStorage.getItem('use_mock_data') === 'true',
        localStorageKeys: Object.keys(localStorage)
      });
      
      // Force an event dispatch to update any components listening
      window.dispatchEvent(new CustomEvent('listToggleTestComplete', {
        detail: {
          success: true,
          allListsCount,
          followingListsCount
        }
      }));
      
      return { allListsCount, followingListsCount };
    } catch (error) {
      logError('[TestListToggle] Test failed:', error);
      
      setTestResults({
        status: 'error',
        error: error.message,
        mockDataFlag: localStorage.getItem('use_mock_data') === 'true',
        localStorageKeys: Object.keys(localStorage)
      });
      
      return { error: error.message };
    }
  };

  // Run test once on mount
  useEffect(() => {
    runTest();
  }, []);

  return (
    <div className="fixed top-4 left-4 z-20 bg-white p-4 rounded-lg shadow-lg border border-gray-300 text-xs max-w-xs">
      <h3 className="font-bold mb-2">List Toggle Test</h3>
      <div className="mb-2">
        <div>Status: <span className={
          testResults.status === 'complete' ? 'text-green-600' : 
          testResults.status === 'error' ? 'text-red-600' : 
          'text-blue-600'
        }>{testResults.status}</span></div>
        
        {testResults.status === 'complete' && (
          <>
            <div>All Lists Count: {testResults.allListsCount}</div>
            <div>Following Lists Count: {testResults.followingListsCount}</div>
            <div className={testResults.followingListsCount > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
              Toggle Status: {testResults.followingListsCount > 0 ? 'WORKING' : 'FAILING'}
            </div>
          </>
        )}
        
        {testResults.error && (
          <div className="text-red-600">{testResults.error}</div>
        )}
        
        <div className="mt-2">
          <div>Mock Data Flag: {testResults.mockDataFlag ? 'TRUE' : 'FALSE'}</div>
          <div className="text-xs text-gray-500 overflow-hidden overflow-ellipsis">
            localStorage keys: {testResults.localStorageKeys.join(', ')}
          </div>
        </div>
      </div>
      
      <button 
        onClick={runTest}
        className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
      >
        Run Test Again
      </button>
    </div>
  );
}
