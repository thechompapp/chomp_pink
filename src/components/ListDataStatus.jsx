/* src/components/ListDataStatus.jsx */
import React, { useEffect, useState } from 'react';
import { listService } from '@/services/listService';

export default function ListDataStatus() {
  const [status, setStatus] = useState({
    usesMockData: false,
    hasListOperation: false,
    listOperationTime: null
  });

  // Refresh data every second to keep UI updated
  useEffect(() => {
    const checkStatus = () => {
      const usesMockData = localStorage.getItem('use_mock_data') === 'true';
      const recentListOp = localStorage.getItem('recent_list_operation');
      const listOpTime = recentListOp ? new Date(parseInt(recentListOp, 10)) : null;
      
      setStatus({
        usesMockData,
        hasListOperation: !!recentListOp,
        listOperationTime: listOpTime
      });
    };
    
    // Initial check
    checkStatus();
    
    // Set up interval
    const interval = setInterval(checkStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const forceRealData = () => {
    localStorage.removeItem('use_mock_data');
    localStorage.setItem('recent_list_operation', Date.now().toString());
    console.log('Forced real data mode');
    
    // Force refresh all list data
    window.dispatchEvent(new CustomEvent('listItemAdded', { 
      detail: { forceRefresh: true }
    }));
  };
  
  const toggleMockData = () => {
    const current = localStorage.getItem('use_mock_data') === 'true';
    localStorage.setItem('use_mock_data', current ? 'false' : 'true');
    console.log(`Toggled mock data: ${!current}`);
  };
  
  if (!status.usesMockData && !status.hasListOperation) {
    return null; // Don't show anything when everything is normal
  }
  
  return (
    <div className="fixed bottom-4 left-4 bg-white shadow-lg p-4 rounded-lg border border-gray-300 z-20 text-xs max-w-xs">
      <h3 className="font-bold mb-2">Data Status</h3>
      <div className="mb-2">
        <div className={`${status.usesMockData ? 'text-red-600' : 'text-green-600'}`}>
          Using {status.usesMockData ? 'MOCK DATA' : 'REAL DATA'}
        </div>
        {status.hasListOperation && (
          <div className="text-blue-600">
            Recent list operation: {status.listOperationTime?.toLocaleTimeString()}
          </div>
        )}
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={forceRealData}
          className="bg-green-600 text-white px-2 py-1 rounded text-xs"
        >
          Force Real Data
        </button>
        <button 
          onClick={toggleMockData}
          className="bg-gray-600 text-white px-2 py-1 rounded text-xs"
        >
          Toggle Mock
        </button>
      </div>
    </div>
  );
}
